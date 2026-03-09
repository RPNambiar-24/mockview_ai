from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.db.session import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter()

class RegisterIn(BaseModel):
    email: EmailStr
    full_name: str
    password: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    class Config:
        from_attributes = True

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

@router.post("/register", response_model=TokenOut, status_code=201)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(400, "Email already registered")
    user = User(email=body.email, full_name=body.full_name, hashed_password=hash_password(body.password))
    db.add(user); db.commit(); db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "user": user}

@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "user": user}

@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user

@router.put("/me", response_model=UserOut)
def update_me(body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if "full_name" in body: user.full_name = body["full_name"]
    if "email"     in body: user.email     = body["email"]
    db.commit(); db.refresh(user)
    return user
