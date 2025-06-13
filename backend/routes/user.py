from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session  
import uuid
from datetime import timedelta
from backend.db.session import get_db
from backend.db.models import User
from backend.core.security import (
    get_password_hash, 
    get_current_user, 
    get_hashed_api_key,
    verify_password, 
    create_access_token, 
    create_refresh_token, 
    decode_token,
    ACCESS_TOKEN_EXPIRE_MINUTES, 
    REFRESH_TOKEN_EXPIRE_DAYS
)
from backend.schemas.user import UserCreate, UserResponse, Token, UserUpdateApiKey
from backend.schemas.token import RefreshTokenRequest

router = APIRouter(prefix="/api/users", tags=["users"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.name == user_in.name).first():
        raise HTTPException(status_code=400, detail="Username already registered")

    new_user = User(
        id=uuid.uuid4(),
        name=user_in.name,
        password_hash=get_password_hash(user_in.password),
        api_key=user_in.api_key,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/update-api-key", response_model=UserResponse)
async def update_user_api_key(
    update_data: UserUpdateApiKey,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify current password
    if not verify_password(update_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect current password"
        )
    
    # Update the API key
    current_user.api_key = update_data.new_api_key
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):  
    user = db.query(User).filter(User.name == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    return {
        "access_token": create_access_token(data={"sub": str(user.id)}, expires_delta=access_token_expires),
        "refresh_token": create_refresh_token(data={"sub": str(user.id)}, expires_delta=refresh_token_expires),
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=Token)
def refresh_token(
    token_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    
    payload = decode_token(token_data.refresh_token)
    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    return {
        "access_token": create_access_token(data={"sub": str(user.id)}, expires_delta=access_token_expires),
        "refresh_token": create_refresh_token(data={"sub": str(user.id)}, expires_delta=refresh_token_expires),
        "token_type": "bearer"
    }

@router.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user
