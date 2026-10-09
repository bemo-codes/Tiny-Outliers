import datetime
from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.schemas import (
    ApiSuccessEnvelope,
    UserLoginRequest,
    UserRegisterRequest,
    TokenResponse,
    UserResponse
)
from app.core.security import (
    create_access_token,
    verify_password,
    get_password_hash,
    get_current_user,
    CurrentUser
)

router = APIRouter()

# In-memory/Demo fast store for verification in environments without live postgresql
DEMO_USERS_STORE = {
    "patient@careroute.org": {
        "id": "usr-pat-01",
        "email": "patient@careroute.org",
        "full_name": "Demo Citizen",
        "role": "patient",
        "hospital_id": None,
        "password": "password123",
        "created_at": datetime.datetime.now(datetime.timezone.utc)
    },
    "staff.stjude@careroute.org": {
        "id": "usr-stf-01",
        "email": "staff.stjude@careroute.org",
        "full_name": "Dr. Sarah Chen, ED Director",
        "role": "hospital_staff",
        "hospital_id": "hosp-001",
        "password": "password123",
        "created_at": datetime.datetime.now(datetime.timezone.utc)
    },
    "paramedic.alpha@careroute.org": {
        "id": "usr-amb-01",
        "email": "paramedic.alpha@careroute.org",
        "full_name": "Officer David Miller, EMT-P",
        "role": "ambulance",
        "hospital_id": "hosp-001",
        "password": "password123",
        "created_at": datetime.datetime.now(datetime.timezone.utc)
    },
    "admin@careroute.org": {
        "id": "usr-adm-01",
        "email": "admin@careroute.org",
        "full_name": "System Regional Administrator",
        "role": "admin",
        "hospital_id": None,
        "password": "password123",
        "created_at": datetime.datetime.now(datetime.timezone.utc)
    }
}

@router.post("/login", response_model=ApiSuccessEnvelope[TokenResponse])
async def login(credentials: UserLoginRequest):
    user_record = DEMO_USERS_STORE.get(credentials.email.lower())
    if not user_record or user_record["password"] != credentials.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify your email and password."
        )
    
    token = create_access_token(
        subject=user_record["id"],
        role=user_record["role"],
        hospital_id=user_record["hospital_id"]
    )
    user_resp = UserResponse(
        id=user_record["id"],
        email=user_record["email"],
        full_name=user_record["full_name"],
        role=user_record["role"],
        hospital_id=user_record["hospital_id"],
        created_at=user_record["created_at"]
    )
    return ApiSuccessEnvelope(
        data=TokenResponse(access_token=token, token_type="bearer", user=user_resp),
        message="Authentication successful"
    )

@router.post("/register", response_model=ApiSuccessEnvelope[TokenResponse])
async def register(payload: UserRegisterRequest):
    email = payload.email.lower()
    if email in DEMO_USERS_STORE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists"
        )
    
    new_user = {
        "id": f"usr-{int(datetime.datetime.now().timestamp())}",
        "email": email,
        "full_name": payload.full_name,
        "role": payload.role,
        "hospital_id": payload.hospital_id,
        "password": payload.password,
        "created_at": datetime.datetime.now(datetime.timezone.utc)
    }
    DEMO_USERS_STORE[email] = new_user
    
    token = create_access_token(
        subject=new_user["id"],
        role=new_user["role"],
        hospital_id=new_user["hospital_id"]
    )
    user_resp = UserResponse(
        id=new_user["id"],
        email=new_user["email"],
        full_name=new_user["full_name"],
        role=new_user["role"],
        hospital_id=new_user["hospital_id"],
        created_at=new_user["created_at"]
    )
    return ApiSuccessEnvelope(
        data=TokenResponse(access_token=token, token_type="bearer", user=user_resp),
        message="Account registered successfully"
    )

@router.get("/me", response_model=ApiSuccessEnvelope[UserResponse])
async def get_me(current_user: CurrentUser = Depends(get_current_user)):
    user_record = None
    for u in DEMO_USERS_STORE.values():
        if u["id"] == current_user.id:
            user_record = u
            break
            
    if not user_record:
        user_record = {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role,
            "hospital_id": current_user.hospital_id,
            "created_at": datetime.datetime.now(datetime.timezone.utc)
        }
        
    user_resp = UserResponse(
        id=user_record["id"],
        email=user_record["email"],
        full_name=user_record["full_name"],
        role=user_record["role"],
        hospital_id=user_record["hospital_id"],
        created_at=user_record["created_at"]
    )
    return ApiSuccessEnvelope(data=user_resp, message="Current user profile retrieved")
