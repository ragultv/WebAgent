import React, { useEffect, useRef } from 'react';

const PreviewPane = ({ code }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      iframe.srcdoc = code;
    }
  }, [code]);

  return (
    <iframe
      ref={iframeRef}
      title="preview"
      sandbox="allow-scripts"
      className="w-full h-full bg-white dark:bg-gray-900"
    />
  );
};

export default PreviewPane;