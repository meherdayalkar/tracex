"""
Database Configuration (SQLite with SQLAlchemy, migration-ready for PostgreSQL)
Project [TraceX] (SIH26034) - Department of Consumer Affairs (DoCA)
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

raw_db_url = os.environ.get("DATABASE_URL", "").strip()

if raw_db_url:
    # Render and Heroku provide postgres:// URLs, but SQLAlchemy 2.0 requires postgresql://
    if raw_db_url.startswith("postgres://"):
        raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)
    
    DATABASE_URL = raw_db_url
    IS_POSTGRES = True
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=10,
        max_overflow=20
    )
else:
    DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tracex.db")
    DATABASE_URL = f"sqlite:///{DB_PATH}"
    IS_POSTGRES = False
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_db_type() -> str:
    return "PostgreSQL" if IS_POSTGRES else "SQLite"
