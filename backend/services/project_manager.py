"""
project_manager.py
Fast React project creation via template caching.
 - Template built ONCE with npm install
 - All new projects copy the template (seconds, not minutes)
"""

import os
import shutil
import asyncio
import subprocess
import re
from pathlib import Path

# ── Windows: npm is npm.cmd ────────────────────────────────────────
NPM = "npm.cmd" if os.name == "nt" else "npm"

# ── Paths ──────────────────────────────────────────────────────────
BASE_DIR     = Path(__file__).resolve().parent.parent.parent  # d:/WebAgent
PROJECTS_DIR = BASE_DIR / "projects"
TEMPLATE_DIR = BASE_DIR / "_react_template"

PROJECTS_DIR.mkdir(exist_ok=True)

# ── Running servers {project_name: Process} ────────────────────────
_running_servers: dict = {}

# ── Static file contents ───────────────────────────────────────────

PACKAGE_JSON = """{
  "name": "webagent-project",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^5.0.0"
  }
}
"""

VITE_CONFIG_TEMPLATE = """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: PORT_PLACEHOLDER,
    strictPort: false,
    host: true,
    open: false
  }
})
"""

INDEX_HTML = """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WebAgent App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
"""

MAIN_JSX = """import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
"""

DEFAULT_APP_JSX = """import React from 'react'

export default function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '4rem' }}>
      <h1 style={{ color: '#4f46e5' }}>WebAgent React App</h1>
      <p style={{ color: '#64748b' }}>Your AI-generated app will appear here.</p>
    </div>
  )
}
"""

DEFAULT_INDEX_CSS = """*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;background:#fff;color:#1a1a1a}
"""


# ── Helpers ────────────────────────────────────────────────────────

def get_project_path(project_name: str) -> Path:
    return PROJECTS_DIR / project_name


def sanitize_project_name(prompt: str) -> str:
    name = re.sub(r"[^a-z0-9\s-]", "", prompt.lower().strip())
    name = re.sub(r"\s+", "-", name)[:40].strip("-") or "react-app"
    base, counter = name, 1
    while (PROJECTS_DIR / name).exists():
        name = f"{base}-{counter}"; counter += 1
    return name


def build_file_tree(path: Path, relative_to: Path = None) -> list:
    if relative_to is None:
        relative_to = path
    SKIP = {"node_modules", ".git", "dist", "__pycache__", ".vite", ".cache"}
    entries = []
    try:
        for entry in sorted(path.iterdir()):
            if entry.name in SKIP:
                continue
            rel = str(entry.relative_to(relative_to)).replace("\\", "/")
            if entry.is_dir():
                entries.append({"name": entry.name, "path": rel, "type": "directory",
                                 "children": build_file_tree(entry, relative_to)})
            else:
                entries.append({"name": entry.name, "path": rel, "type": "file",
                                 "size": entry.stat().st_size})
    except PermissionError:
        pass
    return entries


def get_src_file_list(project_name: str) -> list:
    src = get_project_path(project_name) / "src"
    if not src.exists():
        return ["App.jsx", "index.css", "main.jsx"]
    return [str(f.relative_to(src)).replace("\\", "/")
            for f in sorted(src.rglob("*")) if f.is_file()]


async def _run_npm(args: list, cwd: str) -> tuple[int, str, str]:
    """Run an npm command, returns (returncode, stdout, stderr)."""
    try:
        proc = await asyncio.create_subprocess_exec(
            NPM, *args,
            cwd=cwd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=300)
        return proc.returncode, stdout.decode("utf-8", errors="replace"), stderr.decode("utf-8", errors="replace")
    except FileNotFoundError:
        # Try with shell=True as fallback (catches PATH issues on Windows)
        proc = await asyncio.create_subprocess_shell(
            f"npm {' '.join(args)}",
            cwd=cwd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=300)
        return proc.returncode, stdout.decode("utf-8", errors="replace"), stderr.decode("utf-8", errors="replace")
    except asyncio.TimeoutError:
        return 1, "", "npm install timed out after 300s"


def _write_template_files(base: Path):
    """Write the base template files (no node_modules)."""
    src = base / "src"
    src.mkdir(parents=True, exist_ok=True)
    (base / "package.json").write_text(PACKAGE_JSON, encoding="utf-8")
    (base / "index.html").write_text(INDEX_HTML,     encoding="utf-8")
    (base / "vite.config.js").write_text(
        VITE_CONFIG_TEMPLATE.replace("PORT_PLACEHOLDER", "5174"), encoding="utf-8")
    (src / "main.jsx").write_text(MAIN_JSX,          encoding="utf-8")
    (src / "App.jsx").write_text(DEFAULT_APP_JSX,    encoding="utf-8")
    (src / "index.css").write_text(DEFAULT_INDEX_CSS, encoding="utf-8")


# ── Template: build ONCE, copy for every project ──────────────────

async def ensure_template() -> dict:
    """
    Build the shared node_modules template once.
    Returns {"success": True/False, "cached": True/False}.
    """
    try:
        if (TEMPLATE_DIR / "node_modules").exists():
            return {"success": True, "cached": True}

        TEMPLATE_DIR.mkdir(parents=True, exist_ok=True)
        _write_template_files(TEMPLATE_DIR)

        rc, stdout, stderr = await _run_npm(["install", "--prefer-offline"], str(TEMPLATE_DIR))
        if rc != 0:
            return {"success": False, "error": f"npm install failed (rc={rc}): {stderr[:400] or stdout[:400]}"}

        return {"success": True, "cached": False}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ── Create project ────────────────────────────────────────────────

