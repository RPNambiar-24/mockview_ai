from sqlalchemy import create_engine
from app.core.config import settings

kwargs = {}
if settings.DATABASE_URL.startswith("sqlite"):
    kwargs["connect_args"] = {"check_same_thread": False}
else:
    kwargs["pool_size"] = 10
    kwargs["max_overflow"] = 20

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, **kwargs)
