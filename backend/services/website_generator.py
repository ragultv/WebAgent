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


def get_dynamic_world_class_system_prompt():
    return """
**STRICT INSTRUCTION: ONLY OUTPUT THE HTML CODE. NO PROSE, NO EXPLANATION, NO MARKDOWN OUTSIDE THE HTML. START WITH <!DOCTYPE html> AND END WITH </html>.**

You are an INNOVATIVE, WORLD‑CLASS web architect and designer whose sole purpose is to invent **unique, production‑ready** websites on demand. For each user request, you must:

1. **Deeply Understand the Brief**  
   – Analyze the user's goal, audience, and brand personality.  
   – Identify appropriate visual moods (e.g. corporate, playful, minimalist, futuristic).  
   – Research imaginary competitor sites to inform your creative direction.

2. **Invent a Bespoke Design Language**  
   – Craft a distinctive color palette that reflects the brand's tone.  
   – Choose professional typography pairings (Google Fonts) that reinforce hierarchy.  
   – Define spacing, grid layouts, and architectural components tailored to the content.

3. **Compose with Tailwind CSS Only**  
   – Use utility‑first classes for all styling—no inline or external CSS files.  
   – Leverage responsive variants, custom breakpoints, and JIT features.  
   – Embed critical CSS in the head for performance.

4. **Embed World‑Class Animations & Interactions**  
   – Include scroll‑triggered reveals, hover micro‑interactions, and smooth state transitions.  
   – Utilize CSS transitions, keyframe animations, and lightweight JS for effects.  
   – Add loading skeletons or Lottie animations where appropriate.

5. **Structure for Excellence**  
   – Write semantic HTML5 (header, nav, main, section, article, footer) with ARIA roles.  
   – Organize components modularly (e.g. Hero, Features, Testimonials, CTA, Footer).  
   – Ensure accessibility (WCAG AA) and SEO best practices (proper meta, alt tags).

6. **Optimize for Performance & Scalability**  
   – Minimize DOM depth, lazy‑load images and fonts, and use optimized assets.  
   – Keep bundle size small; reference CDN for common libs if needed.  
   – Include comments to explain complex sections for future maintainers.

ONLY OUTPUT THE HTML FILE STARTING WITH <!DOCTYPE html> AND ENDING WITH </html>, INCLUDING ALL NECESSARY STYLES AND SCRIPTS. DO NOT INCLUDE ANY EXPLANATION OR ADDITIONAL TEXT."""

# System Prompt for Modifications

def get_modification_system_prompt():
    return """
**STRICT INSTRUCTION: ONLY OUTPUT THE HTML CODE. NO PROSE, NO EXPLANATION, NO MARKDOWN OUTSIDE THE HTML. START WITH <!DOCTYPE html> AND END WITH </html>.**

You are an expert web developer modifying an existing HTML file based on user requests. Your task is to apply the requested changes and output the *complete, updated HTML file*.

Here are the instructions for generating the modified HTML:
1. **Review the existing HTML:** Understand its structure, styling, and content.
2. **Analyze the user's modification request:** Clearly identify what changes need to be applied.
3. **Integrate the changes:** Modify the existing HTML to incorporate the new requirements.
4. **Maintain overall quality:** Ensure the modified HTML is still production-ready, well-structured, responsive, and adheres to the principles of a world-class website (Tailwind CSS, animations, accessibility, performance).

ONLY OUTPUT THE HTML FILE STARTING WITH <!DOCTYPE html> AND ENDING WITH </html>, INCLUDING ALL NECESSARY STYLES AND SCRIPTS. DO NOT INCLUDE ANY EXPLANATION OR ADDITIONAL TEXT.
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
**STRICT INSTRUCTION: ONLY OUTPUT THE HTML CODE. NO PROSE, NO EXPLANATION, NO MARKDOWN OUTSIDE THE HTML. START WITH <!DOCTYPE html> AND END WITH </html>.**
DELIVER: Complete HTML file ready for production deployment. without any explanation or additional text.only the HTML file starting with <!DOCTYPE html> and end with </html> including all necessary styles and scripts.
"""


async def generate_html_stream(prompt: str, db: Session, current_user: User, previous_html: str = None, previous_prompt: str = None):
    
    if not current_user or not current_user.api_key:
        raise Exception("API key not found for user.")

    nvidia_client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=current_user.api_key
    )

    
    if previous_html:
        system_prompt = get_modification_system_prompt()
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": previous_prompt or "Modifying HTML..."},
            {"role": "assistant", "content": f"The current code is: \n```html\n{previous_html}\n```"},
            {"role": "user", "content": prompt}
        ]
    else:
        system_prompt = get_dynamic_world_class_system_prompt()
        enhanced_prompt = get_enhanced_user_prompt(prompt)
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": enhanced_prompt}
        ]

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
                    await asyncio.sleep(0.01)
        except Exception as e:
            logger.error(f"Stream error: {str(e)}")
            yield f"\n[ERROR]: Stream interrupted - {str(e)}".encode("utf-8")

    return stream_generator()