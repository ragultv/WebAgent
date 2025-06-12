import os
import json
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from openai import OpenAI
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Initialize FastAPI
app = FastAPI(title="WebAgent AI World-Class Website Builder", version="4.0.0")

# Enhanced CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# API Keys
NVAPI_KEY = os.getenv("NVAPI_KEY", "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")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "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")

# AI Clients
nvidia_client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=NVAPI_KEY
)

router_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY
)


# System Prompt for Initial Generation
def get_world_class_system_prompt():
    return """You are a WORLD-CLASS web designer and full-stack developer who creates PRODUCTION-READY, ENTERPRISE-LEVEL websites that rival the best websites on the internet.

🎯 MISSION: Create stunning, comprehensive websites that are indistinguishable from websites built by top-tier agencies like Stripe, Vercel, Linear, or Figma.

📋 MANDATORY REQUIREMENTS:
- Generate HTML files with 1000+ lines minimum
- Include comprehensive sections and features
- Create pixel-perfect, modern designs
- Implement advanced animations and interactions
- Add realistic, industry-specific content
- Include multiple pages worth of content in single file
- Use production-level code structure and organization

ONLY OUTPUT THE HTML FILE STARTING WITH <!DOCTYPE html> AND ENDING WITH </html>, INCLUDING ALL NECESSARY STYLES AND SCRIPTS. DO NOT INCLUDE ANY EXPLANATION OR ADDITIONAL TEXT.
"""

# System Prompt for Modifications
def get_modification_system_prompt():
    return """You are an expert web developer modifying an existing HTML file.
The user wants to apply changes based on their request.
You MUST output ONLY the changes required using the following SEARCH/REPLACE block format. Do NOT output the entire file.
Explain the changes briefly *before* the blocks if necessary, but the code changes THEMSELVES MUST be within the blocks.
Format Rules:
1. Start with <<<<<<< SEARCH
2. Provide the exact lines from the current code that need to be replaced.
3. Use ======= to separate the search block from the replacement.
4. Provide the new lines that should replace the original lines.
5. End with >>>>>>> REPLACE
6. You can use multiple SEARCH/REPLACE blocks if changes are needed in different parts of the file.
7. To insert code, use an empty SEARCH block (only <<<<<<< SEARCH and ======= on their lines) if inserting at the very beginning, otherwise provide the line *before* the insertion point in the SEARCH block and include that line plus the new lines in the REPLACE block.
8. To delete code, provide the lines to delete in the SEARCH block and leave the REPLACE block empty (only ======= and >>>>>>> REPLACE on their lines).
9. IMPORTANT: The SEARCH block must *exactly* match the current code, including indentation and whitespace.
"""

def get_enhanced_user_prompt(original_prompt):
    return f"""
Create a WORLD-CLASS, PRODUCTION-READY website for: {original_prompt}

🎯 COMPREHENSIVE REQUIREMENTS:
1. ANALYZE THE BUSINESS/PURPOSE:
   - Identify the target audience and their needs
   - Determine the primary business goals
   - Research industry standards and competitors
   - Choose appropriate messaging and tone

2. CREATE COMPREHENSIVE SECTIONS:
   - Hero section with compelling value proposition
   - Detailed features/services breakdown
   - Social proof (testimonials, logos, stats)
   - About section with team/company info
   - Pricing or service offerings
   - FAQ section addressing common concerns
   - Contact information and forms
   - Rich footer with additional resources

3. GENERATE REALISTIC CONTENT:
   - Write authentic, industry-specific copy
   - Create believable testimonials with names
   - Add relevant statistics and data points
   - Include proper company information
   - Write compelling headlines and CTAs

4. IMPLEMENT ADVANCED FEATURES:
   - Interactive navigation with smooth scrolling
   - Animated elements on scroll
   - Form validation and user feedback
   - Responsive image galleries
   - Modal windows or lightboxes

5. ENSURE PRODUCTION QUALITY:
   - Mobile-responsive across all devices using TailwindCSS
   - Fast loading with optimized code
   - SEO-friendly structure and content
   - Accessibility compliance (WCAG guidelines)
   - Cross-browser compatibility

6. VISUAL EXCELLENCE:
   - Choose sophisticated color palette
   - Use professional typography (Google Fonts via TailwindCSS)
   - Create consistent spacing and layout with TailwindCSS
   - Add subtle animations and effects
   - Implement modern design trends
DELIVER: Complete HTML file ready for production deployment. without any explanation or additional text.only the HTML file starting with <!DOCTYPE html> and end with </html> including all necessary styles and scripts.
"""

@app.post("/api/generate")
async def generate_website(request: Request):
    try:
        body = await request.json()
        prompt = body.get("prompt", "").strip()
        previous_html = body.get("previous_html")
        previous_prompt = body.get("previous_prompt")
        
        if not prompt:
            return JSONResponse(status_code=400, content={"error": "Prompt is required"})

        if previous_html:
            # Modification request
            system_prompt = get_modification_system_prompt()
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": previous_prompt or "You are modifying the HTML file based on the user's request."},
                {"role": "assistant", "content": f"The current code is: \n```html\n{previous_html}\n```"},
                {"role": "user", "content": prompt}
            ]
        else:
            # Initial generation
            system_prompt = get_world_class_system_prompt()
            enhanced_prompt = get_enhanced_user_prompt(prompt)
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": enhanced_prompt}
            ]

        # Stream response
        completion = nvidia_client.chat.completions.create(
            model="deepseek-ai/deepseek-r1-0528",
            messages=messages,
            temperature=0.2,
            max_tokens=150000,
            stream=True
        )

        async def stream_generator():
            try:
                for chunk in completion:
                    if chunk.choices and chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content.encode("utf-8")
            except Exception as e:
                logger.error(f"Stream error: {str(e)}")
                yield f"Error: {str(e)}".encode("utf-8")

        return StreamingResponse(stream_generator(), media_type="text/plain")
        
    except Exception as e:
        logger.error(f"Generation error: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})