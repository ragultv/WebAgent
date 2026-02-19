"""
routes/project.py  —  React project management endpoints
"""

import os
import re
import asyncio
import json as _json
from pathlib import Path
from fastapi import APIRouter, Request, Depends
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session

from backend.db.session import get_db
from backend.core.security import get_current_user, get_optional_user
from backend.db.models import User
from backend.services.project_manager import (
    create_project,
    start_dev_server,
    stop_dev_server,
    get_file_tree,
    read_file,
    write_file,
    get_project_path,
    MAIN_JSX,
    ensure_template,
)
from backend.services.website_generator import generate_react_stream

router = APIRouter(prefix="/api/project", tags=["project"])


# ── Helpers ────────────────────────────────────────────────────────

def _sse(obj: dict) -> str:
    return f"data: {_json.dumps(obj)}\n\n"


def _write_src_file(project_name: str, rel_path: str, content: str) -> str:
    """Write content into src/<rel_path>, return the normalised path."""
    clean = rel_path.lstrip("/")
    if clean.startswith("src/"):
        clean = clean[4:]
    full = get_project_path(project_name) / "src" / clean
    full.parent.mkdir(parents=True, exist_ok=True)
    full.write_text(content, encoding="utf-8")
    return clean


# ── Warmup template ────────────────────────────────────────────────

@router.post("/warmup")
async def warmup_template():
    result = await ensure_template()
    return JSONResponse(content=result)


# ── Setup: scaffold project (no auth required — local fs only) ─────

@router.post("/setup")
async def setup_project(
    request: Request,
    db: Session = Depends(get_db),
    _user=Depends(get_optional_user),        # optional — won't 401
):
    """
    Scaffold a new Vite+React project from the cached template.
    Also stops any previously running dev server so port 5174 is free.
    """
    body = await request.json()
    prompt = body.get("prompt", "react-app")

    # Stop any previously running server before creating a new project
    await stop_dev_server()

    result = await create_project(prompt)
    return JSONResponse(content=result)


# ── stream-generate: AI → files → disk → dev server (SSE) ─────────
#
#  This is the single workhorse endpoint.  Auth IS required here
#  because we need current_user.api_key to call the AI.

@router.post("/stream-generate")
async def stream_generate(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # must have API key
):
    body = await request.json()
    project_name = body.get("project_name")
    prompt       = body.get("prompt", "")
    src_files    = body.get("src_files", [])
    port         = body.get("port", 5174)

    if not project_name or not prompt:
        return JSONResponse(
            status_code=400,
            content={"error": "project_name and prompt are required"},
        )

    async def event_stream():
        buffer      = ""
        found_files = set()
        current_sec = "analysis"

        file_pattern = re.compile(
            r"===FILE_START:([^\n=][^\n]*)===\n([\s\S]*?)===FILE_END===",
            re.MULTILINE,
        )

        try:
            ai_stream = await generate_react_stream(prompt, src_files, current_user)

            async for raw_chunk in ai_stream:
                chunk   = raw_chunk.decode("utf-8", errors="replace")
                buffer += chunk

                # ── Section detection ──────────────────────────────
                if current_sec == "analysis" and "===FILES_START===" in buffer:
                    current_sec = "files"
                    m = re.search(r"===ANALYSIS_START===([\s\S]*?)===ANALYSIS_END===", buffer)
                    if m:
                        yield _sse({"type": "analysis", "text": m.group(1).strip()})
                    yield _sse({"type": "status", "message": "Writing files..."})

                elif current_sec == "files" and "===SUMMARY_START===" in buffer:
                    current_sec = "summary"

                # ── Stream partial analysis text ───────────────────
                if current_sec == "analysis":
                    m = re.search(
                        r"===ANALYSIS_START===([\s\S]*?)(?===ANALYSIS_END===|$)", buffer
                    )
                    if m:
                        yield _sse({"type": "analysis_partial", "text": m.group(1).strip()})

                # ── Extract + immediately write newly completed files
                if current_sec in ("files", "summary"):
                    files_section = buffer.split("===FILES_START===", 1)[-1]

                    for match in file_pattern.finditer(files_section):
                        rel_path = match.group(1).strip()
                        content  = match.group(2)

                        if rel_path in found_files:
                            continue
                        found_files.add(rel_path)

                        # Write to disk immediately
                        try:
                            clean_path = _write_src_file(project_name, rel_path, content)
                        except Exception as we:
                            yield _sse({"type": "error", "message": f"Write {rel_path}: {we}"})
                            continue

                        # ★ Stream file event to frontend
                        yield _sse({
                            "type":    "file",
                            "path":    clean_path,
                            "content": content,
                            "size":    len(content),
                        })

            # ── After AI stream ends: flush any remaining files ─────
            if current_sec in ("files", "summary"):
                files_section = buffer.split("===FILES_START===", 1)[-1]
                for match in file_pattern.finditer(files_section):
                    rel_path = match.group(1).strip()
                    content  = match.group(2)
                    if rel_path in found_files:
                        continue
                    found_files.add(rel_path)
                    try:
                        clean_path = _write_src_file(project_name, rel_path, content)
                        yield _sse({"type": "file", "path": clean_path,
                                    "content": content, "size": len(content)})
                    except Exception as e:
                        yield _sse({"type": "error", "message": str(e)})

            # Always ensure main.jsx exists
            mj = get_project_path(project_name) / "src" / "main.jsx"
            if not mj.exists():
                mj.write_text(MAIN_JSX, encoding="utf-8")

            # Emit summary
            sm = re.search(r"===SUMMARY_START===([\s\S]*?)===SUMMARY_END===", buffer)
            if sm:
                yield _sse({"type": "summary", "text": sm.group(1).strip()})

            if not found_files:
                yield _sse({"type": "error",
                            "message": "AI produced no files. Try rephrasing your prompt."})
                return

            # ── Start dev server (all files already written) ────────
            yield _sse({"type": "status", "message": "Starting Vite dev server..."})
            server = await start_dev_server(project_name, port)

            if server["success"]:
                yield _sse({"type": "done", "port": server["port"], "url": server["url"]})
            else:
                yield _sse({"type": "error", "message": server.get("error", "Server failed")})

        except Exception as exc:
            import traceback
            yield _sse({"type": "error", "message": f"{type(exc).__name__}: {exc}"})

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# ── Deploy (legacy — kept for backwards compat) ────────────────────

