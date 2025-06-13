from sqlalchemy.orm import Session
from sqlalchemy.future import select
from backend.db.models import User
from backend.schemas.user import UserCreate
import uuid




def get_user(db: Session, user_id: str):
    result =  db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


def create_user(db: Session, user: UserCreate):
    db_user = User(
        id=uuid.uuid4(),
        name=user.name,
        password_hash=user.password,
        api_key=user.api_key,    
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
