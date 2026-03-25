import { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { readProjectFile } from '../services/api';

// ── Default scaffold files shown immediately after project creation ──
const SCAFFOLD_FILES = {
    'main.jsx': `import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App.jsx'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n)`,
    'App.jsx': `import React from 'react'\n\nexport default function App() {\n  return (\n    <div style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '4rem' }}>\n      <h1 style={{ color: '#4f46e5' }}>WebAgent React App</h1>\n      <p style={{ color: '#94a3b8', marginTop: '1rem' }}>AI is generating your app...</p>\n    </div>\n  )\n}`,
    'index.css': `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\nbody { font-family: system-ui, -apple-system, sans-serif; background: #fff; color: #1a1a1a; }`,
};

// ── Build a nested file tree from a flat list of paths ──────────────
function buildTree(paths) {
    const root = {};
    for (const p of paths) {
        const parts = p.split('/');
        let node = root;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i === parts.length - 1) {
                node[part] = { __file: true, path: p };
            } else {
                node[part] = node[part] || {};
                node = node[part];
            }
        }
    }
    return root;
}

// ── File icon by extension ───────────────────────────────────────────
function FileIcon({ name }) {
    const ext = name.split('.').pop();
    const color = ext === 'jsx' ? '#61dafb' : ext === 'css' ? '#f472b6' : ext === 'js' ? '#fbbf24' : ext === 'json' ? '#4ade80' : '#94a3b8';
    return <span style={{ color, fontSize: 11, fontWeight: 700, marginRight: 5, flexShrink: 0 }}>{ext?.toUpperCase()}</span>;
}

// ── Render file tree recursively ─────────────────────────────────────
function TreeNode({ name, node, selectedFile, onSelect, newFiles, depth = 0 }) {
    const [open, setOpen] = useState(true);
    const isFile = node?.__file;
    const isNew = isFile && newFiles.has(node.path);

    if (isFile) {
        return (
            <div
                onClick={() => onSelect(node.path)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: `3px 8px 3px ${12 + depth * 14}px`,
                    cursor: 'pointer', fontSize: 12, borderRadius: 4,
                    background: selectedFile === node.path ? 'rgba(96,165,250,0.15)' : 'transparent',
                    color: selectedFile === node.path ? '#93c5fd' : isNew ? '#86efac' : '#cbd5e1',
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    transition: 'all 0.15s',
                    position: 'relative',
                }}
                title={node.path}
            >
                <FileIcon name={name} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                {isNew && (
                    <span style={{
                        width: 6, height: 6, borderRadius: '50%', background: '#86efac',
                        flexShrink: 0, animation: 'pulse 1.5s ease-in-out infinite',
                    }} />
                )}
            </div>
        );
    }

    // Directory
    const children = Object.entries(node).sort(([an, av], [bn, bv]) => {
        const aIsFile = av?.__file; const bIsFile = bv?.__file;
        if (aIsFile !== bIsFile) return aIsFile ? 1 : -1;
        return an.localeCompare(bn);
    });

    return (
        <div>
            <div
                onClick={() => setOpen(o => !o)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: `3px 8px 3px ${12 + depth * 14}px`,
                    cursor: 'pointer', fontSize: 12,
                    color: '#64748b', userSelect: 'none',
                    fontFamily: "'JetBrains Mono', monospace",
                }}
            >
                <span style={{ fontSize: 9, opacity: 0.7 }}>{open ? '▼' : '▶'}</span>
                <span style={{ opacity: 0.8 }}>📁</span>
                <span style={{ color: '#94a3b8' }}>{name}</span>
            </div>
            {open && children.map(([childName, childNode]) => (
                <TreeNode
                    key={childName}
                    name={childName}
                    node={childNode}
                    selectedFile={selectedFile}
                    onSelect={onSelect}
                    newFiles={newFiles}
                    depth={depth + 1}
                />
            ))}
        </div>
    );
}

