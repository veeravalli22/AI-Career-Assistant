# from fastapi import APIRouter, Depends, HTTPException
# from pydantic import BaseModel
# from sqlalchemy.orm import Session
# from datetime import datetime

# from app.database import get_db
# from app.models import (
#     Resume,
#     JobDescription,
#     CareerProfile,
#     ChatSession,
#     ModuleProgress,
#     ProgressCycle,
# )
# from app.routers.auth import get_current_user


# router = APIRouter(
#     prefix="/api/v1/progress",
#     tags=["My Progress"],
# )


# # =========================================================
# # ACTUAL PROGRESS MODULES
# # =========================================================
# #
# # Resume Analyzer and Job Description Analyzer are
# # prerequisites for a Progress Cycle.
# #
# # They are NOT counted in the 0%-100% progress calculation.
# #
# # Actual progress modules:
# #
# # 1. Skill Gap Analysis
# # 2. Career Roadmap
# # 3. Interview Preparation
# # 4. AI Mock Interview
# # 5. AI Career Chat
# #
# # Therefore:
# #
# # New Resume + JD = 0 / 5 = 0%
# #
# # All modules completed = 5 / 5 = 100%
# # =========================================================

# PROGRESS_MODULES = [
#     "skill_gap_analysis",
#     "career_roadmap",
#     "interview_preparation",
#     "mock_interview",
#     "career_chat",
# ]


# MODULE_DISPLAY_NAMES = {
#     "skill_gap_analysis": "Skill Gap Analysis",
#     "career_roadmap": "Career Roadmap",
#     "interview_preparation": "Interview Preparation",
#     "mock_interview": "AI Mock Interview",
#     "career_chat": "AI Career Chat",
# }


# # =========================================================
# # REQUEST MODEL
# # =========================================================

# class CompleteModuleRequest(BaseModel):
#     module_name: str


# # =========================================================
# # HELPER
# # =========================================================

# def get_current_cycle(
#     current_user,
#     db: Session,
# ):
#     """
#     Get the latest Progress Cycle for the current user.

#     A Progress Cycle belongs to:
#         User + Resume + Job Description
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


# # =========================================================
# # MARK MODULE AS COMPLETED
# # =========================================================

# @router.post("/complete")
# def complete_module(
#     request: CompleteModuleRequest,
#     current_user=Depends(get_current_user),
#     db: Session = Depends(get_db),
# ):
#     # -----------------------------------------------------
#     # Validate module
#     # -----------------------------------------------------

#     if request.module_name not in PROGRESS_MODULES:
#         raise HTTPException(
#             status_code=400,
#             detail=(
#                 "Invalid module name. "
#                 "Only active progress modules can be completed."
#             ),
#         )

#     # -----------------------------------------------------
#     # Get current Progress Cycle
#     # -----------------------------------------------------

#     current_cycle = get_current_cycle(
#         current_user,
#         db,
#     )

#     if not current_cycle:
#         raise HTTPException(
#             status_code=400,
#             detail=(
#                 "No active progress cycle found. "
#                 "Please upload a resume and analyze a job description first."
#             ),
#         )

#     # -----------------------------------------------------
#     # Find module progress for CURRENT CYCLE only
#     # -----------------------------------------------------

#     progress = (
#         db.query(ModuleProgress)
#         .filter(
#             ModuleProgress.user_id == current_user.id,

#             ModuleProgress.cycle_id
#             == current_cycle.id,

#             ModuleProgress.module_name
#             == request.module_name,
#         )
#         .first()
#     )

#     # -----------------------------------------------------
#     # Create progress record
#     # -----------------------------------------------------

#     if not progress:

#         progress = ModuleProgress(
#             user_id=current_user.id,
#             cycle_id=current_cycle.id,
#             module_name=request.module_name,
#             completed=True,
#             completed_at=datetime.utcnow(),
#         )

#         db.add(progress)

#     else:

#         progress.completed = True
#         progress.completed_at = datetime.utcnow()

#     # -----------------------------------------------------
#     # Save
#     # -----------------------------------------------------

#     db.commit()

#     db.refresh(progress)

#     # -----------------------------------------------------
#     # Response
#     # -----------------------------------------------------

#     return {
#         "success": True,

#         "message": (
#             f"{request.module_name} marked as completed "
#             f"for the current progress cycle."
#         ),

#         "cycle_id": current_cycle.id,

#         "module": {
#             "name": progress.module_name,
#             "completed": progress.completed,
#             "completed_at": progress.completed_at,
#         },
#     }


# # =========================================================
# # GET MY PROGRESS
# # =========================================================

# @router.get("")
# def get_my_progress(
#     current_user=Depends(get_current_user),
#     db: Session = Depends(get_db),
# ):

#     # =====================================================
#     # GET CURRENT PROGRESS CYCLE
#     # =====================================================

#     current_cycle = get_current_cycle(
#         current_user,
#         db,
#     )

#     # =====================================================
#     # NO CYCLE YET
#     # =====================================================

#     if not current_cycle:

