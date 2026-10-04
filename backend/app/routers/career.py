# from typing import Optional
# import os
# import json
# from datetime import datetime

# from fastapi import APIRouter, Depends, HTTPException
# from pydantic import BaseModel, Field
# from sqlalchemy.orm import Session
# from dotenv import load_dotenv
# from google import genai

# from app.database import get_db
# from app.models import (
#     CareerProfile,
#     User,
#     Resume,
#     JobDescription,
#     ModuleProgress,
#     ProgressCycle,
# )
# from app.routers.auth import get_current_user


# # --------------------------------
# # Gemini Configuration
# # --------------------------------

# load_dotenv(override=True)

# GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# if not GEMINI_API_KEY:
#     raise RuntimeError("GEMINI_API_KEY is not configured")

# gemini_client = genai.Client(api_key=GEMINI_API_KEY)

# GEMINI_MODEL = "gemini-3.5-flash-lite"


# # --------------------------------
# # Router
# # --------------------------------

# router = APIRouter(
#     prefix="/api/v1/career",
#     tags=["Career"],
# )


# # --------------------------------
# # Career Profile Request Model
# # --------------------------------

# class CareerProfileRequest(BaseModel):
#     career_goal: str = Field(
#         ...,
#         min_length=2,
#         max_length=255,
#     )

#     target_role: Optional[str] = Field(
#         default=None,
#         max_length=255,
#     )

#     experience_level: Optional[str] = Field(
#         default=None,
#         max_length=100,
#     )

#     preferred_domain: Optional[str] = Field(
#         default=None,
#         max_length=255,
#     )

#     preferred_work_type: Optional[str] = Field(
#         default=None,
#         max_length=100,
#     )

#     additional_goal: Optional[str] = None


# # --------------------------------
# # JSON Cleaning Helper
# # --------------------------------

# def clean_json_response(text: str):
#     """
#     Converts Gemini response into a Python dictionary.
#     Handles markdown code fences if Gemini returns them.
#     """

#     if not text:
#         raise ValueError("Empty response received from Gemini")

#     cleaned = text.strip()

#     if cleaned.startswith("```json"):
#         cleaned = cleaned[7:]

#     elif cleaned.startswith("```"):
#         cleaned = cleaned[3:]

#     if cleaned.endswith("```"):
#         cleaned = cleaned[:-3]

#     cleaned = cleaned.strip()

#     return json.loads(cleaned)


# # --------------------------------
# # Get Current Progress Cycle
# # --------------------------------

# def get_current_cycle(
#     current_user: User,
#     db: Session,
# ):
#     """
#     Returns the latest ProgressCycle for the current user.

#     A ProgressCycle represents one Resume + Job Description pair.
#     """

#     cycle = (
#         db.query(ProgressCycle)
#         .filter(
#             ProgressCycle.user_id == current_user.id
#         )
#         .order_by(
#             ProgressCycle.id.desc()
#         )
#         .first()
#     )

#     return cycle


# # --------------------------------
# # Save / Update Career Profile
# # --------------------------------

# @router.post("/profile")
# def save_career_profile(
#     profile_data: CareerProfileRequest,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db),
# ):
#     existing_profile = (
#         db.query(CareerProfile)
#         .filter(
#             CareerProfile.user_id == current_user.id
#         )
#         .first()
#     )

#     if existing_profile:

#         existing_profile.career_goal = (
#             profile_data.career_goal
#         )

#         existing_profile.target_role = (
#             profile_data.target_role
#         )

#         existing_profile.experience_level = (
#             profile_data.experience_level
#         )

#         existing_profile.preferred_domain = (
#             profile_data.preferred_domain
#         )

#         existing_profile.preferred_work_type = (
#             profile_data.preferred_work_type
#         )

#         existing_profile.additional_goal = (
#             profile_data.additional_goal
#         )

#         db.commit()
#         db.refresh(existing_profile)

#         profile = existing_profile

#         message = "Career profile updated successfully"

#     else:

#         profile = CareerProfile(
#             user_id=current_user.id,
#             career_goal=profile_data.career_goal,
#             target_role=profile_data.target_role,
#             experience_level=profile_data.experience_level,
#             preferred_domain=profile_data.preferred_domain,
#             preferred_work_type=profile_data.preferred_work_type,
#             additional_goal=profile_data.additional_goal,
#         )

#         db.add(profile)
#         db.commit()
#         db.refresh(profile)

#         message = "Career profile saved successfully"

