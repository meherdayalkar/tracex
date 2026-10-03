"""
Database Configuration (SQLite with SQLAlchemy, migration-ready for PostgreSQL)
Project [TraceX] - Department of Consumer Affairs (DoCA)
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Detect available PostgreSQL drivers
try:
    import psycopg
    has_psycopg3 = True
except ImportError:
    has_psycopg3 = False

try:
    import psycopg2
    has_psycopg2 = True
except ImportError:
    has_psycopg2 = False

raw_db_url = os.environ.get("DATABASE_URL", "").strip()

if raw_db_url:
    # Render and Heroku provide postgres:// URLs, but SQLAlchemy 2.0 requires postgresql://
    if raw_db_url.startswith("postgres://"):
        raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)

    # Route to available driver
    if "postgresql+psycopg://" in raw_db_url and not has_psycopg3 and has_psycopg2:
        raw_db_url = raw_db_url.replace("postgresql+psycopg://", "postgresql+psycopg2://", 1)
    elif "postgresql+psycopg2://" in raw_db_url and not has_psycopg2 and has_psycopg3:
        raw_db_url = raw_db_url.replace("postgresql+psycopg2://", "postgresql+psycopg://", 1)
    elif raw_db_url.startswith("postgresql://"):
        if has_psycopg3:
            raw_db_url = raw_db_url.replace("postgresql://", "postgresql+psycopg://", 1)
        elif has_psycopg2:
            raw_db_url = raw_db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

    DATABASE_URL = raw_db_url
    IS_POSTGRES = True
    try:
        engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=300,
            pool_size=10,
            max_overflow=20
        )
    except Exception as e:
        print(f"[WARN] Error initializing PostgreSQL engine ({e}). Falling back to SQLite.")
        DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tracex.db")
        DATABASE_URL = f"sqlite:///{DB_PATH}"
        IS_POSTGRES = False
        engine = create_engine(
            DATABASE_URL,
            connect_args={"check_same_thread": False}
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