#         career_profile = (
#             db.query(CareerProfile)
#             .filter(
#                 CareerProfile.user_id
#                 == current_user.id
#             )
#             .first()
#         )

#         chat_count = (
#             db.query(ChatSession)
#             .filter(
#                 ChatSession.user_id
#                 == current_user.id
#             )
#             .count()
#         )

#         modules = {
#             module_name: False
#             for module_name in PROGRESS_MODULES
#         }

#         return {
#             "success": True,

#             "progress": {
#                 "completed_modules": 0,
#                 "total_modules": len(PROGRESS_MODULES),
#                 "percentage": 0,
#             },

#             "completed_module_names": [],

#             "modules": modules,

#             "cycle": {
#                 "active": False,
#                 "cycle_id": None,
#                 "resume_id": None,
#                 "job_description_id": None,
#             },

#             "chat_sessions": chat_count,

#             "career_profile": {
#                 "completed": bool(career_profile),

#                 "target_role": (
#                     career_profile.target_role
#                     if career_profile
#                     else None
#                 ),

#                 "career_goal": (
#                     career_profile.career_goal
#                     if career_profile
#                     else None
#                 ),
#             },
#         }

#     # =====================================================
#     # GET CURRENT RESUME
#     # =====================================================

#     resume = (
#         db.query(Resume)
#         .filter(
#             Resume.id
#             == current_cycle.resume_id,

#             Resume.user_id
#             == current_user.id,
#         )
#         .first()
#     )

#     # =====================================================
#     # GET CURRENT JOB DESCRIPTION
#     # =====================================================

#     job_description = (
#         db.query(JobDescription)
#         .filter(
#             JobDescription.id
#             == current_cycle.job_description_id,

#             JobDescription.user_id
#             == current_user.id,
#         )
#         .first()
#     )

#     # =====================================================
#     # CAREER PROFILE
#     # =====================================================

#     career_profile = (
#         db.query(CareerProfile)
#         .filter(
#             CareerProfile.user_id
#             == current_user.id
#         )
#         .first()
#     )

#     # =====================================================
#     # CHAT COUNT
#     # =====================================================

#     chat_count = (
#         db.query(ChatSession)
#         .filter(
#             ChatSession.user_id
#             == current_user.id
#         )
#         .count()
#     )

#     # =====================================================
#     # CURRENT CYCLE MODULE PROGRESS
#     # =====================================================

#     progress_records = (
#         db.query(ModuleProgress)
#         .filter(
#             ModuleProgress.user_id
#             == current_user.id,

#             ModuleProgress.cycle_id
#             == current_cycle.id,

#             ModuleProgress.module_name.in_(
#                 PROGRESS_MODULES
#             ),
#         )
#         .all()
#     )

#     # =====================================================
#     # BUILD PROGRESS MAP
#     # =====================================================

#     progress_map = {
#         record.module_name: record.completed
#         for record in progress_records
#     }

#     # =====================================================
#     # MODULE STATUS
#     # =====================================================

#     modules = {
#         module_name: progress_map.get(
#             module_name,
#             False,
#         )
#         for module_name in PROGRESS_MODULES
#     }

#     # =====================================================
#     # COMPLETED COUNT
#     # =====================================================

#     completed_count = sum(
#         1
#         for completed in modules.values()
#         if completed
#     )

#     total_modules = len(PROGRESS_MODULES)

#     # =====================================================
#     # PERCENTAGE
#     # =====================================================

#     progress_percentage = round(
#         (completed_count / total_modules) * 100
#     )

#     # =====================================================
#     # COMPLETED MODULE NAMES
#     # =====================================================

#     completed_modules = [
#         MODULE_DISPLAY_NAMES[module_name]
#         for module_name, completed
#         in modules.items()
#         if completed
#     ]

#     # =====================================================
#     # FINAL RESPONSE
#     # =====================================================

#     return {
#         "success": True,

#         # -------------------------------------------------
#         # Progress
#         # -------------------------------------------------

#         "progress": {
#             "completed_modules": completed_count,
#             "total_modules": total_modules,
#             "percentage": progress_percentage,
#         },

#         # -------------------------------------------------
#         # Completed module names
#         # -------------------------------------------------

#         "completed_module_names": completed_modules,

#         # -------------------------------------------------
#         # Module status
#         # -------------------------------------------------

#         "modules": modules,

#         # -------------------------------------------------
#         # Current cycle
#         # -------------------------------------------------

#         "cycle": {
#             "active": True,

#             "cycle_id": current_cycle.id,

#             "resume_id": (
#                 current_cycle.resume_id
#             ),

#             "job_description_id": (
#                 current_cycle.job_description_id
#             ),

#             "resume_filename": (
#                 resume.filename
#                 if resume
#                 else None
#             ),

#             "resume_available": bool(resume),

#             "job_description_available": (
#                 bool(job_description)
#             ),
#         },

#         # -------------------------------------------------
#         # Chat sessions
#         # -------------------------------------------------

#         "chat_sessions": chat_count,

