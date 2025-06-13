from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


# Use settings.DATABASE_URL from environment variables
engine = create_engine("postgresql://postgres:ragul%402004@localhost:5432/webagent")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
