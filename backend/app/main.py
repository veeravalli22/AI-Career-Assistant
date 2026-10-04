from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.models import User, Resume, JobDescription

from app.routers.auth import router as auth_router
from app.routers.resume import router as resume_router
from app.routers.jd import router as jd_router
from app.routers.context import router as context_router
from app.routers.career import router as career_router
from app.routers.interview import router as interview_router
from app.routers.mock_interview import router as mock_interview_router
from app.routers.career_chat import router as career_chat_router
from app.routers.career_chat_history import router as career_chat_history_router
from app.routers.progress import router as progress_router

# Create all database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="AI Career & Placement Assistant API",
    version="1.0.0",
)


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# API routers
app.include_router(auth_router)
app.include_router(resume_router)
app.include_router(jd_router)
app.include_router(context_router)
app.include_router(career_router)
app.include_router(interview_router)
app.include_router(mock_interview_router)
app.include_router(career_chat_router)
app.include_router(career_chat_history_router)
app.include_router(progress_router)

# Health check
@app.get("/api/v1/health")
def health_check():
    return {
        "status": "ok",
        "service": "AI Career & Placement Assistant API",
    }