#         # -------------------------------------------------
#         # Career profile
#         # -------------------------------------------------

#         "career_profile": {
#             "completed": bool(career_profile),

#             "target_role": (
#                 career_profile.target_role
#                 if career_profile
#                 else None
#             ),

#             "career_goal": (
#                 career_profile.career_goal
#                 if career_profile
#                 else None
#             ),
#         },
#     }








from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models import (
    Resume,
    JobDescription,
    CareerProfile,
    ChatSession,
    ModuleProgress,
)
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/api/v1/progress",
    tags=["My Progress"],
)


# ---------------------------------------------------------
# Request model for marking a module as completed
# ---------------------------------------------------------

class CompleteModuleRequest(BaseModel):
    module_name: str


# ---------------------------------------------------------
# Mark a module as completed
# ---------------------------------------------------------

@router.post("/complete")
def complete_module(
    request: CompleteModuleRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    allowed_modules = {
        "resume_analyzer",
        "job_description_analyzer",
        "skill_gap_analysis",
        "career_roadmap",
        "interview_preparation",
        "mock_interview",
        "career_chat",
    }

    if request.module_name not in allowed_modules:
        raise HTTPException(
            status_code=400,
            detail="Invalid module name.",
        )

    progress = (
        db.query(ModuleProgress)
        .filter(
            ModuleProgress.user_id == current_user.id,
            ModuleProgress.module_name == request.module_name,
        )
        .first()
    )

    if not progress:
        progress = ModuleProgress(
            user_id=current_user.id,
            module_name=request.module_name,
            completed=True,
            completed_at=datetime.utcnow(),
        )
        db.add(progress)
    else:
        progress.completed = True
        progress.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(progress)

    return {
        "success": True,
        "message": f"{request.module_name} marked as completed.",
        "module": {
            "name": progress.module_name,
            "completed": progress.completed,
            "completed_at": progress.completed_at,
        },
    }


# ---------------------------------------------------------
# Get My Progress
# ---------------------------------------------------------

@router.get("")
def get_my_progress(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # -----------------------------------------------------
    # Existing data-based completion
    # -----------------------------------------------------

    resume = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
        .first()
    )

    job_description = (
        db.query(JobDescription)
        .filter(JobDescription.user_id == current_user.id)
        .order_by(JobDescription.created_at.desc())
        .first()
    )

    career_profile = (
        db.query(CareerProfile)
        .filter(CareerProfile.user_id == current_user.id)
        .first()
    )

    chat_count = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .count()
    )

    # -----------------------------------------------------
    # ModuleProgress records
    # -----------------------------------------------------

    progress_records = (
        db.query(ModuleProgress)
        .filter(ModuleProgress.user_id == current_user.id)
        .all()
    )

    progress_map = {
        record.module_name: record.completed
        for record in progress_records
    }

    # -----------------------------------------------------
    # Module completion status
    # -----------------------------------------------------

    modules = {
        "resume_analyzer": bool(resume)
        or progress_map.get("resume_analyzer", False),

        "job_description_analyzer": bool(job_description)
        or progress_map.get("job_description_analyzer", False),

        "skill_gap_analysis": progress_map.get(
            "skill_gap_analysis",
            False,
        ),

        "career_roadmap": progress_map.get(
            "career_roadmap",
            False,
        ),

        "interview_preparation": progress_map.get(
            "interview_preparation",
            False,
        ),

        "mock_interview": progress_map.get(
            "mock_interview",
            False,
        ),

        "career_chat": chat_count > 0
        or progress_map.get("career_chat", False),
    }

    # -----------------------------------------------------
    # Completed module count
    # -----------------------------------------------------

    completed_count = sum(
        1 for completed in modules.values()
        if completed
    )

    total_modules = len(modules)

    progress_percentage = round(
        (completed_count / total_modules) * 100
    )

    # -----------------------------------------------------
    # Completed module names
    # -----------------------------------------------------

    module_display_names = {
        "resume_analyzer": "Resume Analyzer",
        "job_description_analyzer": "Job Description Analyzer",
        "skill_gap_analysis": "Skill Gap Analysis",
        "career_roadmap": "Career Roadmap",
        "interview_preparation": "Interview Preparation",
        "mock_interview": "AI Mock Interview",
        "career_chat": "AI Career Chat",
    }

    completed_modules = [
        module_display_names[module_name]
        for module_name, completed in modules.items()
        if completed
    ]

    # -----------------------------------------------------
    # Final response
    # -----------------------------------------------------

    return {
        "success": True,

        "progress": {
            "completed_modules": completed_count,
            "total_modules": total_modules,
            "percentage": progress_percentage,
        },

        "completed_module_names": completed_modules,

        "modules": modules,

        "chat_sessions": chat_count,

        "career_profile": {
            "completed": bool(career_profile),

            "target_role": (
                career_profile.target_role
                if career_profile
                else None
            ),

            "career_goal": (
                career_profile.career_goal
                if career_profile
                else None
            ),
        },
    }