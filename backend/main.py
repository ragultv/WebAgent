# main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.generate import router as generate_router
from backend.routes.image_to_website import router as image_to_website_router
from backend.routes.user import router as user_router
from backend.db.base import Base  # Import Base
from backend.db.session import engine # Import engine

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="WebAgent AI World-Class Website Builder", version="1.0.0")

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
