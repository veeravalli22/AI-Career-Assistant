import json
import os
from datetime import datetime

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from google import genai

from app.database import get_db
from app.models import (
    User,
    Resume,
    JobDescription,
    CareerProfile,
    ModuleProgress,
)
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/api/v1/interview",
    tags=["Interview Preparation"],
)


# ---------------------------------------------------------
# Gemini configuration
# ---------------------------------------------------------

load_dotenv(override=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not configured")

gemini_client = genai.Client(api_key=GEMINI_API_KEY)

GEMINI_MODEL = "gemini-3.5-flash-lite"


# ---------------------------------------------------------
# Helper: clean Gemini JSON response
# ---------------------------------------------------------

def clean_json_response(text: str):
    text = text.strip()

    if text.startswith("```json"):
        text = text[7:]

    elif text.startswith("```"):
        text = text[3:]

    if text.endswith("```"):
        text = text[:-3]

    return json.loads(text.strip())


# ---------------------------------------------------------
# GET Interview Preparation
# ---------------------------------------------------------

@router.get("/preparation")
def generate_interview_preparation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # -----------------------------------------------------
    # Get latest resume
    # -----------------------------------------------------

    resume = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Please upload your resume first.",
        )

    # -----------------------------------------------------
    # Get career profile
    # -----------------------------------------------------

    career_profile = (
        db.query(CareerProfile)
        .filter(CareerProfile.user_id == current_user.id)
        .first()
    )

    if not career_profile:
        raise HTTPException(
            status_code=404,
            detail="Please complete your career profile first.",
        )

    # -----------------------------------------------------
    # Get latest Job Description if available
    # -----------------------------------------------------

    job_description = (
        db.query(JobDescription)
        .filter(JobDescription.user_id == current_user.id)
        .order_by(JobDescription.created_at.desc())
        .first()
    )

    # -----------------------------------------------------
    # Parse saved AI analysis
    # -----------------------------------------------------

    resume_analysis = {}

    try:
        if resume.ai_analysis:
            resume_analysis = json.loads(resume.ai_analysis)
    except Exception:
        resume_analysis = {
            "raw_analysis": resume.ai_analysis or ""
        }

    jd_analysis = {}

    if job_description:
        try:
            if job_description.ai_analysis:
                jd_analysis = json.loads(job_description.ai_analysis)
        except Exception:
            jd_analysis = {
                "raw_analysis": job_description.ai_analysis or ""
            }

    # -----------------------------------------------------
    # Career information
    # -----------------------------------------------------

    career_goal = career_profile.career_goal or ""
    target_role = career_profile.target_role or ""
    experience_level = career_profile.experience_level or ""
    preferred_domain = career_profile.preferred_domain or ""
    preferred_work_type = career_profile.preferred_work_type or ""
    additional_goal = career_profile.additional_goal or ""

    jd_text = ""

    if job_description:
        jd_text = job_description.job_description or ""

    # -----------------------------------------------------
    # Gemini prompt
    # -----------------------------------------------------

    prompt = f"""
You are an AI Career & Placement Interview Preparation Assistant.

Create a personalized interview preparation plan for a student.

IMPORTANT RULES:

1. Use the student's actual resume information.
2. Use the saved career profile.
3. Use the job description if available.
4. Do NOT invent skills, projects, internships, certifications,
   experience, achievements, or technologies that are not present.
5. The student is a fresher unless the profile says otherwise.
6. Keep questions realistic for entry-level placement interviews.
7. Give simple and practical preparation guidance.
8. Prioritize the target role.
9. Include technical, coding, HR, behavioral, project,
   communication, and role-specific questions.
10. If a skill is missing from the resume but important for the role,
    put it under "topics_to_learn", not under existing skills.
11. Avoid repeating the same question in different sections.
12. Questions should help the student prepare for actual interviews.
13. Provide simple preparation tips for each section.
14. Do not claim that the student already knows something unless
    the resume/profile supports it.

STUDENT CAREER PROFILE:

Career Goal:
{career_goal}

Target Role:
{target_role}

Experience Level:
{experience_level}

Preferred Domain:
{preferred_domain}

Preferred Work Type:
{preferred_work_type}

Additional Goal:
{additional_goal}


RESUME TEXT:

{resume.extracted_text}


RESUME AI ANALYSIS:

{json.dumps(resume_analysis, indent=2)}


JOB DESCRIPTION:

{jd_text if jd_text else "No job description has been added yet."}


JOB DESCRIPTION AI ANALYSIS:

{json.dumps(jd_analysis, indent=2)}


Return ONLY valid JSON.

Use exactly this structure:

{{
  "preparation_title": "",
  "target_role": "",
  "overall_strategy": "",
  "technical_preparation": {{
    "topics_to_prepare": [],
    "important_concepts": [],
    "sample_questions": []
  }},
  "coding_preparation": {{
    "topics": [],
    "practice_questions": [],
    "difficulty": ""
  }},
  "sql_preparation": {{
    "topics": [],
    "sample_questions": []
  }},
  "project_preparation": {{
    "projects_to_prepare": [],
    "questions": [],
    "explanation_structure": []
  }},
  "role_specific_preparation": {{
    "topics": [],
    "questions": []
  }},
  "hr_preparation": {{
    "questions": [],
    "preparation_tips": []
  }},
  "behavioral_preparation": {{
    "questions": [],
    "preparation_tips": []
  }},
  "communication_preparation": {{
    "focus_areas": [],
    "practice_tasks": []
  }},
  "topics_to_learn": [],
  "mock_interview_plan": [
    {{
      "round": "",
      "focus": "",
      "question_count": 0
    }}
  ],
  "seven_day_preparation_plan": [
    {{
      "day": "",
      "focus": "",
      "tasks": []
    }}
  ],
  "final_advice": []
}}

Make the preparation realistic for a fresher targeting the specified
role and a placement timeline of approximately two months.
"""

    # -----------------------------------------------------
    # Call Gemini
    # -----------------------------------------------------

    try:
        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        )

        response_text = response.text or ""

        preparation = clean_json_response(response_text)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate interview preparation: {str(e)}",
        )

    # -----------------------------------------------------
    # Mark Interview Preparation as Completed
    # -----------------------------------------------------

    progress = (
        db.query(ModuleProgress)
        .filter(
            ModuleProgress.user_id == current_user.id,
            ModuleProgress.module_name == "interview_preparation",
        )
        .first()
    )

    if not progress:
        progress = ModuleProgress(
            user_id=current_user.id,
            module_name="interview_preparation",
            completed=True,
            completed_at=datetime.utcnow(),
        )

        db.add(progress)

    else:
        progress.completed = True
        progress.completed_at = datetime.utcnow()

    db.commit()

    # -----------------------------------------------------
    # Return response
    # -----------------------------------------------------

    return {
        "success": True,
        "message": "Interview preparation generated successfully.",
        "interview_preparation": preparation,
    }