#     return {
#         "success": True,
#         "message": message,
#         "profile": {
#             "id": profile.id,
#             "career_goal": profile.career_goal,
#             "target_role": profile.target_role,
#             "experience_level": profile.experience_level,
#             "preferred_domain": profile.preferred_domain,
#             "preferred_work_type": profile.preferred_work_type,
#             "additional_goal": profile.additional_goal,
#         },
#     }


# # --------------------------------
# # Get Career Profile
# # --------------------------------

# @router.get("/profile")
# def get_career_profile(
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db),
# ):
#     profile = (
#         db.query(CareerProfile)
#         .filter(
#             CareerProfile.user_id == current_user.id
#         )
#         .first()
#     )

#     if not profile:

#         return {
#             "success": True,
#             "profile": None,
#         }

#     return {
#         "success": True,
#         "profile": {
#             "id": profile.id,
#             "career_goal": profile.career_goal,
#             "target_role": profile.target_role,
#             "experience_level": profile.experience_level,
#             "preferred_domain": profile.preferred_domain,
#             "preferred_work_type": profile.preferred_work_type,
#             "additional_goal": profile.additional_goal,
#         },
#     }


# # --------------------------------
# # AI Career Roadmap
# # --------------------------------

# @router.get("/roadmap")
# def generate_career_roadmap(
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db),
# ):
#     # --------------------------------
#     # Get Current Progress Cycle
#     # --------------------------------

#     current_cycle = get_current_cycle(
#         current_user,
#         db,
#     )

#     if not current_cycle:
#         raise HTTPException(
#             status_code=400,
#             detail=(
#                 "Please upload a resume and analyze a job description "
#                 "before generating the career roadmap."
#             ),
#         )

#     # --------------------------------
#     # Get Resume Belonging to Current Cycle
#     # --------------------------------

#     resume = (
#         db.query(Resume)
#         .filter(
#             Resume.id == current_cycle.resume_id,
#             Resume.user_id == current_user.id,
#         )
#         .first()
#     )

#     if not resume:
#         raise HTTPException(
#             status_code=404,
#             detail="Resume for the current progress cycle was not found.",
#         )

#     # --------------------------------
#     # Get Job Description Belonging to Current Cycle
#     # --------------------------------

#     job_description = (
#         db.query(JobDescription)
#         .filter(
#             JobDescription.id == current_cycle.job_description_id,
#             JobDescription.user_id == current_user.id,
#         )
#         .first()
#     )

#     if not job_description:
#         raise HTTPException(
#             status_code=404,
#             detail=(
#                 "Job description for the current progress cycle "
#                 "was not found."
#             ),
#         )

#     # --------------------------------
#     # Get Career Profile
#     # --------------------------------

#     career_profile = (
#         db.query(CareerProfile)
#         .filter(
#             CareerProfile.user_id == current_user.id
#         )
#         .first()
#     )

#     if not career_profile:
#         raise HTTPException(
#             status_code=404,
#             detail="Please complete your career profile first.",
#         )

#     # --------------------------------
#     # Parse Resume Analysis
#     # --------------------------------

#     resume_analysis = resume.ai_analysis

#     try:
#         resume_analysis = json.loads(
#             resume_analysis
#         )
#     except (TypeError, json.JSONDecodeError):
#         pass

#     # --------------------------------
#     # Parse JD Analysis
#     # --------------------------------

#     jd_analysis = None

#     if job_description:

#         try:
#             jd_analysis = json.loads(
#                 job_description.ai_analysis
#             )

#         except (
#             TypeError,
#             json.JSONDecodeError,
#         ):
#             jd_analysis = job_description.ai_analysis

#     # --------------------------------
#     # Build Personalized AI Prompt
#     # --------------------------------

#     prompt = f"""
# You are an expert AI Career Coach and Placement Mentor.

# Create a PERSONALIZED career roadmap for the student.

# IMPORTANT RULES:

# 1. Use the student's actual resume information.
# 2. Use the saved career profile.
# 3. Use the current job description as additional context.
# 4. Do NOT invent skills, projects, certifications, experience or education.
# 5. Clearly separate existing skills from skills that need to be learned.
# 6. The roadmap must be realistic for a fresher.
# 7. Prioritize skills based on the student's TARGET ROLE.
# 8. If the student has a placement deadline, prioritize placement preparation.
# 9. Do not ask the student to provide information that is already available.
# 10. Give practical weekly actions.
# 11. Include projects that match the target role.
# 12. Include interview preparation.
# 13. Include resume/GitHub/portfolio preparation.
# 14. Include job application preparation.
# 15. Do not recommend learning too many technologies at once.
# 16. Focus on the highest-priority skills first.

