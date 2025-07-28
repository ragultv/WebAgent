import os
import asyncio
import logging
from dotenv import load_dotenv
from openai import OpenAI
from backend.db.models import User
from sqlalchemy.orm import Session
from fastapi import Depends
from backend.core.security import get_current_user


load_dotenv()
logger = logging.getLogger(__name__)


def get_unified_system_prompt():
    return """
You are an expert web developer. You will respond in EXACTLY three parts separated by specific markers:

PART 1 - ANALYSIS (between ===ANALYSIS_START=== and ===ANALYSIS_END===):
Provide a brief analysis of what the user needs, understanding their requirements, and what type of website would best serve their needs.

PART 2 - CODE (between ===CODE_START=== and ===CODE_END===):
Generate ONLY HTML, CSS AND JAVASCRIPT. If you want to use ICON make sure to import the library first. If You want to use image use www.unsplash.com. to get images(use related images). Try to create the best UI possible by using only HTML, CSS and JAVASCRIPT. Also, try to elaborate as much as you can, to create something unique. If needed you are allowed to use tailwindcss (if so make sure to import <script src="https://cdn.tailwindcss.com"></script> in the head). 
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

Generate a complete, production-ready website that exceeds modern web standards and delivers exceptional user experience. The website should be indistinguishable from those created by professional development teams.

Remember to follow the three-part response format with proper markers for analysis, code, and summary.
"""


async def generate_html_stream(prompt: str, db: Session, current_user: User, previous_html: str = None, previous_prompt: str = None):
    
    if not current_user or not current_user.api_key:
        raise Exception("API key not found for user.")

    nvidia_client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=current_user.api_key
    )

    
    system_prompt = get_unified_system_prompt()
    enhanced_prompt = get_enhanced_user_prompt(prompt)
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": enhanced_prompt}
    ]

    completion = nvidia_client.chat.completions.create(
        model="moonshotai/kimi-k2-instruct",
        messages=messages,
        temperature=0.2,
        max_tokens=85000,
        stream=True
    )

    async def stream_generator():
        try:
            for chunk in completion:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content.encode("utf-8")
                    await asyncio.sleep(0.01)
        except Exception as e:
            logger.error(f"Stream error: {str(e)}")
            yield f"\n[ERROR]: Stream interrupted - {str(e)}".encode("utf-8")

    return stream_generator()