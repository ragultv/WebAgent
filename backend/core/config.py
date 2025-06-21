import os
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)
else:
    print(f"Warning: .env file not found at {env_path}")

class Settings:
    PROJECT_NAME: str = "Web Agent"
    ENV: str = os.getenv("ENV", "development")
    NVIDIA_API_KEY: str = os.getenv("NVIDIA_API_KEY")
    API_KEY:str= os.getenv("api_key")  # Added default value
    DEBUG: bool = ENV == "development"
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "supersecretkey")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "anotherdefaultsecretkey")  # Added default value
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    JWT_ALGORITHM: str = "HS256"

    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")


settings = Settings()

# Optional debug log
#print(f"DEBUG >> DATABASE_URL: {settings.DATABASE_URL}")
#print(f"DEBUG >> SECRET_KEY: {settings.SECRET_KEY}")
