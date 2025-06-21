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


    prompt = f"""
    Generate a complete, responsive webpage based on this description and return only the html code starting with <!DOCTYPE html> and ending with </html> without any explanations:

    {description}

    Requirements:
    - Use modern HTML5, CSS3, and vanilla JavaScript only
    - Include TailwindCSS via CDN for styling
    - Make it responsive and visually appealing
    - Use placeholder images from https://unsplash.com/ if needed
    - Include proper semantic HTML structure
    - Add interactive elements where appropriate
    - Ensure the design matches the described layout and style

    Return only the complete HTML code starting with <!DOCTYPE html> and ending with </html>.
    """

    
    # Configure Nebius OpenAI client (Note: This is configured to use NVIDIA API, not Nebius)
    nvidia_client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=current_user.api_key
  )
    

    # Use DeepSeek-V3-0324 model for code generation
    response = nvidia_client.chat.completions.create(
    model="deepseek-ai/deepseek-r1-0528",
    messages=[
        {
            "role": "system",
            "content": (
                "You are a professional front-end web developer. "
                "Always respond with valid HTML code only. "
                "Return a complete HTML5 webpage starting strictly with <!DOCTYPE html> "
                "and ending with </html>. Do not include any explanations, extra text, or Markdown. "
                "Do not wrap the code in code blocks. Output only raw HTML."
                "when generating the HTML, ensure it is well-structured, and no explanations are provided."
            )
        },
        {
            "role": "user",
            "content": prompt
        }
    ],
    temperature=0.2,
    max_tokens=150000,
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