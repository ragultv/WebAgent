import os
import asyncio
import logging
from dotenv import load_dotenv
from openai import OpenAI
from backend.db.models import User
from sqlalchemy.orm import Session

load_dotenv()
logger = logging.getLogger(__name__)


# ── HTML Generator ─────────────────────────────────────────────────

def get_unified_system_prompt():
    return """
You are an expert web developer. You will respond in EXACTLY three parts separated by specific markers:

PART 1 - ANALYSIS (between ===ANALYSIS_START=== and ===ANALYSIS_END===):
Provide a brief analysis of what the user needs, understanding their requirements, and what type of website would best serve their needs.

PART 2 - CODE (between ===CODE_START=== and ===CODE_END===):
Generate ONLY HTML, CSS AND JAVASCRIPT. If you want to use ICON make sure to import the library first. If You want to use image use www.unsplash.com to get images (use related images). Try to create the best UI possible. If needed you are allowed to use tailwindcss (if so make sure to import <script src="https://cdn.tailwindcss.com"></script> in the head).
OUTPUT ONLY THE COMPLETE HTML CODE STARTING WITH <!DOCTYPE html> AND ENDING WITH </html>. NO ADDITIONAL TEXT.

PART 3 - SUMMARY (between ===SUMMARY_START=== and ===SUMMARY_END===):
Explain what you have created, key features implemented, design choices made, and how it meets the user's requirements.

**STRICT FORMAT REQUIREMENT:**
===ANALYSIS_START===
[Your analysis here]
===ANALYSIS_END===

===CODE_START===
[Complete HTML code here]
===CODE_END===

===SUMMARY_START===
[Your summary here]
===SUMMARY_END===
"""


def get_enhanced_user_prompt(original_prompt):
    return f"""
CREATE A WORLD-CLASS WEBSITE FOR: {original_prompt}

Generate a complete, production-ready website that exceeds modern web standards and delivers exceptional user experience.
Remember to follow the three-part response format with proper markers for analysis, code, and summary.
"""


async def generate_html_stream(prompt: str, db: Session, current_user: User,
                               previous_html: str = None, previous_prompt: str = None):
    if not current_user or not current_user.api_key:
        raise Exception("API key not found for user.")

    client = OpenAI(base_url="https://integrate.api.nvidia.com/v1", api_key=current_user.api_key)

    messages = [
        {"role": "system", "content": get_unified_system_prompt()},
        {"role": "user", "content": get_enhanced_user_prompt(prompt)},
    ]

    completion = client.chat.completions.create(
        model="moonshotai/kimi-k2-instruct-0905",
        messages=messages,
        temperature=0.2,
        max_tokens=85000,
        stream=True,
    )

    async def stream_generator():
        try:
            for chunk in completion:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content.encode("utf-8")
        except Exception as e:
            logger.error(f"HTML stream error: {str(e)}")
            yield f"\n[ERROR]: Stream interrupted - {str(e)}".encode("utf-8")

    return stream_generator()


# ── React Generator ────────────────────────────────────────────────

def get_react_system_prompt(src_files: list) -> str:
    file_list = "\n".join(f"  - {f}" for f in src_files) if src_files else "  - App.jsx\n  - index.css\n  - main.jsx"
    return f"""You are an expert React developer. A Vite+React project has already been scaffolded. The src/ folder currently contains:
{file_list}

Respond in EXACTLY three parts:

PART 1 — between ===ANALYSIS_START=== and ===ANALYSIS_END===
Brief analysis of what you will build.

PART 2 — between ===FILES_START=== and ===FILES_END===
Output EACH file using this exact streaming format (do NOT use JSON):

===FILE_START:<path relative to src/>===
<complete file content — write it exactly as it should be saved>
===FILE_END===

RULES:
- Paths are RELATIVE to src/ — e.g. App.jsx, components/Hero.jsx, App.css
- ALWAYS output App.jsx and index.css at minimum
- Do NOT output main.jsx (already exists and imports App.jsx correctly)
- Use modern React: functional components + hooks
- CSS files for styling only — NO Tailwind, NO styled-components, NO npm installs
- For images: use src="https://source.unsplash.com/random/800x400?KEYWORD"
- Make the UI beautiful, modern, and production-ready
- Separate components into a components/ subfolder

EXAMPLE:
===FILES_START===
===FILE_START:App.jsx===
import React from 'react';
import './App.css';
import Hero from './components/Hero.jsx';

export default function App() {{
  return (
    <div className="app">
      <Hero />
    </div>
  );
}}
===FILE_END===
===FILE_START:App.css===
body {{ margin: 0; font-family: sans-serif; }}
===FILE_END===
===FILES_END===

PART 3 — between ===SUMMARY_START=== and ===SUMMARY_END===
Brief summary of what was built.

FULL FORMAT:
===ANALYSIS_START===
[analysis]
===ANALYSIS_END===
===FILES_START===
===FILE_START:filename.jsx===
[content]
===FILE_END===
...more files...
===FILES_END===
===SUMMARY_START===
[summary]
===SUMMARY_END===
"""


def get_react_user_prompt(original_prompt: str) -> str:
    return f"""BUILD A WORLD-CLASS REACT APPLICATION FOR: {original_prompt}

Requirements:
- Multiple components organized in src/components/ subfolder
- Beautiful modern UI: rich colors, great typography, proper spacing
- Smooth CSS transitions and hover effects
- Fully responsive layout
- Real, meaningful content (no lorem ipsum)
- Use the ===FILE_START:path===...===FILE_END=== format for EVERY file
"""



async def generate_react_stream(prompt: str, src_files: list, current_user: User):
    """
    Generate React source files for an already-scaffolded project.
    The FILES section streams a JSON map of { "relative/path.jsx": "content" }.
    """
    if not current_user or not current_user.api_key:
        raise Exception("API key not found for user.")

    client = OpenAI(base_url="https://integrate.api.nvidia.com/v1", api_key=current_user.api_key)

    messages = [
        {"role": "system", "content": get_react_system_prompt(src_files)},
        {"role": "user",   "content": get_react_user_prompt(prompt)},
    ]

    completion = client.chat.completions.create(
        model="moonshotai/kimi-k2-instruct-0905",
        messages=messages,
        temperature=0.25,
        max_tokens=32000,
        stream=True,
    )

    async def stream_generator():
        try:
            for chunk in completion:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content.encode("utf-8")
        except Exception as e:
            logger.error(f"React stream error: {str(e)}")
            yield f"\n[ERROR]: {str(e)}".encode("utf-8")

    return stream_generator()