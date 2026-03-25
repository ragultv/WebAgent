import { useEffect, useRef, useState } from 'react';
import { RefreshCw, ExternalLink, Monitor, Smartphone, Tablet, ZoomIn, ZoomOut, Loader } from 'lucide-react';

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
    <div className="flex flex-col h-full bg-google-surface">
      {/* Preview Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-google-surface border-b border-google-border shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-google-dark rounded-md border border-google-border p-0.5">
            <button
              className={`p-1.5 rounded transition-colors ${viewMode === 'desktop' ? 'bg-google-surface text-google-text shadow-sm' : 'text-google-text-secondary hover:text-google-text'}`}
              onClick={() => setViewMode('desktop')}
              title="Desktop view"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              className={`p-1.5 rounded transition-colors ${viewMode === 'tablet' ? 'bg-google-surface text-google-text shadow-sm' : 'text-google-text-secondary hover:text-google-text'}`}
              onClick={() => setViewMode('tablet')}
              title="Tablet view"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              className={`p-1.5 rounded transition-colors ${viewMode === 'mobile' ? 'bg-google-surface text-google-text shadow-sm' : 'text-google-text-secondary hover:text-google-text'}`}
              onClick={() => setViewMode('mobile')}
              title="Mobile view"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="p-1.5 text-google-text-secondary hover:text-google-text rounded transition-colors"
              onClick={() => setScale(Math.max(25, scale - 25))}
              disabled={scale <= 25}
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-google-text w-8 text-center">{scale}%</span>
            <button
              className="p-1.5 text-google-text-secondary hover:text-google-text rounded transition-colors"
              onClick={() => setScale(Math.min(200, scale + 25))}
              disabled={scale >= 200}
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="p-1.5 text-google-text-secondary hover:text-google-text hover:bg-google-surface-hover rounded transition-colors"
            onClick={refreshPreview}
            title="Refresh preview"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 text-google-text-secondary hover:text-google-text hover:bg-google-surface-hover rounded transition-colors"
            onClick={openInNewTab}
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 relative bg-[#f1f3f4] overflow-hidden flex items-center justify-center">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
            <Loader className="w-8 h-8 text-google-primary animate-spin mb-2" />
            <p className="text-sm text-google-text-secondary">Loading preview...</p>
          </div>
        )}

        <div
          className="transition-all duration-300 ease-in-out bg-white shadow-lg overflow-hidden relative"
          style={{
            width: dimensions.width,
            height: dimensions.height,
            transform: `scale(${scale / 100})`,
            transformOrigin: 'center center',
            border: viewMode !== 'desktop' ? '1px solid #e5e7eb' : 'none',
            borderRadius: viewMode !== 'desktop' ? '12px' : '0',
          }}
        >
          <iframe
            ref={iframeRef}
            title="Website Preview"
            sandbox="allow-scripts allow-forms allow-modals"
            className="w-full h-full border-none bg-white block"
          />
        </div>

        {!code && (
          <div className="absolute inset-0 flex items-center justify-center bg-google-surface">
            <div className="text-center p-8 max-w-sm">
              <div className="w-16 h-16 bg-google-surface-hover rounded-full flex items-center justify-center mx-auto mb-4">
                <Monitor className="w-8 h-8 text-google-text-secondary" />
              </div>
              <h3 className="text-lg font-medium text-google-text mb-2">No Preview Available</h3>
              <p className="text-sm text-google-text-secondary">Generate a website to see the preview here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Preview;