# STUDENT CAREER PROFILE:

# Career Goal:
# {career_profile.career_goal}

# Target Role:
# {career_profile.target_role}

# Experience Level:
# {career_profile.experience_level}

# Preferred Domain:
# {career_profile.preferred_domain}

# Preferred Work Type:
# {career_profile.preferred_work_type}

# Additional Goal:
# {career_profile.additional_goal}


# RESUME TEXT:

# {resume.extracted_text}


# RESUME AI ANALYSIS:

# {json.dumps(resume_analysis, indent=2)}


# JOB DESCRIPTION:

# {job_description.job_description}


# JOB DESCRIPTION ANALYSIS:

# {json.dumps(jd_analysis, indent=2)}


# Return ONLY valid JSON.

# Use exactly this structure:

# {{
#     "roadmap_title": "",
#     "career_goal": "",
#     "target_role": "",
#     "current_level": "",
#     "timeline": "",
#     "starting_point": {{
#         "strengths": [],
#         "existing_skills": [],
#         "missing_skills": [],
#         "priority_gaps": []
#     }},
#     "weekly_roadmap": [
#         {{
#             "week": 1,
#             "title": "",
#             "focus": "",
#             "topics": [],
#             "practice_tasks": [],
#             "deliverables": [],
#             "estimated_hours": 0
#         }}
#     ],
#     "projects": [
#         {{
#             "title": "",
#             "description": "",
#             "skills_used": [],
#             "difficulty": "",
#             "purpose": ""
#         }}
#     ],
#     "interview_preparation": {{
#         "technical_topics": [],
#         "hr_topics": [],
#         "coding_topics": [],
#         "communication_focus": []
#     }},
#     "job_preparation": {{
#         "resume_actions": [],
#         "github_actions": [],
#         "portfolio_actions": [],
#         "job_application_actions": []
#     }},
#     "daily_plan": {{
#         "coding": "",
#         "learning": "",
#         "practice": "",
#         "placement_preparation": ""
#     }},
#     "final_advice": []
# }}

# Make the roadmap actionable and personalized.
# """

#     # --------------------------------
#     # Call Gemini
#     # --------------------------------

#     try:

#         response = gemini_client.models.generate_content(
#             model=GEMINI_MODEL,
#             contents=prompt,
#         )

#         roadmap = clean_json_response(
#             response.text
#         )

#     except json.JSONDecodeError:

#         raise HTTPException(
#             status_code=500,
#             detail=(
#                 "AI returned an invalid roadmap format. "
#                 "Please try again."
#             ),
#         )

#     except Exception as e:

#         raise HTTPException(
#             status_code=500,
#             detail=(
#                 f"Failed to generate career roadmap: {str(e)}"
#             ),
#         )

#     # --------------------------------
#     # Mark Career Roadmap Completed
#     # For CURRENT Resume + JD Cycle
#     # --------------------------------

#     progress = (
#         db.query(ModuleProgress)
#         .filter(
#             ModuleProgress.user_id == current_user.id,
#             ModuleProgress.cycle_id == current_cycle.id,
#             ModuleProgress.module_name == "career_roadmap",
#         )
#         .first()
#     )

#     if not progress:

#         progress = ModuleProgress(
#             user_id=current_user.id,
#             cycle_id=current_cycle.id,
#             module_name="career_roadmap",
#             completed=True,
#             completed_at=datetime.utcnow(),
#         )

#         db.add(progress)

#     else:

#         progress.completed = True
#         progress.completed_at = datetime.utcnow()

#     db.commit()

#     # --------------------------------
#     # Final API Response
#     # --------------------------------

#     return {
#         "success": True,
#         "message": (
#             "Personalized career roadmap generated successfully."
#         ),
#         "roadmap": roadmap,
#         "cycle": {
#             "id": current_cycle.id,
#             "resume_id": current_cycle.resume_id,
#             "job_description_id": current_cycle.job_description_id,
#         },
#     }









from typing import Optional
import os
import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from google import genai

from app.database import get_db
from app.models import (
    CareerProfile,
    User,
    Resume,
    JobDescription,
    ModuleProgress,
)
from app.routers.auth import get_current_user


# --------------------------------
# Gemini Configuration
# --------------------------------

