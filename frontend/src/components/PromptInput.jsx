import { useState } from 'react';

const PromptInput = ({
  prompt,
  setPrompt,
  onGenerate,
  isGenerating,
  error,

}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const examples = [
    "A modern SaaS landing page with pricing tiers",
    "Portfolio website for a UI/UX designer",
    "E-commerce store for fashion products",
    "Restaurant website with menu and reservations",
    "Tech startup homepage with team section"
  ];

  return (
    <div className="prompt-input-container">
      {/* Header */}
      <div className="prompt-header">
        <h2>Create Your Website</h2>
        <p>Describe what you want to build and we'll generate it for you</p>
      </div>

      {/* Main Prompt Input */}
      <div className="prompt-main">
        <label className="prompt-label">
          Describe your website
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A modern landing page for a SaaS product with hero section, features, pricing, and testimonials"
          disabled={isGenerating}
          className="prompt-textarea"
          rows={4}
        />
        
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


      {/* Error Display */}
      {error && (
        <div className="error-message">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {error}
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="generate-button"
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Generating...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            Generate Website
          </>
        )}
      </button>
    </div>
  );
};

export default PromptInput;