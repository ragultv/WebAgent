import { useState, useRef, useEffect } from 'react';
import { Upload, X, Sparkles, Image, Send, AlertCircle, Loader, ArrowLeft, RotateCcw } from 'lucide-react';

const examples = [ 
  "E-commerce store for fashion products",
  "Restaurant website with menu and reservations",
  "Landing page for a fitness app",
  "Modern portfolio website with dark theme",
  "Food delivery app landing page",
  "Real estate property showcase"
];

const PromptInput = ({
  prompt,
  setPrompt,
  onGenerate,
  isGenerating,
  error,
  onImageUpload,
  uploadedImage,
  imageAnalysis,
  isAnalyzing,
  responsePhase,
  explanationText,
  summaryText,
  userRequest,
  onReset,
  code
}) => {
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const textareaRef = useRef(null);
  const chatTextareaRef = useRef(null);

  useEffect(() => {
    if (uploadedImage) {
      const objectUrl = URL.createObjectURL(uploadedImage);
      setImagePreview(objectUrl);

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    } else {
      setImagePreview(null);
    }
  }, [uploadedImage]);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'; // Max height of 200px
    }
  };

  // Auto-resize chat textarea
  const adjustChatTextareaHeight = () => {
    const textarea = chatTextareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'; // Max height of 200px
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [prompt, imageAnalysis]);

  useEffect(() => {
    adjustChatTextareaHeight();
  }, [prompt]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPEG, PNG, WebP, or GIF)');
        return;
      }
      
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('Image file is too large. Please upload an image smaller than 10MB.');
        return;
      }
      
      onImageUpload(file);
    }
  };

  const removeImage = () => {
    onImageUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const canGenerate = () => {
    if (uploadedImage) {
      return imageAnalysis && !isAnalyzing && !isGenerating;
    } else {
      return prompt.trim() && !isGenerating;
    }
  };

  return (
    <div className="prompt-input-container">
      {responsePhase === 'input' ? (
        <>
          {/* Header */}
          <div className="prompt-header">
            <p>Describe your vision or upload a design to recreate</p>
          </div>

          {/* Example Prompts */}
          <div className="prompt-examples">
            <p className="examples-label">Try these examples:</p>
            {examples.map((example, index) => (
              <button
                key={index}
                className="example-button"
                onClick={() => setPrompt(example)}
                disabled={isGenerating}
              >
                {example}
              </button>
            ))}
          </div>

          {/* Prompt Input Area with inline image preview */}
          <div className="prompt-input-area">
            <div className="input-container">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: uploadedImage ? '0.5rem' : 0 }}>
                {uploadedImage && (
                  <div style={{ position: 'relative', width: 36, height: 36 }}>
                    <img
                      src={imagePreview}
                      alt="Uploaded design"
                      style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, border: '1px solid #e4e4e7' }}
                    />
                    <button
                      onClick={removeImage}
                      className="remove-image-button"
                      disabled={isGenerating || isAnalyzing}
                      style={{ position: 'absolute', top: -8, right: -8, width: 18, height: 18, fontSize: 10 }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {isAnalyzing && (
                      <div style={{ position: 'absolute', top: 0, left: 0, width: 36, height: 36, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>
                        <Loader className="w-4 h-4 animate-spin" />
                      </div>
                    )}
                  </div>
                )}
              </div>
              <textarea
                ref={textareaRef}
                value={imageAnalysis && !isAnalyzing && typeof imageAnalysis === 'string' ? imageAnalysis : prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  adjustTextareaHeight();
                  // If user modifies the text after image analysis, clear the analysis so prompt takes precedence
                  if (imageAnalysis && e.target.value !== imageAnalysis) {
                    // This will be handled by the parent component
                  }
                }}
                placeholder="Describe your website idea here..."
                disabled={isGenerating || isAnalyzing}
                className="prompt-textarea"
                rows={4}
                style={{ minHeight: '80px', maxHeight: '200px', overflow: 'auto', resize: 'none' }}
              />
              <div className="input-buttons">
                {/* Upload Image Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="upload-image-button"
                  disabled={isGenerating || isAnalyzing}
                  title="Upload image"
                >
                  <Image className="w-5 h-5" />
                </button>
                {/* Send Button */}
                <button
                  onClick={onGenerate}
                  disabled={!canGenerate() || isAnalyzing}
                  className="send-icon-button"
                  title={uploadedImage ? 'Generate from Image' : 'Generate Website'}
                >
                  {isGenerating ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                disabled={isGenerating || isAnalyzing}
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-message">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Chat Interface */}
          <div className="chat-container">
            {/* Chat Messages Area */}
            <div className="chat-messages">
              {/* User Message */}
              <div className="message user-message">
                <div className="message-content" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {uploadedImage && (
                    <img
                      src={imagePreview}
                      alt="Uploaded design"
                      style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 6, border: '1px solid #e4e4e7', marginRight: 8 }}
                    />
                  )}
                  <span>{userRequest}</span>
                </div>
              </div>

              {/* AI Initial Analysis */}
              {(responsePhase === 'explanation' || responsePhase === 'generating' || responsePhase === 'summary') && (
                <div className="message ai-message">
                  <div className="message-content">
                    <div className="message-title"></div>
                    {explanationText ? (
                      <div className="message-text">{explanationText}</div>
                    ) : (
                      <div className="typing-indicator">
                        <div className="typing-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                        <span className="typing-text">Analyzing your request...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Code Generation Status */}
              {(responsePhase === 'generating' || responsePhase === 'summary') && explanationText && (
                <div className="message ai-message">
                  <div className="message-content">
                    {responsePhase === 'generating' ? (
                      <div className="typing-indicator">
                        <div className="typing-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                        <span className="typing-text">Writing your website code...</span>
                      </div>
                    ) : (
                      <div className="website-success-card">
                        <div className="success-card-header">
                        </div>
                        <div className="website-preview-card">
                          <div className="website-name">{userRequest}</div>
                          <div className="website-code">Code</div>
                          
                          {/* Hover Code Tab */}
                          <div className="code-hover-tab">
                            <div className="tab-content">
                              <div className="tab-header">Generated Code</div>
                              <div className="tab-code">
                                <pre><code>{code || 'No code generated yet'}</code></pre>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Final Summary */}
              {responsePhase === 'summary' && (
                <div className="message ai-message">
                  <div className="message-content">
                    <div className="message-title"></div>
                    {summaryText ? (
                      <div className="message-text">{summaryText}</div>
                    ) : (
                      <div className="typing-indicator">
                        <div className="typing-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                        <span className="typing-text">Preparing final summary...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Fixed Input Area at Bottom */}
            <div className="chat-input-area">
              <div className="chat-input-container">
                <textarea
                  ref={chatTextareaRef}
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    adjustChatTextareaHeight();
                  }}
                  placeholder="Ask for modifications or create a new website..."
                  disabled={isGenerating}
                  className="chat-textarea"
                  rows={2}
                  style={{ minHeight: '60px', maxHeight: '200px', overflow: 'auto', resize: 'none' }}
                />
                
                <div className="chat-input-buttons">
                  {/* Reset Button */}
                  <button
                    onClick={onReset}
                    className="reset-chat-button"
                    title="New conversation"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  
                  {/* Upload Image Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="upload-image-button"
                    disabled={isGenerating || isAnalyzing}
                    title="Upload image"
                  >
                    <Image className="w-4 h-4" />
                  </button>
                  
                  {/* Send Button */}
                  <button
                    onClick={onGenerate}
                    disabled={!canGenerate()}
                    className="send-icon-button"
                    title="Send message"
                  >
                    {isGenerating ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                  disabled={isGenerating || isAnalyzing}
                />
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-message">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PromptInput;