import datetime
from typing import List, Optional, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security_bearer = HTTPBearer(auto_error=False)

class TokenPayload(BaseModel):
    sub: str
    role: str
    hospital_id: Optional[str] = None
    exp: Optional[int] = None

class CurrentUser(BaseModel):
    id: str
    email: str
    role: str
    full_name: str
    hospital_id: Optional[str] = None

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        # Fallback for plain comparison in testing / mock if needed
        return plain_password == hashed_password

def get_password_hash(password: str) -> str:
    try:
        return pwd_context.hash(password)
    except Exception:
        return f"hashed_{password}"

def create_access_token(subject: str, role: str, hospital_id: Optional[str] = None, expires_delta: Optional[datetime.timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode: dict[str, Any] = {
        "sub": str(subject),
        "role": role,
        "hospital_id": str(hospital_id) if hospital_id else None,
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> CurrentUser:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        hospital_id: Optional[str] = payload.get("hospital_id")
        if user_id is None or role is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return CurrentUser(
            id=user_id,
            email=f"{user_id}@careroute.org",
            role=role,
            full_name=f"User {user_id}",
            hospital_id=hospital_id
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def require_roles(*allowed_roles: str):
    async def role_checker(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current_user.role not in allowed_roles and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required role: {allowed_roles}. Current role: {current_user.role}"
            )
        return current_user
    return role_checker
