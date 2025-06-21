import { useState, useRef, useEffect } from 'react';
import { Upload, X, Sparkles, Image, Type, Check, AlertCircle, Loader } from 'lucide-react';

const examples = [ 
  "E-commerce store for fashion products",
  "Restaurant website with menu and reservations",
  "Landing page for a fitness app",
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
  isAnalyzing
}) => {
  const [activeTab, setActiveTab] = useState('text');
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

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
      setActiveTab('image');
    }
  };

  const removeImage = () => {
    onImageUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setActiveTab('text');
  };

  const canGenerate = () => {
    if (activeTab === 'image' && uploadedImage) {
      return imageAnalysis && !isAnalyzing && !isGenerating;
    } else {
      return prompt.trim() && !isGenerating;
    }
  };

  return (
    <div className="prompt-input-container">
      {/* Header */}
      <div className="prompt-header">
        <h2>Create Your Website</h2>
        <p >Describe your vision or upload a design to recreate</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-black rounded-xl p-1 mb-1 max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'text'
              ? 'bg-gray-200 text-blue-600 shadow-sm'
              : 'text-white-600 hover:text-white-900'
          }`}
          disabled={isGenerating || isAnalyzing}
        >
          <Type className="w-4 h-4" />
          Text Prompt
        </button>
        <button
          onClick={() => setActiveTab('image')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'image'
              ? 'bg-gray-200 text-blue-600 shadow-sm'
              : 'text-white-600 hover:text-white-900'
          }`}
          disabled={isGenerating || isAnalyzing}
        >
          <Image className="w-4 h-4" />
          Upload Image
          {uploadedImage && (
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          )}
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'text' ? (
        <div className="prompt-main">
          {/* Text Prompt Section */}
          
          <label className="prompt-label">
            Describe your website
          </label>
          <div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A modern landing page for a SaaS product with hero section, features, pricing, and testimonials..."
              disabled={isGenerating}
              className="prompt-textarea"              
              rows={4}
            />
            
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
        </div>
      ) : (
        <div className="space-y-6">
          {/* Image Upload Section */}
          {!uploadedImage ? (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                disabled={isGenerating || isAnalyzing}
              />
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors duration-200">
                  <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-500" />
                </div>
                <h3 className="text-gray-600 mb-4">Upload your design</h3>
                <p className="text-gray-600 mb-4">Drop an image here or click to browse</p>
                <p className="text-xs text-gray-500">PNG, JPG, WebP up to 10MB</p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  <img 
                    src={imagePreview} 
                    alt="Uploaded design"
                    className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200 cursor-pointer"
                    onClick={() => setIsFullScreen(true)}
                  />
                  <button
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors duration-200"
                    disabled={isGenerating || isAnalyzing}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{uploadedImage.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {(uploadedImage.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  
                  {isAnalyzing && (
                    <div className="flex items-center gap-2 mt-3 text-blue-600">
                      <Loader className="w-4 h-4 animate-spin" />
                      <span className="text-sm font-medium">Analyzing image...</span>
                    </div>
                  )}
                  
                  {imageAnalysis && !isAnalyzing && (
                    <div className="flex items-center gap-2 mt-3 text-green-600">
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium">Analysis complete</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {isFullScreen && imagePreview && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" 
          onClick={() => setIsFullScreen(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img 
              src={imagePreview} 
              alt="Full screen preview"
              className="max-w-full max-h-[90vh] object-contain"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsFullScreen(false);
              }}
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-opacity"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 mt-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Generate Button */}
      <div className=" flex justify-center">
        <button
          onClick={onGenerate}
          disabled={!canGenerate()}
          className="generate-button"
        >
          {isGenerating ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Generating your website...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              {activeTab === 'image' && uploadedImage ? 'Generate from Image' : 'Generate Website'}
            </>
          )}
        </button>
      </div>

      {/* Progress indicator when generating */}
      {/* {isGenerating && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">This may take a few moments...</p>
        </div>
      )} */}
    </div>
  );
};

export default PromptInput;