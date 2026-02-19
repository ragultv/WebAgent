# main.py

import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.generate import router as generate_router
from backend.routes.image_to_website import router as image_to_website_router
from backend.routes.user import router as user_router
from backend.routes.project import router as project_router
from backend.db.base import Base
from backend.db.session import engine
from backend.services.project_manager import ensure_template

logger = logging.getLogger(__name__)

# Create DB tables
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-warm the React template on startup (background task)
    async def warmup():
        try:
            result = await ensure_template()
            if result.get("cached"):
                logger.info("React template: already cached ✓")
            else:
                logger.info("React template: npm install completed ✓")
        except Exception as e:
            logger.warning(f"React template warmup failed: {e}")

    asyncio.create_task(warmup())
    yield


app = FastAPI(
    title="WebAgent AI World-Class Website Builder",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(generate_router)
app.include_router(image_to_website_router)
app.include_router(user_router)
app.include_router(project_router)

