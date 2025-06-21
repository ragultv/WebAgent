import { useState, useEffect } from 'react';
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

  const navigate = useNavigate();

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

    setIsGenerating(true);
    setError(null);
    setCode('');
    setActiveTab('code');

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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        setCode(buffer);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate code');
      setCode('<!-- Error occurred while generating code -->');
    } finally {
      setIsGenerating(false);
    }
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
        <aside className="sidebar">
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
          />
        </aside>

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
