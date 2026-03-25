import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor';
import Preview from '../components/Preview';
import ReactIDE from '../components/SandpackPreview';
import PromptInput from '../components/PromptInput';
import {
  generateCode,
  analyzeImage,
  generateCodeFromImage,
  setupProject,
  stopDevServer,
  streamGenerate,
} from '../services/api';
import './Home.css';


// ── Parse ===FILE_START:path===content===FILE_END=== blocks ─────────
function extractNewFiles(buffer, alreadyFound) {
  const result = {};
  // Match complete FILE_START ... FILE_END blocks
  const pattern = /===FILE_START:([^\n=][^\n]*?)===\n([\s\S]*?)===FILE_END===/g;
  let match;
  while ((match = pattern.exec(buffer)) !== null) {
    const path = match[1].trim();
    const content = match[2];           // keep content exactly as AI wrote it
    if (!alreadyFound.has(path)) {
      result[path] = content;
    }
  }
  return result;
}

function HomePage() {
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('preview');
  const [framework, setFramework] = useState('html');

  // React project state
  const [projectName, setProjectName] = useState(null);
  const [devServerPort, setDevServerPort] = useState(null);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupPhase, setSetupPhase] = useState('');
  const [setupError, setSetupError] = useState(null);
  const [deployLogs, setDeployLogs] = useState([]);

  // Streaming files — updated in real-time as AI generates each file
  const [streamingFiles, setStreamingFiles] = useState({});
  const [streamingFilePaths, setStreamingFilePaths] = useState([]);

  // Image
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Chat / response phases
  const [responsePhase, setResponsePhase] = useState('input');
  const [explanationText, setExplanationText] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [userRequest, setUserRequest] = useState('');

  // Resizable sidebar
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);

  const navigate = useNavigate();

  // ─── Resize ────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e) => { setIsResizing(true); e.preventDefault(); }, []);
  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;
    setSidebarWidth(Math.max(280, Math.min(e.clientX, window.innerWidth * 0.6)));
  }, [isResizing]);
  const handleMouseUp = useCallback(() => setIsResizing(false), []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // ─── Image upload ───────────────────────────────────────────────────
  const handleImageUpload = async (file) => {
    if (!file) { setUploadedImage(null); setImageAnalysis(null); setError(null); return; }
    setUploadedImage(file); setImageAnalysis(null); setIsAnalyzing(true); setError(null);
    try { setImageAnalysis(await analyzeImage(file)); }
    catch (err) { setError(`Image analysis failed: ${err.message}`); setUploadedImage(null); }
    finally { setIsAnalyzing(false); }
  };

  // ─── Reset ──────────────────────────────────────────────────────────
  const resetToInput = async () => {
    setResponsePhase('input'); setExplanationText(''); setSummaryText(''); setUserRequest('');
    setError(null); setPrompt(''); setCode('');
    setUploadedImage(null); setImageAnalysis(null);
    setStreamingFiles({}); setStreamingFilePaths([]);
    if (devServerPort) { try { await stopDevServer(); } catch { } }
    setProjectName(null); setDevServerPort(null);
    setSetupPhase(''); setSetupError(null); setIsSettingUp(false); setDeployLogs([]);
  };

  const handleFrameworkChange = async (fw) => {
    if (fw === framework) return;
    await resetToInput();
    setFramework(fw);
  };

  // ─── MAIN GENERATE ──────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!uploadedImage && !prompt.trim()) { setError('Please enter a prompt or upload an image'); return; }
    if (uploadedImage && !imageAnalysis) { setError('Please wait for image analysis to complete'); return; }

    setUserRequest(uploadedImage ? `Image: ${uploadedImage.name}` : prompt);
    setIsGenerating(true); setError(null); setCode('');
    setExplanationText(''); setSummaryText('');
    setResponsePhase('explanation');
    setProjectName(null); setDevServerPort(null);
    setSetupError(null); setDeployLogs([]);
    setStreamingFiles({}); setStreamingFilePaths([]);

    // ════════════════════════════════════════════════════════════════
    //  REACT FLOW  — one stream does it all
    // ════════════════════════════════════════════════════════════════
    if (framework === 'react') {

      // ── STEP 1: Scaffold project (fast template copy, ~2 s) ───────
      setIsSettingUp(true);
      setSetupPhase('Creating project...');

      let setupResult;
      try {
        setupResult = await setupProject(prompt || 'react-app');
        if (!setupResult.success) {
          setSetupError(setupResult.error || 'Project setup failed');
          setIsSettingUp(false); setIsGenerating(false); setResponsePhase('input');
          return;
        }
      } catch (err) {
        setSetupError(err.message || 'Project setup failed');
        setIsSettingUp(false); setIsGenerating(false); setResponsePhase('input');
        return;
      }

      // ── STEP 2: Show IDE immediately with scaffold files ───────────
      setProjectName(setupResult.project_name);
      setSetupPhase('AI generating code...');
      setActiveTab('code');

      // ── STEP 3: Single stream → AI generate + file write + server ─
      try {
        for await (const event of streamGenerate(
          setupResult.project_name,
          prompt,
          setupResult.src_files || [],
          5174,
        )) {
          switch (event.type) {

            case 'analysis_partial':
              setExplanationText(event.text);
              setResponsePhase('explanation');
              break;

            case 'analysis':
              setExplanationText(event.text);
              setResponsePhase('explanation');
              break;

            case 'file':
              // File is already written to disk by backend.
              // Update IDE in real-time with the content.
              setStreamingFiles(prev => ({ ...prev, [event.path]: event.content }));
              setStreamingFilePaths(prev => [...new Set([...prev, event.path])]);
              setSetupPhase(`Writing ${event.path}...`);
              break;

            case 'status':
              setSetupPhase(event.message);
              break;

            case 'summary':
              setSummaryText(event.text);
              setResponsePhase('summary');
              break;

            case 'done':
              setDevServerPort(event.port);
              setSetupPhase('');
              setStreamingFilePaths([]);
              setActiveTab('preview');   // switch to live preview
              break;

            case 'error':
              setSetupError(event.message);
              break;

            default:
              break;
          }
        }
      } catch (err) {
        setSetupError(err.message || 'Generation failed');
      } finally {
        setIsGenerating(false);
        setIsSettingUp(false);
      }

      return; // React flow done
    }


    // ════════════════════════════════════════════════════════════════
    //  HTML FLOW (unchanged)
    // ════════════════════════════════════════════════════════════════
    let buffer = '';
    try {
      let stream;
      if (uploadedImage && imageAnalysis) {
        stream = await generateCodeFromImage(imageAnalysis.description);
      } else {
        stream = await generateCode({ prompt, framework: 'html' });
      }

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let currentSection = 'analysis';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        if (buffer.includes('===ANALYSIS_START===') && currentSection === 'analysis') setResponsePhase('explanation');
        if (buffer.includes('===CODE_START===') && currentSection !== 'code') {
          currentSection = 'code'; setResponsePhase('generating'); setActiveTab('code');
          const m = buffer.match(/===ANALYSIS_START===([\s\S]*?)===ANALYSIS_END===/);
          if (m) setExplanationText(m[1].trim());
        }
        if (buffer.includes('===SUMMARY_START===') && currentSection !== 'summary') {
          currentSection = 'summary'; setResponsePhase('summary');
          const m = buffer.match(/===CODE_START===([\s\S]*?)===CODE_END===/);
          if (m) setCode(m[1].trim());
        }

        if (currentSection === 'analysis') {
          const m = buffer.match(/===ANALYSIS_START===([\s\S]*?)(?===ANALYSIS_END===|$)/);
          if (m) setExplanationText(m[1].trim());
        } else if (currentSection === 'code') {
          const m = buffer.match(/===CODE_START===([\s\S]*?)(?===CODE_END===|$)/);
          if (m) setCode(m[1].trim());
        } else if (currentSection === 'summary') {
          const m = buffer.match(/===SUMMARY_START===([\s\S]*?)(?===SUMMARY_END===|$)/);
          if (m) setSummaryText(m[1].trim());
        }
      }

      const fa = buffer.match(/===ANALYSIS_START===([\s\S]*?)===ANALYSIS_END===/);
      const fc = buffer.match(/===CODE_START===([\s\S]*?)===CODE_END===/);
      const fs = buffer.match(/===SUMMARY_START===([\s\S]*?)===SUMMARY_END===/);
      if (fa) setExplanationText(fa[1].trim());
      if (fc) setCode(fc[1].trim());
      if (fs) setSummaryText(fs[1].trim());

    } catch (err) {
      setError(err.message || 'Failed to generate code');
      setCode('<!-- Error occurred -->');
      setResponsePhase('input');
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <div className="app-container">

      {/* Header */}
      <header className="app-header">
        <div className="logo-section">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: '#a8c7fa' }}>
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h1>WebAgent</h1>
          <span className="beta-tag">BETA</span>
        </div>

        <div className="header-actions">
          <div className="framework-toggle">
            <button className={`framework-btn ${framework === 'html' ? 'active-html' : ''}`}
              onClick={() => handleFrameworkChange('html')}>HTML</button>
            <button className={`framework-btn ${framework === 'react' ? 'active-react' : ''}`}
              onClick={() => handleFrameworkChange('react')}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="2.2" />
                <ellipse cx="12" cy="12" rx="10" ry="3.8" fill="none" stroke="currentColor" strokeWidth="1.4" />
                <ellipse cx="12" cy="12" rx="10" ry="3.8" fill="none" stroke="currentColor" strokeWidth="1.4" transform="rotate(60 12 12)" />
                <ellipse cx="12" cy="12" rx="10" ry="3.8" fill="none" stroke="currentColor" strokeWidth="1.4" transform="rotate(120 12 12)" />
              </svg>
              React
            </button>
          </div>
          <button className="header-btn header-btn-save">Save</button>
          <button className="header-btn header-btn-run">
            <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            Run
          </button>
          <button className="profile-btn" onClick={() => navigate('/profile')}>
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="main-layout">

        {/* Sidebar */}
        <aside className="sidebar" style={{ width: `${sidebarWidth}px` }}>
          <PromptInput
            prompt={prompt} setPrompt={setPrompt}
            onGenerate={handleGenerate} isGenerating={isGenerating}
            error={error} onImageUpload={handleImageUpload}
            uploadedImage={uploadedImage} imageAnalysis={imageAnalysis}
            isAnalyzing={isAnalyzing} responsePhase={responsePhase}
            explanationText={explanationText} summaryText={summaryText}
            userRequest={userRequest} onReset={resetToInput} code={code}
          />
        </aside>

        <div className="resize-handle" onMouseDown={handleMouseDown} />

        {/* Editor panel */}
        <main className="editor-section">
          <div className="tab-navigation">
            <button className={`tab ${activeTab === 'code' ? 'active' : ''}`} onClick={() => setActiveTab('code')}>
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Code
              {framework === 'react' && streamingFilePaths.length > 0 && (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#22c55e',
                  animation: 'pulse 1.2s ease-in-out infinite', flexShrink: 0,
                }} />
              )}
            </button>
            <button className={`tab ${activeTab === 'preview' ? 'active' : ''}`} onClick={() => setActiveTab('preview')}>
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
              {framework === 'react' && devServerPort && <span className="tab-dot" />}
            </button>
          </div>

          <div className="content-area">
            {framework === 'react' ? (
              <ReactIDE
                projectName={projectName}
                devServerPort={devServerPort}
                isSettingUp={isSettingUp}
                setupPhase={setupPhase}
                setupError={setupError}
                deployLogs={deployLogs}
                mode={activeTab}
                streamingFiles={streamingFiles}
                streamingFilePaths={streamingFilePaths}
              />
            ) : (
              <>
                <div className="editor-container" style={{ display: activeTab === 'code' ? 'block' : 'none' }}>
                  <CodeEditor value={code} onChange={setCode} />
                </div>
                <div className="preview-container" style={{ display: activeTab === 'preview' ? 'block' : 'none' }}>
                  <Preview code={code} />
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }`}</style>
    </div>
  );
}

export default HomePage;