async def create_project(prompt: str) -> dict:
    """
    Create a new React project.
    FAST PATH: copy pre-built template (if available).
    SLOW PATH: fresh npm install (first run or if template failed).
    """
    project_name = sanitize_project_name(prompt)
    project_path = get_project_path(project_name)

    try:
        # Ensure template is built
        tmpl = await ensure_template()

        if tmpl.get("success") and (TEMPLATE_DIR / "node_modules").exists():
            # ── FAST: copy template ───────────────────────────────
            await asyncio.to_thread(
                shutil.copytree,
                str(TEMPLATE_DIR),
                str(project_path),
                symlinks=False,
                ignore=shutil.ignore_patterns("dist", ".vite"),
            )
        else:
            # ── SLOW: fresh install ───────────────────────────────
            project_path.mkdir(parents=True, exist_ok=True)
            _write_template_files(project_path)

            rc, stdout, stderr = await _run_npm(["install", "--prefer-offline"], str(project_path))
            if rc != 0:
                return {
                    "success": False,
                    "error": f"npm install failed: {stderr[:400] or stdout[:400] or 'unknown error'}",
                }

        return {
            "success": True,
            "project_name": project_name,
            "project_path": str(project_path),
            "src_files": get_src_file_list(project_name),
        }

    except Exception as e:
        import traceback
        return {"success": False, "error": f"{type(e).__name__}: {e}\n{traceback.format_exc()[-300:]}"}


# ── Write AI files ────────────────────────────────────────────────

def write_project_files(project_name: str, files: dict) -> dict:
    """Write {path_relative_to_src: content} into the project src/ dir."""
    src_dir = get_project_path(project_name) / "src"
    written = []
    try:
        for file_path, content in files.items():
            clean = file_path.lstrip("/")
            if clean.startswith("src/"):
                clean = clean[4:]
            full = src_dir / clean
            full.parent.mkdir(parents=True, exist_ok=True)
            full.write_text(content, encoding="utf-8")
            written.append(clean)

        # Ensure main.jsx is never deleted
        mj = src_dir / "main.jsx"
        if not mj.exists():
            mj.write_text(MAIN_JSX, encoding="utf-8")
            written.append("main.jsx")

        return {"success": True, "files_written": written}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ── Dev Server ────────────────────────────────────────────────────

async def start_dev_server(project_name: str, port: int = 5174) -> dict:
    await stop_dev_server(project_name)

    project_path = get_project_path(project_name)
    if not project_path.exists():
        return {"success": False, "error": "Project not found"}

    # Write correct port into vite config
    try:
        (project_path / "vite.config.js").write_text(
            VITE_CONFIG_TEMPLATE.replace("PORT_PLACEHOLDER", str(port)), encoding="utf-8")
    except Exception:
        pass

    try:
        create_flags = subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0

        # Try npm.cmd first, fall back to shell
        try:
            proc = await asyncio.create_subprocess_exec(
                NPM, "run", "dev",
                cwd=str(project_path),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                creationflags=create_flags,
            )
        except FileNotFoundError:
            proc = await asyncio.create_subprocess_shell(
                "npm run dev",
                cwd=str(project_path),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

        _running_servers[project_name] = proc
        url = f"http://localhost:{port}"

        # Wait for Vite's ready line
        for _ in range(30):
            await asyncio.sleep(0.5)
            if proc.returncode is not None:
                return {"success": False, "error": "Dev server exited unexpectedly"}
            try:
                line = await asyncio.wait_for(proc.stdout.readline(), timeout=0.2)
                decoded = line.decode("utf-8", errors="replace")
                if "localhost" in decoded or "Local:" in decoded or "ready in" in decoded:
                    return {"success": True, "port": port, "url": url}
            except asyncio.TimeoutError:
                pass

        return {"success": True, "port": port, "url": url}

    except Exception as e:
        return {"success": False, "error": str(e)}


async def stop_dev_server(project_name: str = None) -> dict:
    targets = list(_running_servers.keys()) if project_name is None else [project_name]
    for name in targets:
        proc = _running_servers.pop(name, None)
        if proc and proc.returncode is None:
            try:
                if os.name == "nt":
                    proc.send_signal(subprocess.signal.CTRL_BREAK_EVENT)
                else:
                    proc.terminate()
                await asyncio.wait_for(proc.wait(), timeout=5)
            except Exception:
                try: proc.kill()
                except Exception: pass
    return {"success": True}


# ── File utilities ────────────────────────────────────────────────

def get_file_tree(project_name: str) -> dict:
    p = get_project_path(project_name)
    if not p.exists():
        return {"success": False, "error": "Project not found"}
    return {"success": True, "tree": build_file_tree(p)}


def read_file(project_name: str, file_path: str) -> dict:
    try:
        return {"success": True,
                "content": (get_project_path(project_name) / file_path.lstrip("/")).read_text(encoding="utf-8")}
    except Exception as e:
        return {"success": False, "error": str(e)}


def write_file(project_name: str, file_path: str, content: str) -> dict:
    try:
        p = get_project_path(project_name) / file_path.lstrip("/")
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content, encoding="utf-8")
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}
