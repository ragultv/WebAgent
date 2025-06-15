from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from sqlalchemy.exc import OperationalError
import time
from contextlib import contextmanager



engine = create_engine("postgresql://postgres:ragul%402004@localhost:5432/webagent",
    poolclass=QueuePool,
    pool_size=5,  # Reduced pool size to be more conservative
    max_overflow=5,  # Reduced overflow to be more conservative
    pool_timeout=60,  # Increased timeout to 60 seconds
    pool_recycle=300,  # Recycle connections every 5 minutes
    pool_pre_ping=True,  # Enable connection health checks
    connect_args={
        "connect_timeout": 10,  # Connection timeout in seconds
        "keepalives": 1,  # Enable keepalive
        "keepalives_idle": 30,  # Idle time before sending keepalive
        "keepalives_interval": 10,  # Time between keepalives
        "keepalives_count": 5  # Number of keepalives before giving up
    }
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