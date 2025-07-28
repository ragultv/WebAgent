import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor';
import Preview from '../components/Preview';
import PromptInput from '../components/PromptInput';
import { 
  generateCode, 
  analyzeImage, 
  generateCodeFromImage,
  refreshToken as apiRefreshToken 
} from '../services/api';
import './Home.css';

function HomePage() {
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('prompt'); // prompt, code, preview
  
  // Image upload states
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Response phases states
  const [responsePhase, setResponsePhase] = useState('input'); // 'input', 'explanation', 'generating', 'summary'
  const [explanationText, setExplanationText] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [userRequest, setUserRequest] = useState('');

  // Resize functionality
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  const resizeHandleRef = useRef(null);

  const navigate = useNavigate();

  // Resize handlers
  const handleMouseDown = useCallback((e) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;
    
    const newWidth = e.clientX;
    const minWidth = 280;
    const maxWidth = window.innerWidth * 0.6; // Max 60% of window width
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setSidebarWidth(newWidth);
    }
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

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
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const checkAuth = async () => {
    const token = localStorage.getItem("access_token")
    if (!token) {
      const refreshToken = localStorage.getItem("refresh_token")
      if (refreshToken) {
        try {
          const response = await apiRefreshToken(refreshToken)
          localStorage.setItem("access_token", response.data.access_token)
          localStorage.setItem("refresh_token", response.data.refresh_token)
        } catch (error) {
          console.error("Failed to refresh token:", error)
          navigate("/login", { replace: true })
          return false
        }
      }
    }
    return true
  }

  const handleImageUpload = async (file) => {
    if (!file) {
      // Remove image
      setUploadedImage(null);
      setImageAnalysis(null);
      setError(null);
      return;
    }

    setUploadedImage(file);
    setImageAnalysis(null);
    setIsAnalyzing(true);
    setError(null);

    try {
      const analysis = await analyzeImage(file);
      setImageAnalysis(analysis);
    } catch (err) {
      console.error('Image analysis failed:', err);
      setError(`Image analysis failed: ${err.message}`);
      setUploadedImage(null);
    } finally {
      setIsAnalyzing(false);
    }
  };
  const handleGenerate = async () => {
    // Check if we have either a prompt or an analyzed image
    if (!uploadedImage && !prompt.trim()) {
      setError('Please enter a prompt or upload an image');
      return;
    }

    if (uploadedImage && !imageAnalysis) {
      setError('Please wait for image analysis to complete');
      return;
    }

    // Store the user request
    setUserRequest(uploadedImage ? `Generate website from uploaded image: ${uploadedImage.name}` : prompt);

    setIsGenerating(true);
    setError(null);
    setCode('');
    setExplanationText('');
    setSummaryText('');
    setResponsePhase('explanation');

    try {
      let stream;
      if (uploadedImage && imageAnalysis) {
        // Generate from image analysis description using the specific endpoint
        stream = await generateCodeFromImage(imageAnalysis.description);
      } else {
        // Generate from text prompt
        stream = await generateCode({ prompt });
      }

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentPhase = 'analysis';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Parse the three-part response
        if (buffer.includes('===ANALYSIS_START===') && currentPhase === 'analysis') {
          setResponsePhase('explanation');
        }
        
        if (buffer.includes('===CODE_START===') && currentPhase !== 'code') {
          currentPhase = 'code';
          setResponsePhase('generating');
          setActiveTab('code');
          
          // Extract and display analysis content
          const analysisMatch = buffer.match(/===ANALYSIS_START===(.*?)===ANALYSIS_END===/s);
          if (analysisMatch) {
            setExplanationText(analysisMatch[1].trim());
          }
        }
        
        if (buffer.includes('===SUMMARY_START===') && currentPhase !== 'summary') {
          currentPhase = 'summary';
          setResponsePhase('summary');
          
          // Extract and display code content
          const codeMatch = buffer.match(/===CODE_START===(.*?)===CODE_END===/s);
          if (codeMatch) {
            setCode(codeMatch[1].trim());
          }
        }
        
        // Real-time updates for current phase
        if (currentPhase === 'analysis') {
          const analysisPartial = buffer.match(/===ANALYSIS_START===(.*?)(?===ANALYSIS_END===|$)/s);
          if (analysisPartial) {
            setExplanationText(analysisPartial[1].trim());
          }
        } else if (currentPhase === 'code') {
          const codePartial = buffer.match(/===CODE_START===(.*?)(?===CODE_END===|$)/s);
          if (codePartial) {
            setCode(codePartial[1].trim());
          }
        } else if (currentPhase === 'summary') {
          const summaryPartial = buffer.match(/===SUMMARY_START===(.*?)(?===SUMMARY_END===|$)/s);
          if (summaryPartial) {
            setSummaryText(summaryPartial[1].trim());
          }
        }
      }
      
      // Final parsing to ensure all content is captured
      const finalAnalysisMatch = buffer.match(/===ANALYSIS_START===(.*?)===ANALYSIS_END===/s);
      const finalCodeMatch = buffer.match(/===CODE_START===(.*?)===CODE_END===/s);
      const finalSummaryMatch = buffer.match(/===SUMMARY_START===(.*?)===SUMMARY_END===/s);
      
      if (finalAnalysisMatch) setExplanationText(finalAnalysisMatch[1].trim());
      if (finalCodeMatch) setCode(finalCodeMatch[1].trim());
      if (finalSummaryMatch) setSummaryText(finalSummaryMatch[1].trim());
      
    } catch (err) {
      setError(err.message || 'Failed to generate code');
      setCode('<!-- Error occurred while generating code -->');
      setResponsePhase('input');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetToInput = () => {
    setResponsePhase('input');
    setExplanationText('');
    setSummaryText('');
    setUserRequest('');
    setError(null);
    setPrompt('');
    setUploadedImage(null);
    setImageAnalysis(null);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1>WebAgent</h1>
            <span className="beta-tag">Beta</span>
          </div>
          <div className="header-actions">
            <button className="icon-button" onClick={() => navigate('/profile')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-layout">
        {/* Sidebar */}
        <aside 
          ref={sidebarRef}
          className="sidebar"
          style={{ width: `${sidebarWidth}px` }}
        >
          <PromptInput
            prompt={prompt}
            setPrompt={setPrompt}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            error={error}
            onImageUpload={handleImageUpload}
            uploadedImage={uploadedImage}
            imageAnalysis={imageAnalysis}
            isAnalyzing={isAnalyzing}
            responsePhase={responsePhase}
            explanationText={explanationText}
            summaryText={summaryText}
            userRequest={userRequest}
            onReset={resetToInput}
            code={code}
          />
        </aside>

        {/* Resize Handle */}
        <div 
          ref={resizeHandleRef}
          className="resize-handle"
          onMouseDown={handleMouseDown}
        />

        {/* Editor and Preview */}
        <main className="editor-section">
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button 
              className={`tab ${activeTab === 'code' ? 'active' : ''}`}
              onClick={() => setActiveTab('code')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
              </svg>
              Code
            </button>
            <button 
              className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              Preview
            </button>
          </div>

          {/* Content Area */}
          <div className="content-area">
            {activeTab === 'code' && (
              <div className="editor-container">
                <CodeEditor value={code} onChange={setCode} />
              </div>
            )}
            {activeTab === 'preview' && (
              <div className="preview-container">
                <Preview code={code} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default HomePage;