// ── Language from filename ───────────────────────────────────────────
function getLang(path) {
    if (!path) return 'javascript';
    if (path.endsWith('.jsx') || path.endsWith('.js')) return 'javascript';
    if (path.endsWith('.tsx') || path.endsWith('.ts')) return 'typescript';
    if (path.endsWith('.css')) return 'css';
    if (path.endsWith('.html')) return 'html';
    if (path.endsWith('.json')) return 'json';
    return 'plaintext';
}

// ── Main ReactIDE Component ──────────────────────────────────────────
const ReactIDE = ({
    projectName,
    devServerPort,
    isSettingUp,
    setupPhase,
    setupError,
    deployLogs = [],
    mode = 'code',
    streamingFiles = {},        // live file map from parent {path: content}
    streamingFilePaths = [],    // paths being written right now
}) => {
    const [files, setFiles] = useState({});       // path → content
    const [selectedFile, setSelectedFile] = useState(null);
    const [newFiles, setNewFiles] = useState(new Set()); // paths added via streaming

    // Reset when project changes
    useEffect(() => {
        if (!projectName) { setFiles({}); setSelectedFile(null); setNewFiles(new Set()); return; }
        // Immediately show scaffold files
        setFiles({ ...SCAFFOLD_FILES });
        setSelectedFile('App.jsx');
        setNewFiles(new Set());
    }, [projectName]);

    // Merge streaming files into local state as they arrive
    useEffect(() => {
        const entries = Object.entries(streamingFiles);
        if (entries.length === 0) return;

        setFiles(prev => ({ ...prev, ...streamingFiles }));
        setNewFiles(prev => {
            const next = new Set(prev);
            entries.forEach(([p]) => next.add(p));
            return next;
        });

        // Auto-select first streamed file if it's an App or component file
        setSelectedFile(prev => {
            const appFile = entries.find(([p]) => p === 'App.jsx');
            if (appFile && (!prev || prev === 'App.jsx')) return 'App.jsx';
            if (!prev && entries.length > 0) return entries[0][0];
            return prev;
        });
    }, [streamingFiles]);

    // Fade out "new" indicator 3s after streaming stops
    useEffect(() => {
        if (streamingFilePaths.length === 0 && newFiles.size > 0) {
            const t = setTimeout(() => setNewFiles(new Set()), 4000);
            return () => clearTimeout(t);
        }
    }, [streamingFilePaths]);

    const selectedContent = files[selectedFile] || '';
    const fileTree = buildTree(Object.keys(files));
    const treeEntries = Object.entries(fileTree);

    // ── Preview mode ────────────────────────────────────────────────
    if (mode === 'preview') {
        return (
            <div style={{ height: '100%', background: '#0f172a', display: 'flex', flexDirection: 'column' }}>
                {/* Preview toolbar */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
                    background: '#1e293b', borderBottom: '1px solid #334155', flexShrink: 0,
                }}>
                    {devServerPort ? (
                        <>
                            <div style={{ display: 'flex', gap: 6, marginRight: 8 }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
                            </div>
                            <div style={{
                                flex: 1, background: '#0f172a', border: '1px solid #334155', borderRadius: 6,
                                padding: '3px 10px', fontSize: 11, color: '#94a3b8', fontFamily: 'monospace',
                            }}>
                                http://localhost:{devServerPort}
                            </div>
                            <button
                                onClick={() => window.open(`http://localhost:${devServerPort}`, '_blank')}
                                style={{
                                    padding: '3px 10px', background: '#3b82f6', border: 'none', borderRadius: 5,
                                    color: '#fff', fontSize: 11, cursor: 'pointer',
                                }}
                            >↗ Open</button>
                        </>
                    ) : (
                        <span style={{ fontSize: 11, color: '#64748b' }}>
                            {isSettingUp ? setupPhase || 'Setting up…' : 'No preview available'}
                        </span>
                    )}
                </div>

                {/* Iframe or status */}
                <div style={{ flex: 1, position: 'relative' }}>
                    {devServerPort ? (
                        <iframe
                            src={`http://localhost:${devServerPort}`}
                            style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
                            title="React App Preview"
                        />
                    ) : (
                        <StatusPanel
                            isSettingUp={isSettingUp}
                            setupPhase={setupPhase}
                            setupError={setupError}
                            deployLogs={deployLogs}
                            projectName={projectName}
                            streamingFiles={streamingFiles}
                        />
                    )}
                </div>
            </div>
        );
    }

    // ── Code mode ────────────────────────────────────────────────────
    return (
        <div style={{ display: 'flex', height: '100%', background: '#0f172a', overflow: 'hidden' }}>

            {/* File Explorer */}
            <div style={{
                width: 200, background: '#1e293b', borderRight: '1px solid #334155',
                display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden',
            }}>
                {/* Explorer header */}
                <div style={{
                    padding: '8px 12px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                    color: '#475569', borderBottom: '1px solid #334155',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    textTransform: 'uppercase', flexShrink: 0,
                }}>
                    <span>Explorer</span>
                    {(isSettingUp || streamingFilePaths.length > 0) && (
                        <span style={{
                            width: 7, height: 7, borderRadius: '50%',
                            background: '#22c55e',
                            animation: 'pulse 1.2s ease-in-out infinite',
                        }} />
                    )}
                </div>

                {/* Project name */}
                {projectName && (
                    <div style={{
                        padding: '5px 12px', fontSize: 10, color: '#60a5fa',
                        fontFamily: 'monospace', fontWeight: 600, flexShrink: 0,
                        borderBottom: '1px solid #1e293b', overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }} title={projectName}>
                        📦 {projectName}
                    </div>
                )}

                {/* File tree */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
                    {treeEntries.length === 0 ? (
                        <div style={{ padding: '12px', fontSize: 11, color: '#475569', textAlign: 'center' }}>
                            {projectName ? 'Loading files…' : 'No project open'}
                        </div>
                    ) : (
                        treeEntries.sort(([an, av], [bn, bv]) => {
                            // dirs first
                            const aDir = !av?.__file;
                            const bDir = !bv?.__file;
                            if (aDir !== bDir) return aDir ? -1 : 1;
                            return an.localeCompare(bn);
                        }).map(([name, node]) => (
                            <TreeNode key={name} name={name} node={node}
                                selectedFile={selectedFile} onSelect={setSelectedFile}
                                newFiles={newFiles} depth={0} />
                        ))
                    )}
                </div>

                {/* Status strip */}
                {isSettingUp && (
                    <div style={{
                        padding: '6px 10px', background: '#0f172a', borderTop: '1px solid #334155',
                        fontSize: 10, color: '#86efac', flexShrink: 0,
                        display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                        <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {setupPhase || 'Working…'}
                        </span>
                    </div>
                )}
                {setupError && (
                    <div style={{
                        padding: '6px 10px', background: '#450a0a', borderTop: '1px solid #7f1d1d',
                        fontSize: 10, color: '#f87171', flexShrink: 0,
                    }}>
                        ✗ {setupError}
                    </div>
                )}
            </div>

            {/* Editor area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* File tab */}
                {selectedFile && (
                    <div style={{
                        height: 34, background: '#1e293b', borderBottom: '1px solid #334155',
                        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8,
                        fontSize: 12, color: '#e2e8f0', fontFamily: 'monospace', flexShrink: 0,
                    }}>
                        <FileIcon name={selectedFile} />
                        <span>{selectedFile}</span>
                        {newFiles.has(selectedFile) && (
                            <span style={{
                                fontSize: 9, background: '#166534', color: '#86efac',
                                padding: '1px 6px', borderRadius: 99, fontFamily: 'sans-serif',
                            }}>AI Generated</span>
                        )}
                    </div>
                )}

                {/* Monaco */}
                {selectedFile ? (
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <Editor
                            height="100%"
                            language={getLang(selectedFile)}
                            value={selectedContent}
                            theme="vs-dark"
                            options={{
                                minimap: { enabled: false },
                                fontSize: 13,
                                fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, monospace",
                                lineNumbers: 'on',
                                wordWrap: 'on',
                                scrollBeyondLastLine: false,
                                renderLineHighlight: 'all',
                                padding: { top: 10 },
                                readOnly: newFiles.has(selectedFile) && streamingFilePaths.length > 0,
                            }}
                        />
                    </div>
                ) : (
                    <div style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexDirection: 'column', gap: 12, color: '#475569',
                    }}>
                        {projectName ? (
                            <>
                                <div style={{ fontSize: 32 }}>⚡</div>
                                <p style={{ fontSize: 13 }}>Select a file to view its content</p>
                            </>
                        ) : (
                            <>
                                <div style={{ fontSize: 32 }}>🔧</div>
                                <p style={{ fontSize: 13 }}>Generate a React app to get started</p>
                            </>
                        )}
                    </div>
                )}
            </div>

            <style>{`
        @keyframes pulse { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
        @keyframes spin  { to{transform:rotate(360deg)} }
      `}</style>
        </div>
    );
};

// ── Status/Log panel for preview mode when server not running ────────
function StatusPanel({ isSettingUp, setupPhase, setupError, deployLogs, projectName, streamingFiles }) {
    const logsRef = useRef(null);
    const fileCount = Object.keys(streamingFiles).length;

    useEffect(() => {
        if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }, [deployLogs, streamingFiles]);

    return (
        <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: '#0f172a', color: '#94a3b8', padding: '2rem',
        }}>
            {setupError ? (
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
                    <p style={{ color: '#f87171', marginBottom: 8 }}>Setup Error</p>
                    <p style={{ fontSize: 12, color: '#64748b', maxWidth: 400 }}>{setupError}</p>
                </div>
            ) : (
                <div style={{ width: '100%', maxWidth: 500 }}>
                    {/* Progress header */}
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: '50%',
                            border: '3px solid #1e293b', borderTop: '3px solid #3b82f6',
                            margin: '0 auto 12px',
                            animation: isSettingUp ? 'spin 1s linear infinite' : 'none',
                        }} />
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
                            {!projectName ? 'Waiting for project…' :
                                isSettingUp ? (setupPhase || 'Setting up…') :
                                    'Dev server starting…'}
                        </p>
                    </div>

                    {/* Files being generated */}
                    {fileCount > 0 && (
                        <div style={{
                            background: '#1e293b', borderRadius: 8, padding: '10px 14px',
                            marginBottom: 12, fontSize: 12, fontFamily: 'monospace',
                        }}>
                            <div style={{ color: '#60a5fa', fontWeight: 700, marginBottom: 8 }}>
                                ⚡ {fileCount} file{fileCount !== 1 ? 's' : ''} generated
                            </div>
                            {Object.keys(streamingFiles).map(f => (
                                <div key={f} style={{ color: '#86efac', padding: '2px 0' }}>
                                    ✓ {f}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Deploy logs */}
                    {deployLogs.length > 0 && (
                        <div ref={logsRef} style={{
                            background: '#020617', border: '1px solid #1e293b', borderRadius: 8,
                            padding: '10px 14px', maxHeight: 160, overflowY: 'auto',
                            fontSize: 11, fontFamily: 'monospace',
                        }}>
                            {deployLogs.map((log, i) => (
                                <div key={i} style={{
                                    color: log.type === 'error' ? '#f87171' :
                                        log.type === 'done' ? '#86efac' :
                                            log.type === 'file' ? '#a78bfa' : '#64748b',
                                    padding: '1px 0',
                                }}>
                                    {log.type === 'file' && '📄 '}
                                    {log.type === 'status' && '⚙️ '}
                                    {log.type === 'done' && '✅ '}
                                    {log.type === 'error' && '❌ '}
                                    {log.message || log.path || JSON.stringify(log)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

export default ReactIDE;
