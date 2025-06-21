from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status,Body
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from PIL import Image
import io
import logging
import tempfile
import os
from backend.schemas.token import DescriptionRequest
from backend.db.session import get_db
from backend.core.security import get_current_user
from backend.db.models import User

router = APIRouter(tags=["image-to-website"])
logger = logging.getLogger(__name__)

# Allowed image file types
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

@router.post("/api/analyze-image")
async def analyze_uploaded_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze an uploaded image and return a description without generating code.
    This is the first step - upload image and get analysis.
    """
    try:
        # Validate file type
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_IMAGE_TYPES)}"
            )
        
        # Read and validate file size
        file_content = await file.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        # Convert to PIL Image and validate
        try:
            image = Image.open(io.BytesIO(file_content))
            if image.mode != 'RGB':
                image = image.convert('RGB')
        except Exception as e:
            logger.error(f"Error processing image: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image file or unsupported format"
            )
        
        # Save image temporarily to get file path for analysis
        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
            image.save(temp_file.name, format='PNG')
            temp_path = temp_file.name
        
        try:
            
            from backend.services.image_to_website import analyze_image
            
            # Analyze the image using the existing function
            description = analyze_image(temp_path)
            
            # Clean up temporary file
            os.unlink(temp_path)
            
            if description.startswith("Error"):
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=description
                )
            
            return {
                "success": True,
                "description": description,
                "filename": file.filename,
                "file_size": len(file_content),
                "image_dimensions": f"{image.width}x{image.height}",
                "message": "Image analyzed successfully. Use this description to generate website code."
            }
            
        except Exception as e:
            # Clean up temporary file in case of error
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            raise e
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in image analysis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during image analysis"
        )

@router.post("/api/generate-website")
async def generate_website_from_description(
    request: DescriptionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate website code from a description.
    This is the second step - takes the description from analyze-image and generates HTML.
    """
    description = request.description
    
    try:
        if not description or description.strip() == "":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Description is required"
            )
        
        # Import the generate_html_code function from the service
        from backend.services.image_to_website import generate_html_code
        
        # Generate HTML code using the existing function
        html_stream = generate_html_code(description, current_user)
        
        return StreamingResponse(
            html_stream,
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "X-Accel-Buffering": "no",  # Disable nginx buffering
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in website generation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during website generation"
        )
