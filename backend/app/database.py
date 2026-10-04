# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker, declarative_base


# DATABASE_URL = (
#     "postgresql+psycopg://postgres:Chinni%4028@localhost:5432/"
#     "ai_career_assistant"
# )


# engine = create_engine(
#     DATABASE_URL
# )


# SessionLocal = sessionmaker(
#     autocommit=False,
#     autoflush=False,
#     bind=engine,
# )


# Base = declarative_base()


# def get_db():
#     db = SessionLocal()

#     try:
#         yield db
#     finally:
#         db.close()




import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(
    DATABASE_URL
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()