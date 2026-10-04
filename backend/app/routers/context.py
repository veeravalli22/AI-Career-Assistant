from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json

from app.database import get_db
from app.models import User, Resume, JobDescription, CareerProfile
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/api/v1/career",
    tags=["Career Context"],
)


def parse_analysis(value):
    if not value:
        return None

    try:
        return json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return value


@router.get("/context")
def get_career_context(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Get latest resume
    resume = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.id.desc())
        .first()
    )

    # Get latest job description if available
    job_description = (
        db.query(JobDescription)
        .filter(JobDescription.user_id == current_user.id)
        .order_by(JobDescription.id.desc())
        .first()
    )

    # Get saved career profile
    career_profile = (
        db.query(CareerProfile)
        .filter(CareerProfile.user_id == current_user.id)
        .first()
    )

    # Resume is required for personalized roadmap
    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Please upload and analyze your resume first.",
        )

    return {
        "resume": {
            "id": resume.id,
            "filename": resume.filename,
            "extracted_text": resume.extracted_text,
            "analysis": parse_analysis(resume.ai_analysis),
        },

        "career_profile": (
            {
                "id": career_profile.id,
                "career_goal": career_profile.career_goal,
                "target_role": career_profile.target_role,
                "experience_level": career_profile.experience_level,
                "preferred_domain": career_profile.preferred_domain,
                "preferred_work_type": career_profile.preferred_work_type,
                "additional_goal": career_profile.additional_goal,
            }
            if career_profile
            else None
        ),

        "job_description": (
            {
                "id": job_description.id,
                "job_description": job_description.job_description,
                "analysis": parse_analysis(job_description.ai_analysis),
            }
            if job_description
            else None
        ),
    }