load_dotenv(override=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not configured")

gemini_client = genai.Client(api_key=GEMINI_API_KEY)

GEMINI_MODEL = "gemini-3.5-flash-lite"


# --------------------------------
# Router
# --------------------------------

router = APIRouter(
    prefix="/api/v1/career",
    tags=["Career"],
)


# --------------------------------
# Career Profile Request Model
# --------------------------------

class CareerProfileRequest(BaseModel):
    career_goal: str = Field(
        ...,
        min_length=2,
        max_length=255,
    )

    target_role: Optional[str] = Field(
        default=None,
        max_length=255,
    )

    experience_level: Optional[str] = Field(
        default=None,
        max_length=100,
    )

    preferred_domain: Optional[str] = Field(
        default=None,
        max_length=255,
    )

    preferred_work_type: Optional[str] = Field(
        default=None,
        max_length=100,
    )

    additional_goal: Optional[str] = None


# --------------------------------
# JSON Cleaning Helper
# --------------------------------

def clean_json_response(text: str):
    """
    Converts Gemini response into a Python dictionary.
    Handles markdown code fences if Gemini returns them.
    """

    if not text:
        raise ValueError("Empty response received from Gemini")

    cleaned = text.strip()

    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]

    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]

    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]

    cleaned = cleaned.strip()

    return json.loads(cleaned)


# --------------------------------
# Save / Update Career Profile
# --------------------------------

