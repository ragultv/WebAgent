import { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';
import { Download, Copy, FileCode, Minus, Plus, Maximize, RotateCcw } from 'lucide-react';

// Configure Monaco Editor web workers
// self.MonacoEnvironment is handled by vite-plugin-monaco-editor

const CodeEditor = ({ value, onChange }) => {
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const [theme, setTheme] = useState('GoogleDark');
  const [fontSize, setFontSize] = useState(14);

  useEffect(() => {
    if (containerRef.current) {
      // Define custom theme to match Google AI Studio
      monaco.editor.defineTheme('GoogleDark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6A737D', fontStyle: 'italic' },
          { token: 'keyword', foreground: 'F97583' },
          { token: 'string', foreground: '9ECBFF' },
          { token: 'number', foreground: '79B8FF' },
          { token: 'tag', foreground: '85E89D' },
          { token: 'attribute.name', foreground: 'B392F0' },
        ],
        colors: {
          'editor.background': '#131314', // google-dark
          'editor.foreground': '#e3e3e3', // google-text
          'editorLineNumber.foreground': '#444746', // google-border
          'editor.selectionBackground': '#264F78',
          'editor.inactiveSelectionBackground': '#3A3D41',
          'editorCursor.foreground': '#a8c7fa', // google-primary
        }
      });

      editorRef.current = monaco.editor.create(containerRef.current, {
        value,
        language: 'html',
        theme: 'GoogleDark',
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
        padding: { top: 16 },
        fontFamily: 'JetBrains Mono, Roboto Mono, monospace',
      });

      editorRef.current.onDidChangeModelContent(() => {
        onChange(editorRef.current.getValue());
      });
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ fontSize: fontSize });
    }
  }, [fontSize]);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      const currentValue = editorRef.current.getValue();
      editorRef.current.setValue(value);

      // Auto-scroll logic if needed
      if (value.length > currentValue.length) {
        editorRef.current.revealLine(editorRef.current.getModel().getLineCount());
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
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-google-dark relative">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-google-surface border-b border-google-border shrink-0">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-google-text font-medium flex items-center gap-2">
            <FileCode className="w-4 h-4 text-google-primary" />
            index.html
          </span>
          <span className="text-google-text-secondary text-xs">
            {value.split('\n').length} lines
          </span>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex items-center bg-google-dark rounded-md border border-google-border mr-2">
            <button
              className="p-1.5 text-google-text-secondary hover:text-google-text hover:bg-google-surface-hover transition-colors rounded-l-md"
              onClick={() => setFontSize(f => Math.max(10, f - 1))}
              title="Decrease font size"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="px-2 text-xs text-google-text font-mono w-8 text-center">{fontSize}</span>
            <button
              className="p-1.5 text-google-text-secondary hover:text-google-text hover:bg-google-surface-hover transition-colors rounded-r-md"
              onClick={() => setFontSize(f => Math.min(24, f + 1))}
              title="Increase font size"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <button
            className="p-2 text-google-text-secondary hover:text-google-text hover:bg-google-surface-hover transition-colors rounded-md"
            onClick={formatCode}
            title="Format code"
          >
            <Maximize className="w-4 h-4" /> {/* Using Maximize as placeholder for format icon if not available, or standard icon */}
          </button>

          <button
            className="p-2 text-google-text-secondary hover:text-google-text hover:bg-google-surface-hover transition-colors rounded-md"
            onClick={copyCode}
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            className="p-2 text-google-text-secondary hover:text-google-text hover:bg-google-surface-hover transition-colors rounded-md"
            onClick={downloadCode}
            title="Download HTML"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 relative overflow-hidden">
        <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      </div>
    </div>
  );
};

export default CodeEditor; 