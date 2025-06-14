from pydantic import BaseModel, field_validator
from uuid import UUID

class UserCreate(BaseModel):
    name: str
    password: str
    api_key: str

class UserResponse(BaseModel):
    id: UUID # Allow UUID type
    name: str

    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, value):
        if isinstance(value, UUID):
            return str(value)
        return value

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class UserUpdateApiKey(BaseModel):
    new_api_key: str
    current_password: str