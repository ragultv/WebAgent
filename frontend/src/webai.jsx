import { useRef, useState, useEffect } from 'react';
import * as monaco from 'monaco-editor';
import { generateCode } from './services/api';

export default function WebAI() {
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const [code, setCode] = useState('<!DOCTYPE html>\n<html>\n  <head>\n    <title>My Site</title>\n  </head>\n  <body>\n    <h1>Hello, world!</h1>\n  </body>\n</html>');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Monaco Editor setup
  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      editorRef.current = monaco.editor.create(containerRef.current, {
        value: code,
        language: 'html',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        wordWrap: 'on',
      });
      editorRef.current.onDidChangeModelContent(() => {
        setCode(editorRef.current.getValue());
      });
    }
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (editorRef.current && code !== editorRef.current.getValue()) {
      editorRef.current.setValue(code);
    }
  }, [code]);

  // Handle prompt submit to generate code
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const stream = await generateCode(prompt);
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
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: 'sans-serif' }}>
      {/* Left: Code Editor + Prompt Area */}
      <div style={{ width: '50%', minWidth: 320, display: 'flex', flexDirection: 'column', borderRight: '1px solid #ddd', background: '#181818' }}>
        <div ref={containerRef} style={{ flex: 1, minHeight: 0 }} />
        {/* Prompt Area */}
        <form onSubmit={handleGenerate} style={{ background: '#222', color: '#fff', padding: 16, borderTop: '1px solid #333', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe the website you want to build..."
            style={{ width: '100%', minHeight: 48, borderRadius: 4, border: '1px solid #444', background: '#181818', color: '#fff', padding: 8, fontSize: 16, resize: 'vertical' }}
            disabled={isGenerating}
          />
          {error && <div style={{ color: '#dc3545' }}>{error}</div>}
          <button type="submit" disabled={isGenerating || !prompt.trim()} style={{ padding: '10px 0', borderRadius: 4, border: 'none', background: '#007bff', color: '#fff', fontSize: 16, cursor: isGenerating ? 'not-allowed' : 'pointer' }}>
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </form>
      </div>
      {/* Right: Preview */}
      <div style={{ width: '50%', minWidth: 320, height: '100vh', background: '#fff' }}>
        <iframe
          title="preview"
          sandbox="allow-scripts"
          srcDoc={code}
          style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
        />
      </div>
    </div>
  );
} 