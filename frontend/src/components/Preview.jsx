import { useEffect, useRef, useState } from 'react';

const Preview = ({ code }) => {
  const iframeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('desktop'); // desktop, tablet, mobile
  const [scale, setScale] = useState(100);

  useEffect(() => {
    if (iframeRef.current && code) {
      setIsLoading(true);
      const html = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Preview</title>
            <style>
              body { 
                margin: 0; 
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              }
              * { box-sizing: border-box; }
            </style>
          </head>
          <body>
            ${code}
            <script>
              // Prevent external navigation
              document.addEventListener('click', function(e) {
                if (e.target.tagName === 'A' && e.target.href) {
                  e.preventDefault();
                  console.log('Link clicked:', e.target.href);
                }
              });
              
              // Signal when page is loaded
              window.addEventListener('load', function() {
                parent.postMessage({ type: 'preview-loaded' }, '*');
              });
            </script>
          </body>
        </html>
      `;
      iframeRef.current.srcdoc = html;
    }
  }, [code]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'preview-loaded') {
        setIsLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const getViewportDimensions = () => {
    switch (viewMode) {
      case 'mobile':
        return { width: '375px', height: '667px' };
      case 'tablet':
        return { width: '768px', height: '1024px' };
      default:
        return { width: '100%', height: '100%' };
    }
  };

  const refreshPreview = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const openInNewTab = () => {
    if (code) {
      const newWindow = window.open('', '_blank');
      newWindow.document.write(code);
      newWindow.document.close();
    }
  };

  const dimensions = getViewportDimensions();

  return (
    <div className="preview-container">
      {/* Preview Toolbar */}
      <div className="preview-toolbar">
        <div className="preview-controls">
          <div className="viewport-controls">
            <button
              className={`viewport-btn ${viewMode === 'desktop' ? 'active' : ''}`}
              onClick={() => setViewMode('desktop')}
              title="Desktop view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="2" y="4" width="20" height="12" rx="2"/>
                <path d="M2 8h20"/>
              </svg>
            </button>
            <button
              className={`viewport-btn ${viewMode === 'tablet' ? 'active' : ''}`}
              onClick={() => setViewMode('tablet')}
              title="Tablet view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="2" width="12" height="20" rx="2"/>
              </svg>
            </button>
            <button
              className={`viewport-btn ${viewMode === 'mobile' ? 'active' : ''}`}
              onClick={() => setViewMode('mobile')}
              title="Mobile view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="8" y="1" width="8" height="22" rx="2"/>
              </svg>
            </button>
          </div>

          <div className="scale-controls">
            <button
              className="scale-btn"
              onClick={() => setScale(Math.max(25, scale - 25))}
              disabled={scale <= 25}
              title="Zoom out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
                <path d="M8 11h6"/>
              </svg>
            </button>
            <span className="scale-indicator">{scale}%</span>
            <button
              className="scale-btn"
              onClick={() => setScale(Math.min(200, scale + 25))}
              disabled={scale >= 200}
              title="Zoom in"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
                <path d="M11 8v6M8 11h6"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="preview-actions">
          <button
            className="action-btn"
            onClick={refreshPreview}
            title="Refresh preview"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
          <button
            className="action-btn"
            onClick={openInNewTab}
            title="Open in new tab"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="preview-content">
        {isLoading && (
          <div className="preview-loading">
            <div className="loading-spinner">
              <svg className="animate-spin w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </div>
            <p>Loading preview...</p>
          </div>
        )}
        
        <div 
          className={`preview-frame ${viewMode}`}
          style={{ 
            width: dimensions.width,
            height: dimensions.height,
            transform: `scale(${scale / 100})`,
            transformOrigin: viewMode === 'desktop' ? 'top left' : 'center center',
            border: viewMode !== 'desktop' ? '1px solid var(--color-border)' : 'none',
            borderRadius: viewMode !== 'desktop' ? 'var(--radius-lg)' : '0',
            boxShadow: viewMode !== 'desktop' ? 'var(--shadow-lg)' : 'none',
            transition: 'width 0.3s ease, height 0.3s ease, transform 0.3s ease',
          }}
        >
          <iframe
            ref={iframeRef}
            title="Website Preview"
            sandbox="allow-scripts allow-forms allow-modals"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: 'white',
              display: 'block',
            }}
          />
        </div>

        {!code && (
          <div className="preview-empty">
            <div className="empty-state">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              <h3>No Preview Available</h3>
              <p>Generate a website to see the preview here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Preview;