from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
from backend.db.base import Base
import uuid
from sqlalchemy.dialects.postgresql import UUID


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False, unique=True)
    password_hash = Column(String(100), nullable=False)
    api_key = Column(String(100), nullable=False)

