import base64
import io
import json
from PIL import Image
import asyncio 
import logging
from openai import OpenAI
from backend.db.models import User
from backend.core.config import settings

logger = logging.getLogger(__name__)
api_key = settings.API_KEY  # Use the API key from settings

def analyze_image(image_path: str) -> str:
    """
    Analyze an uploaded image and provide a detailed description of its content and layout.

    Args:
        image_path: The file path to the image to analyze

    Returns:
        A detailed description of the image content, layout, and website type
    """
    if not image_path:
        return "Error: No image path provided"

    # Use the provided API key or default key (Note: The provided API key in the original code seems to be hardcoded and not used)
    

    if not api_key:
        return "Error: API key not provided"

    try:
        # Open the image from the file path
        try:
            image = Image.open(image_path)
        except FileNotFoundError:
            return f"Error: Image file not found at {image_path}"
        except Exception as e:
            return f"Error opening image file: {str(e)}"

        # Configure Nebius OpenAI client (Note: This is configured to use OpenRouter, not Nebius)
        client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
        )

        # Convert image to base64
        buffered = io.BytesIO()
        image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")

        # Create prompt
        prompt = """
        Analyze this image and provide a concise description.
        Describe the main elements, colors, layout, and UI components.
        Identify what type of website or application this resembles.
        Focus on structural and visual elements that would be important for recreating the design.
        """

        # Use Qwen2.5-VL-72B-Instruct model for image analysis
        response = client.chat.completions.create(
            model="Qwen/Qwen2.5-VL-72B-Instruct",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{img_str}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=1000,
            temperature=0.7
        )

        return response.choices[0].message.content

    except Exception as e:
        return f"Error analyzing image: {str(e)}"

def generate_html_code(description: str, current_user: User) -> str:
    """
    Generate HTML/CSS/JavaScript code based on a website description.

    Args:
        description: Detailed description of the website to generate
        nebius_api_key: Nebius API key for code generation

    Returns:
        Complete HTML code with embedded CSS and JavaScript
    """
    if not description or description.startswith("Error"):
        return "Error: Invalid or missing description"



    # Inline system prompt and enhanced prompt
    system_prompt = """
You are an expert web developer. You will respond in EXACTLY three parts separated by specific markers:

PART 1 - ANALYSIS (between ===ANALYSIS_START=== and ===ANALYSIS_END===):
Provide a brief analysis of what the user needs, understanding their requirements, and what type of website would best serve their needs.

PART 2 - CODE (between ===CODE_START=== and ===CODE_END===):
Generate ONLY HTML, CSS AND JAVASCRIPT. If you want to use ICON make sure to import the library first. If You want to use image use www.unsplash.com. to get images(use related images). Try to create the best UI possible by using only HTML, CSS and JAVASCRIPT. Also, try to elaborate as much as you can, to create something unique. If needed you are allowed to use tailwindcss (if so make sure to import <script src=\"https://cdn.tailwindcss.com\"></script> in the head). 
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

    enhanced_prompt = f"""
CREATE A WORLD-CLASS WEBSITE FOR: {description}

Generate a complete, production-ready website that exceeds modern web standards and delivers exceptional user experience. The website should be indistinguishable from those created by professional development teams.

Remember to follow the three-part response format with proper markers for analysis, code, and summary.
"""

    nvidia_client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=current_user.api_key
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": enhanced_prompt}
    ]

    response = nvidia_client.chat.completions.create(
        model="moonshotai/kimi-k2-instruct",
        messages=messages,
        temperature=0.2,
        max_tokens=85000,
        stream=True
    )

    async def stream_generator():
        try:
            for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content.encode("utf-8")
                    await asyncio.sleep(0.01)
        except Exception as e:
            logger.error(f"Stream error: {str(e)}")
            yield f"\n[ERROR]: Stream interrupted - {str(e)}".encode("utf-8")

    return stream_generator()


def screenshot_to_code(image_path: str) -> tuple:
    """
    Complete pipeline: analyze image and generate corresponding HTML code.

    Args:
        image_path: Screenshot image path to analyze

    Returns:
        Tuple of (description, html_code)
    """
    # Analyze image
    description = analyze_image(image_path)

    if description.startswith("Error"):
        return description, "Error: Cannot generate code due to image analysis failure"

    # Generate code
    html_code = generate_html_code(description)

    return description, html_code