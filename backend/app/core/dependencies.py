from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import decode_token
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    exc = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials",
                        headers={"WWW-Authenticate": "Bearer"})
    payload = decode_token(token)
    if not payload:
        raise exc
    uid = payload.get("sub")
    if not uid:
        raise exc
    user = db.query(User).filter(User.id == int(uid)).first()
    if not user:
        raise exc
    return user