@router.post("/deploy")
async def deploy_project(
    request: Request,
    db: Session = Depends(get_db),
    _user=Depends(get_optional_user),
):
    body = await request.json()
    project_name = body.get("project_name")
    files = body.get("files", {})
    port  = body.get("port", 5174)

    if not project_name:
        return JSONResponse(status_code=400,
                            content={"success": False, "error": "project_name is required"})

    async def event_stream():
        src_dir = str(get_project_path(project_name) / "src")
        for fp, content in files.items():
            clean = fp.lstrip("/")
            if clean.startswith("src/"): clean = clean[4:]
            full = os.path.join(src_dir, clean)
            os.makedirs(os.path.dirname(full), exist_ok=True)
            with open(full, "w", encoding="utf-8") as f: f.write(content)
            yield _sse({"type": "file", "path": clean, "size": len(content)})
            await asyncio.sleep(0.02)

        yield _sse({"type": "status", "message": "Starting dev server..."})
        result = await start_dev_server(project_name, port)
        if result["success"]:
            yield _sse({"type": "done", "port": result["port"], "url": result["url"]})
        else:
            yield _sse({"type": "error", "message": result.get("error", "Failed")})

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# ── Stop dev server (no auth — local operation) ────────────────────

@router.post("/stop")
async def stop_server(_user=Depends(get_optional_user)):
    return JSONResponse(content=await stop_dev_server())


# ── File tree ─────────────────────────────────────────────────────

@router.get("/files/{project_name}")
async def project_files(
    project_name: str,
    _user=Depends(get_optional_user),
):
    return JSONResponse(content=get_file_tree(project_name))


# ── Read file ─────────────────────────────────────────────────────

@router.get("/file/{project_name}")
async def read_project_file(
    project_name: str,
    path: str,
    _user=Depends(get_optional_user),
):
    return JSONResponse(content=read_file(project_name, path))


# ── Write file ────────────────────────────────────────────────────

@router.post("/file/{project_name}")
async def write_project_file(
    project_name: str,
    request: Request,
    _user=Depends(get_optional_user),
):
    body = await request.json()
    path    = body.get("path")
    content = body.get("content", "")
    if not path:
        return JSONResponse(status_code=400,
                            content={"success": False, "error": "path is required"})
    return JSONResponse(content=write_file(project_name, path, content))
