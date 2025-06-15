import { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';

// Configure Monaco Editor web workers
self.MonacoEnvironment = {
  getWorkerUrl: function (moduleId, label) {
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return './html.worker.js';
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return './css.worker.js';
    }
    if (label === 'javascript' || label === 'typescript') {
      return './ts.worker.js';
    }
    return './editor.worker.js';
  }
};

const CodeEditor = ({ value, onChange }) => {
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const [theme, setTheme] = useState('vs-dark');
  const [fontSize, setFontSize] = useState(14);

  useEffect(() => {
    if (containerRef.current) {
      // Define custom themes
      monaco.editor.defineTheme('v0-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6A737D', fontStyle: 'italic' },
          { token: 'keyword', foreground: 'F97583' },
          { token: 'string', foreground: '9ECBFF' },
          { token: 'number', foreground: '79B8FF' },
          { token: 'tag', foreground: '85E89D' },
          { token: 'attribute.name', foreground: 'FFAB70' },
        ],
        colors: {
          'editor.background': '#0D1117',
          'editor.foreground': '#F0F6FC',
          'editorLineNumber.foreground': '#6E7681',
          'editor.selectionBackground': '#264F78',
          'editor.inactiveSelectionBackground': '#3A3D41',
          'editorCursor.foreground': '#F0F6FC',
        }
      });

      editorRef.current = monaco.editor.create(containerRef.current, {
        value,
        language: 'html',
        theme: 'v0-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: fontSize,
        lineNumbers: 'on',
        renderWhitespace: 'selection',
        tabSize: 2,
        wordWrap: 'on',
        formatOnPaste: true,
        formatOnType: true,
        folding: true,
        bracketMatching: 'always',
        occurrencesHighlight: false,
        selectionHighlight: false,
        roundedSelection: false,
        padding: { top: 16 },
        smoothScrolling: true,
        cursorSmoothCaretAnimation: true,
        fontLigatures: true,
        fontFamily: 'JetBrains Mono, Fira Code, Monaco, monospace',
      });

      editorRef.current.onDidChangeModelContent(() => {
        onChange(editorRef.current.getValue());
      });

      // Add keyboard shortcuts
      editorRef.current.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        // Format document
        editorRef.current.getAction('editor.action.formatDocument').run();
      });
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, [fontSize]);
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      const currentValue = editorRef.current.getValue();
      const currentPosition = editorRef.current.getPosition();
      
      editorRef.current.setValue(value);
      
      // Auto-scroll to the end if new content is being added (streaming)
      if (value.length > currentValue.length) {
        // Move cursor to the end of the document
        const lineCount = editorRef.current.getModel().getLineCount();
        const lastLineLength = editorRef.current.getModel().getLineLength(lineCount);
        
        const endPosition = {
          lineNumber: lineCount,
          column: lastLineLength + 1
        };
        
        editorRef.current.setPosition(endPosition);
        
        // Reveal the position to ensure it's visible
        editorRef.current.revealPosition(endPosition, monaco.editor.ScrollType.Smooth);
        
        // Alternative: scroll to the bottom of the editor
        editorRef.current.revealLine(lineCount, monaco.editor.ScrollType.Smooth);
      }
    }
  }, [value]);

  const formatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
    }
  };

  const copyCode = () => {
    if (editorRef.current) {
      navigator.clipboard.writeText(editorRef.current.getValue());
    }
  };

  const downloadCode = () => {
    const blob = new Blob([value], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-website.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="code-editor-container">
      {/* Editor Toolbar */}
      <div className="editor-toolbar">
        <div className="editor-info">
          <span className="file-name">generated-website.html</span>
          <span className="line-count">{value.split('\n').length} lines</span>
        </div>
        <div className="editor-actions">
          <button
            className="editor-action-btn"
            onClick={() => setFontSize(f => Math.max(10, f - 1))}
            title="Decrease font size"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"/>
            </svg>
          </button>
          <span className="font-size-indicator">{fontSize}px</span>
          <button
            className="editor-action-btn"
            onClick={() => setFontSize(f => Math.min(24, f + 1))}
            title="Increase font size"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
            </svg>
          </button>
          <div className="toolbar-divider"></div>
          <button
            className="editor-action-btn"
            onClick={formatCode}
            title="Format code (Ctrl+S)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </button>
          <button
            className="editor-action-btn"
            onClick={copyCode}
            title="Copy to clipboard"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
          </button>
          <button
            className="editor-action-btn"
            onClick={downloadCode}
            title="Download HTML file"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div ref={containerRef} className="monaco-editor" />
    </div>
  );
};

export default CodeEditor; 