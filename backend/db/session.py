from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from sqlalchemy.exc import OperationalError
import time
from contextlib import contextmanager



from backend.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@contextmanager
def get_db_with_retry(max_retries=3, retry_delay=1):
    """Get database session with retry logic"""
    retries = 0
    while retries < max_retries:
        try:
            db = SessionLocal()
            try:
                yield db
                db.commit()
            except Exception as e:
                db.rollback()
                raise e
            finally:
                db.close()
            break
        except OperationalError as e:
            retries += 1
            if retries == max_retries:
                raise e
            time.sleep(retry_delay)
            continue

def get_db():
    """FastAPI dependency for database sessions"""
    with get_db_with_retry() as db:
        yield db