@router.post("/profile")
def save_career_profile(
    profile_data: CareerProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing_profile = (
        db.query(CareerProfile)
        .filter(
            CareerProfile.user_id == current_user.id
        )
        .first()
    )

    if existing_profile:

        existing_profile.career_goal = (
            profile_data.career_goal
        )

        existing_profile.target_role = (
            profile_data.target_role
        )

        existing_profile.experience_level = (
            profile_data.experience_level
        )

        existing_profile.preferred_domain = (
            profile_data.preferred_domain
        )

        existing_profile.preferred_work_type = (
            profile_data.preferred_work_type
        )

        existing_profile.additional_goal = (
            profile_data.additional_goal
        )

        db.commit()
        db.refresh(existing_profile)

        profile = existing_profile

        message = "Career profile updated successfully"

    else:

        profile = CareerProfile(
            user_id=current_user.id,
            career_goal=profile_data.career_goal,
            target_role=profile_data.target_role,
            experience_level=profile_data.experience_level,
            preferred_domain=profile_data.preferred_domain,
            preferred_work_type=profile_data.preferred_work_type,
            additional_goal=profile_data.additional_goal,
        )

        db.add(profile)
        db.commit()
        db.refresh(profile)

        message = "Career profile saved successfully"

    return {
        "success": True,
        "message": message,
        "profile": {
            "id": profile.id,
            "career_goal": profile.career_goal,
            "target_role": profile.target_role,
            "experience_level": profile.experience_level,
            "preferred_domain": profile.preferred_domain,
            "preferred_work_type": profile.preferred_work_type,
            "additional_goal": profile.additional_goal,
        },
    }


# --------------------------------
# Get Career Profile
# --------------------------------

@router.get("/profile")
def get_career_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = (
        db.query(CareerProfile)
        .filter(
            CareerProfile.user_id == current_user.id
        )
        .first()
    )

    if not profile:

        return {
            "success": True,
            "profile": None,
        }

    return {
        "success": True,
        "profile": {
            "id": profile.id,
            "career_goal": profile.career_goal,
            "target_role": profile.target_role,
            "experience_level": profile.experience_level,
            "preferred_domain": profile.preferred_domain,
            "preferred_work_type": profile.preferred_work_type,
            "additional_goal": profile.additional_goal,
        },
    }


# --------------------------------
# AI Career Roadmap
# --------------------------------

@router.get("/roadmap")
def generate_career_roadmap(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # --------------------------------
    # Get latest resume
    # --------------------------------

    resume = (
        db.query(Resume)
        .filter(
            Resume.user_id == current_user.id
        )
        .order_by(Resume.id.desc())
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Please upload and analyze your resume first.",
        )

    # --------------------------------
    # Get career profile
    # --------------------------------

    career_profile = (
        db.query(CareerProfile)
        .filter(
            CareerProfile.user_id == current_user.id
        )
        .first()
    )

    if not career_profile:
        raise HTTPException(
            status_code=404,
            detail="Please complete your career profile first.",
        )

    # --------------------------------
    # Get latest JD if available
    # --------------------------------

    job_description = (
        db.query(JobDescription)
        .filter(
            JobDescription.user_id == current_user.id
        )
        .order_by(JobDescription.id.desc())
        .first()
    )

    # --------------------------------
    # Parse resume analysis
    # --------------------------------

    resume_analysis = resume.ai_analysis

    try:
        resume_analysis = json.loads(resume_analysis)
    except (TypeError, json.JSONDecodeError):
        pass

    # --------------------------------
    # Parse JD analysis if available
    # --------------------------------

    jd_analysis = None

    if job_description:
        try:
            jd_analysis = json.loads(
                job_description.ai_analysis
            )
        except (TypeError, json.JSONDecodeError):
            jd_analysis = job_description.ai_analysis

    # --------------------------------
    # Build personalized AI prompt
    # --------------------------------

    prompt = f"""
You are an expert AI Career Coach and Placement Mentor.

Create a PERSONALIZED career roadmap for the student.

IMPORTANT RULES:

1. Use the student's actual resume information.
2. Use the saved career profile.
3. If a job description is available, use it as additional context.
4. Do NOT invent skills, projects, certifications, experience or education.
5. Clearly separate existing skills from skills that need to be learned.
6. The roadmap must be realistic for a fresher.
7. Prioritize skills based on the student's TARGET ROLE.
8. If the student has a placement deadline, prioritize placement preparation.
9. Do not ask the student to provide information that is already available.
10. Give practical weekly actions.
11. Include projects that match the target role.
12. Include interview preparation.
13. Include resume/GitHub/portfolio preparation.
14. Include job application preparation.
15. Do not recommend learning too many technologies at once.
16. Focus on the highest-priority skills first.

STUDENT CAREER PROFILE:

Career Goal:
{career_profile.career_goal}

Target Role:
{career_profile.target_role}

Experience Level:
{career_profile.experience_level}

Preferred Domain:
{career_profile.preferred_domain}

Preferred Work Type:
{career_profile.preferred_work_type}

Additional Goal:
{career_profile.additional_goal}


RESUME TEXT:

{resume.extracted_text}


RESUME AI ANALYSIS:

{json.dumps(resume_analysis, indent=2)}


JOB DESCRIPTION:

{
    job_description.job_description
    if job_description
    else "No job description provided."
}


JOB DESCRIPTION ANALYSIS:

{json.dumps(jd_analysis, indent=2) if jd_analysis else "No job description analysis available."}


Return ONLY valid JSON.

Use exactly this structure:

{{
    "roadmap_title": "",
    "career_goal": "",
    "target_role": "",
    "current_level": "",
    "timeline": "",
    "starting_point": {{
        "strengths": [],
        "existing_skills": [],
        "missing_skills": [],
        "priority_gaps": []
    }},
    "weekly_roadmap": [
        {{
            "week": 1,
            "title": "",
            "focus": "",
            "topics": [],
            "practice_tasks": [],
            "deliverables": [],
            "estimated_hours": 0
        }}
    ],
    "projects": [
        {{
            "title": "",
            "description": "",
            "skills_used": [],
            "difficulty": "",
            "purpose": ""
        }}
    ],
    "interview_preparation": {{
        "technical_topics": [],
        "hr_topics": [],
        "coding_topics": [],
        "communication_focus": []
    }},
    "job_preparation": {{
        "resume_actions": [],
        "github_actions": [],
        "portfolio_actions": [],
        "job_application_actions": []
    }},
    "daily_plan": {{
        "coding": "",
        "learning": "",
        "practice": "",
        "placement_preparation": ""
    }},
    "final_advice": []
}}

Make the roadmap actionable and personalized.
"""

    # --------------------------------
    # Call Gemini
    # --------------------------------

    try:

        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        )

        roadmap = clean_json_response(
            response.text
        )

    except json.JSONDecodeError:

        raise HTTPException(
            status_code=500,
            detail="AI returned an invalid roadmap format. Please try again.",
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate career roadmap: {str(e)}",
        )

    # --------------------------------
    # Mark Career Roadmap as Completed
    # --------------------------------

    progress = (
        db.query(ModuleProgress)
        .filter(
            ModuleProgress.user_id == current_user.id,
            ModuleProgress.module_name == "career_roadmap",
        )
        .first()
    )

    if not progress:
        progress = ModuleProgress(
            user_id=current_user.id,
            module_name="career_roadmap",
            completed=True,
            completed_at=datetime.utcnow(),
        )

        db.add(progress)

    else:
        progress.completed = True
        progress.completed_at = datetime.utcnow()

    db.commit()

    # --------------------------------
    # Final API Response
    # --------------------------------

    return {
        "success": True,
        "message": "Personalized career roadmap generated successfully.",
        "roadmap": roadmap,
    }
