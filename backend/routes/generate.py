# routes/generate.py

from fastapi import APIRouter, Request, Depends
from fastapi.responses import JSONResponse, StreamingResponse
from backend.services.website_generator import generate_html_stream, generate_react_stream
import logging
from backend.db.session import get_db
from backend.core.security import get_current_user
from backend.db.models import User
from sqlalchemy.orm import Session

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/api/generate")
async def generate_website(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        body = await request.json()
        prompt = body.get("prompt", "").strip()
        framework = body.get("framework", "html")
        src_files = body.get("src_files", [])   # passed by frontend after setup
        previous_html = body.get("previous_html")
        previous_prompt = body.get("previous_prompt")

        if not prompt:
            return JSONResponse(status_code=400, content={"error": "Prompt is required"})

        if framework == "react":
            stream = await generate_react_stream(prompt, src_files, current_user)
        else:
            stream = await generate_html_stream(prompt, db, current_user, previous_html, previous_prompt)

        return StreamingResponse(stream, media_type="text/event-stream")

    except Exception as e:
        logger.error(f"Generation error: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})
