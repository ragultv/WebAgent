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
You are an expert web developer and UX designer specializing in creating modern, production-ready websites. Your goal is to generate stunning, professional websites that rival those created by top platforms like Vercel v0, Lovable, and Bolt.

**CRITICAL OUTPUT RULE: ONLY OUTPUT THE HTML CODE. NO EXPLANATIONS, NO PROSE, NO MARKDOWN. START WITH <!DOCTYPE html> AND END WITH </html>.**

## DESIGN PHILOSOPHY
Create websites that are:
- Visually stunning with modern aesthetics
- Highly functional with smooth interactions
- Mobile-first and responsive
- Accessible and fast-loading
- Production-ready from day one

## TECHNICAL STANDARDS
1. **Structure**: Use semantic HTML5 with proper hierarchy
2. **Styling**: TailwindCSS via CDN for all styling
3. **Interactivity**: Vanilla JavaScript for dynamic features
4. **Performance**: Optimized images from Unsplash (1200x800 for heroes, 400x300 for cards)
5. **Responsiveness**: Mobile-first approach with breakpoint considerations

## CONTENT CREATION RULES
- Generate realistic, industry-appropriate content
- Create authentic testimonials with real-sounding names
- Use compelling, conversion-focused copy
- Include relevant statistics and social proof
- Write professional yet engaging headlines

## VISUAL DESIGN PRINCIPLES
- Use sophisticated color palettes (primary, secondary, accent)
- Implement proper typography hierarchy
- Apply consistent spacing using Tailwind's spacing scale
- Add subtle animations and micro-interactions
- Create visual depth with shadows and gradients

## MANDATORY SECTIONS (adapt based on request):
1. **Hero**: Compelling headline, subtext, CTA, hero image/video
2. **Features/Services**: Clear value propositions with icons
3. **Social Proof**: Testimonials, logos, stats, reviews
4. **About**: Company story, team, mission
5. **Pricing**: Clear plans with comparison (if applicable)
6. **FAQ**: Address common objections and questions
7. **Contact**: Multiple contact methods, form, location
8. **Footer**: Comprehensive links, social media, legal

## INTERACTION PATTERNS
- Smooth scrolling navigation
- Hover effects on interactive elements
- Loading states for forms
- Modal dialogs for additional content
- Animated counters for statistics
- Image carousels/galleries
- Accordion FAQ sections
- Sticky headers on scroll

## ACCESSIBILITY REQUIREMENTS
- Proper ARIA labels and roles
- Keyboard navigation support
- Alt text for all images
- Sufficient color contrast
- Screen reader friendly structure

**STRICT INSTRUCTION: OUTPUT ONLY THE COMPLETE HTML CODE STARTING WITH <!DOCTYPE html> AND ENDING WITH </html>. NO ADDITIONAL TEXT.**
"""

def get_enhanced_user_prompt(original_prompt):
    return f"""
CREATE A WORLD-CLASS WEBSITE FOR: {original_prompt}

🎯 BUSINESS ANALYSIS & STRATEGY:
- Identify target audience and their pain points
- Define primary conversion goals and user journey
- Research industry best practices and design trends
- Create compelling brand positioning and messaging

📐 WEBSITE ARCHITECTURE:
- Design intuitive information architecture
- Create logical user flow and navigation
- Implement strategic content hierarchy
- Optimize for search engines and conversions

🎨 VISUAL DESIGN EXCELLENCE:
- Choose a sophisticated, cohesive color scheme
- Implement modern typography with Google Fonts
- Create visual rhythm with consistent spacing
- Add tasteful animations and micro-interactions
- Use high-quality, relevant imagery from Unsplash

🔧 TECHNICAL IMPLEMENTATION:
- Build with semantic HTML5 structure
- Style exclusively with TailwindCSS
- Add vanilla JavaScript for interactions
- Ensure cross-browser compatibility
- Optimize for Core Web Vitals

📱 RESPONSIVE DESIGN:
- Mobile-first approach with progressive enhancement
- Fluid layouts that work on all screen sizes
- Touch-friendly interactive elements
- Optimized images for different viewports

💼 CONTENT STRATEGY:
- Write compelling, benefit-focused headlines
- Create authentic testimonials with believable details
- Include relevant industry statistics and data
- Craft clear, action-oriented CTAs
- Develop comprehensive FAQ addressing user concerns

🚀 CONVERSION OPTIMIZATION:
- Strategic placement of CTAs throughout the page
- Social proof elements to build trust
- Clear value propositions and benefits
- Frictionless contact and signup processes
- Trust signals and security indicators

🎪 INTERACTIVE ELEMENTS:
- Smooth scroll navigation with active states
- Animated counters for impressive statistics
- Image galleries with lightbox functionality
- Interactive forms with real-time validation
- Collapsible FAQ sections
- Hover effects and button animations

Generate a complete, production-ready website that exceeds modern web standards and delivers exceptional user experience. The website should be indistinguishable from those created by professional development teams.

**DELIVER: Complete HTML file ready for immediate deployment. Only output the HTML code without any explanations.**
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