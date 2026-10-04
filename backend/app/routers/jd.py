# # from fastapi import APIRouter, Depends, HTTPException
# # from pydantic import BaseModel
# # from sqlalchemy.orm import Session
# # from dotenv import load_dotenv
# # from google import genai
# # import os
# # import json

# # from app.database import SessionLocal
# # from app.models import (
# #     User,
# #     JobDescription,
# #     Resume,
# #     ProgressCycle,
# # )
# # from app.routers.auth import get_current_user


# # load_dotenv(override=True)


# # router = APIRouter(
# #     prefix="/api/v1/jd",
# #     tags=["Job Description Analyzer"],
# # )


# # # =========================================================
# # # DATABASE
# # # =========================================================

# # def get_db():
# #     db = SessionLocal()

# #     try:
# #         yield db
# #     finally:
# #         db.close()


# # # =========================================================
# # # GEMINI
# # # =========================================================

# # GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# # if not GEMINI_API_KEY:
# #     raise RuntimeError("GEMINI_API_KEY is not configured")


# # gemini_client = genai.Client(
# #     api_key=GEMINI_API_KEY
# # )

# # GEMINI_MODEL = "gemini-3.5-flash-lite"


# # # =========================================================
# # # REQUEST MODEL
# # # =========================================================

# # class JDRequest(BaseModel):
# #     job_description: str


# # # =========================================================
# # # CLEAN GEMINI JSON
# # # =========================================================

# # def clean_json_response(raw_text: str) -> str:

# #     raw_text = raw_text.strip()

# #     if raw_text.startswith("```json"):
# #         raw_text = raw_text[7:].strip()

# #     elif raw_text.startswith("```"):
# #         raw_text = raw_text[3:].strip()

# #     if raw_text.endswith("```"):
# #         raw_text = raw_text[:-3].strip()

# #     return raw_text


# # # =========================================================
# # # SAFE LIST
# # # =========================================================

# # def safe_list(value):

# #     if isinstance(value, list):
# #         return value

# #     return []


# # # =========================================================
# # # CREATE 56-DAY ROADMAP
# # # =========================================================

# # def create_56_day_roadmap(analysis):

# #     syllabus = analysis.get("complete_syllabus", {})

# #     technical = safe_list(
# #         syllabus.get("technical")
# #     )

# #     aptitude = safe_list(
# #         syllabus.get("aptitude")
# #     )

# #     reasoning = safe_list(
# #         syllabus.get("reasoning")
# #     )

# #     english = safe_list(
# #         syllabus.get("english")
# #     )

# #     interview = safe_list(
# #         syllabus.get("interview")
# #     )

# #     # -----------------------------------------------------
# #     # FALLBACK TOPICS
# #     # -----------------------------------------------------

# #     if not technical:
# #         technical = [
# #             {
# #                 "topic": "Programming Basics",
# #                 "models": [
# #                     "variables",
# #                     "data types",
# #                     "operators",
# #                     "input and output",
# #                     "conditional statements",
# #                     "loops"
# #                 ]
# #             }
# #         ]

# #     if not aptitude:
# #         aptitude = [
# #             {
# #                 "topic": "Percentages",
# #                 "models": [
# #                     "basic percentage",
# #                     "increase and decrease",
# #                     "reverse percentage",
# #                     "successive percentage"
# #                 ]
# #             }
# #         ]

# #     if not reasoning:
# #         reasoning = [
# #             {
# #                 "topic": "Logical Reasoning",
# #                 "models": [
# #                     "series",
# #                     "coding-decoding",
# #                     "blood relations",
# #                     "directions"
# #                 ]
# #             }
# #         ]

# #     if not english:
# #         english = [
# #             {
# #                 "topic": "English Communication",
# #                 "models": [
# #                     "grammar",
# #                     "vocabulary",
# #                     "sentence correction",
# #                     "spoken English"
# #                 ]
# #             }
# #         ]

# #     if not interview:
# #         interview = [
# #             {
# #                 "topic": "Self Introduction",
# #                 "models": [
# #                     "self introduction",
# #                     "resume introduction",
# #                     "career goals"
# #                 ]
# #             }
# #         ]

# #     # -----------------------------------------------------
# #     # HELPERS
# #     # -----------------------------------------------------

# #     def get_item(items, index):

# #         return items[index % len(items)]

# #     def get_models(item):

# #         models = item.get("models", [])

# #         if not isinstance(models, list):
# #             models = []

# #         if not models:
# #             models = [
# #                 item.get("topic", "Important concepts")
# #             ]

# #         return models

# #     # -----------------------------------------------------
# #     # CREATE 56 DAYS
# #     # -----------------------------------------------------

# #     all_days = []

# #     for day_number in range(1, 57):

# #         technical_item = get_item(
# #             technical,
# #             day_number - 1
# #         )

# #         aptitude_item = get_item(
# #             aptitude,
# #             day_number - 1
# #         )

# #         reasoning_item = get_item(
# #             reasoning,
# #             day_number - 1
# #         )

# #         english_item = get_item(
# #             english,
# #             day_number - 1
# #         )

# #         interview_item = get_item(
# #             interview,
# #             day_number - 1
# #         )

# #         # -------------------------------------------------
# #         # SPECIAL REVISION / MOCK DAYS
# #         # -------------------------------------------------

# #         if day_number in [7, 14, 21, 28, 35, 42, 49]:

# #             technical_topic = "Technical Revision"
# #             technical_models = [
# #                 "Revise previously completed technical models"
# #             ]

# #             aptitude_topic = "Aptitude Revision"
# #             aptitude_models = [
# #                 "Revise previously completed aptitude models"
# #             ]

# #             reasoning_topic = "Reasoning Revision"
# #             reasoning_models = [
# #                 "Revise previously completed reasoning models"
# #             ]

# #             english_topic = "English Revision"
# #             english_models = [
# #                 "Revise grammar and vocabulary"
# #             ]

# #             interview_topic = "Interview Revision"
# #             interview_models = [
# #                 "Revise previously prepared interview questions"
# #             ]

# #         elif day_number == 56:

# #             technical_topic = "Final Technical Mock"
# #             technical_models = [
# #                 "Mixed coding problems",
# #                 "Important technical interview questions"
# #             ]

# #             aptitude_topic = "Full Aptitude Mock"
# #             aptitude_models = [
# #                 "Mixed aptitude questions"
# #             ]

# #             reasoning_topic = "Full Reasoning Mock"
# #             reasoning_models = [
# #                 "Mixed reasoning questions"
# #             ]

# #             english_topic = "Final English Practice"
# #             english_models = [
# #                 "Grammar",
# #                 "Vocabulary",
# #                 "Communication"
# #             ]

# #             interview_topic = "Final Mock Interview"
# #             interview_models = [
# #                 "Technical interview",
# #                 "HR interview",
# #                 "Project explanation"
# #             ]

# #         else:

# #             technical_topic = technical_item.get(
# #                 "topic",
# #                 "Technical Preparation"
# #             )

# #             technical_models = get_models(
# #                 technical_item
# #             )

# #             aptitude_topic = aptitude_item.get(
# #                 "topic",
# #                 "Aptitude"
# #             )

# #             aptitude_models = get_models(
# #                 aptitude_item
# #             )

# #             reasoning_topic = reasoning_item.get(
# #                 "topic",
# #                 "Reasoning"
# #             )

# #             reasoning_models = get_models(
# #                 reasoning_item
# #             )

# #             english_topic = english_item.get(
# #                 "topic",
# #                 "English"
# #             )

# #             english_models = get_models(
# #                 english_item
# #             )

# #             interview_topic = interview_item.get(
# #                 "topic",
# #                 "Interview Preparation"
# #             )

# #             interview_models = get_models(
# #                 interview_item
# #             )

# #         # -------------------------------------------------
# #         # DAY OBJECT
# #         # -------------------------------------------------

# #         day = {
# #             "day": day_number,

# #             "technical": {
# #                 "topic": technical_topic,
# #                 "models": technical_models,
# #                 "minutes": 60,
# #                 "practice": [
# #                     "Solve 2 coding problems",
# #                     "Revise important concepts",
# #                     "Practice interview questions"
# #                 ]
# #             },

# #             "aptitude": {
# #                 "topic": aptitude_topic,
# #                 "models": aptitude_models,
# #                 "minutes": 30,
# #                 "practice": [
# #                     "Solve 10 aptitude questions",
# #                     "Review incorrect answers"
# #                 ]
# #             },

# #             "reasoning": {
# #                 "topic": reasoning_topic,
# #                 "models": reasoning_models,
# #                 "minutes": 30,
# #                 "practice": [
# #                     "Solve 10 reasoning questions",
# #                     "Review shortcuts and mistakes"
# #                 ]
# #             },

# #             "english": {
# #                 "topic": english_topic,
# #                 "models": english_models,
# #                 "minutes": 20,
# #                 "task": "Practice the selected English concepts and communication."
# #             },

# #             "interview": {
# #                 "topic": interview_topic,
# #                 "models": interview_models,
# #                 "minutes": 20,
# #                 "task": "Practice relevant interview questions and speak answers aloud."
# #             }
# #         }

# #         all_days.append(day)

# #     # -----------------------------------------------------
# #     # SPLIT INTO 8 WEEKS
# #     # -----------------------------------------------------

# #     roadmap = []

# #     for week_number in range(1, 9):

# #         start_index = (week_number - 1) * 7
# #         end_index = start_index + 7

# #         week_days = all_days[
# #             start_index:end_index
# #         ]

# #         if week_number == 1:
# #             focus = "Foundation and basic concepts"

# #         elif week_number == 2:
# #             focus = "Core concepts and beginner practice"

# #         elif week_number == 3:
# #             focus = "Intermediate concepts and problem solving"

# #         elif week_number == 4:
# #             focus = "Technical and aptitude practice"

# #         elif week_number == 5:
# #             focus = "Advanced practice and interview preparation"

# #         elif week_number == 6:
# #             focus = "Mixed practice and timed preparation"

# #         elif week_number == 7:
# #             focus = "Revision, weak areas and mock tests"

# #         else:
# #             focus = "Final revision, coding and mock interviews"

# #         roadmap.append({
# #             "week": week_number,
# #             "focus": focus,
# #             "days": week_days
# #         })

# #     return roadmap


# # # =========================================================
# # # VALIDATE 8 WEEKS / 56 DAYS
# # # =========================================================

# # def validate_roadmap(roadmap):

# #     if not isinstance(roadmap, list):
# #         raise ValueError(
# #             "Roadmap must be a list."
# #         )

# #     if len(roadmap) != 8:
# #         raise ValueError(
# #             "Roadmap must contain exactly 8 weeks."
# #         )

# #     expected_day = 1

# #     for week_index, week in enumerate(
# #         roadmap,
# #         start=1
# #     ):

# #         if week.get("week") != week_index:
# #             raise ValueError(
# #                 f"Invalid week number: {week_index}"
# #             )

# #         days = week.get("days", [])

# #         if len(days) != 7:
# #             raise ValueError(
# #                 f"Week {week_index} must contain exactly 7 days."
# #             )

# #         for day in days:

# #             if day.get("day") != expected_day:
# #                 raise ValueError(
# #                     f"Invalid day number. Expected Day {expected_day}."
# #                 )

# #             expected_day += 1

# #     if expected_day != 57:
# #         raise ValueError(
# #             "Roadmap must contain exactly 56 days."
# #         )

# #     return True


# # # =========================================================
# # # GENERATE AI ANALYSIS
# # # =========================================================

# # def generate_analysis(job_description: str):

# #     prompt = f"""
# # You are an expert AI Career and Placement Assistant.

# # Analyze the following job description for a final-year engineering student.

# # JOB DESCRIPTION:

# # {job_description}

# # Create a detailed but structured career preparation analysis.

# # IMPORTANT:

# # The job description is the primary source.

# # Identify:

# # 1. Job title
# # 2. Company
# # 3. Location
# # 4. Job type
# # 5. Eligibility
# # 6. Responsibilities
# # 7. Interview process
# # 8. Skills required
# # 9. Technical syllabus
# # 10. Aptitude syllabus
# # 11. Reasoning syllabus
# # 12. English syllabus
# # 13. Interview syllabus
# # 14. Technical interview questions
# # 15. HR questions
# # 16. Project questions
# # 17. Communication practice

# # For every syllabus topic provide ALL important models.

# # Do not limit a topic to only two models.

# # Only include technologies relevant to the job description.

# # The student is a beginner/final-year engineering student.

# # Return ONLY valid JSON.

# # Do not use Markdown.

# # Do not use code fences.

# # Use exactly this structure:

# # {{
# #   "job_overview": {{
# #     "job_title": "",
# #     "company": "",
# #     "location": "",
# #     "job_type": "",
# #     "eligibility": [],
# #     "responsibilities": [],
# #     "interview_process": []
# #   }},

# #   "skills_to_prepare": [
# #     {{
# #       "skill": "",
# #       "priority": "HIGH",
# #       "reason": ""
# #     }}
# #   ],

# #   "complete_syllabus": {{
# #     "technical": [
# #       {{
# #         "topic": "",
# #         "models": []
# #       }}
# #     ],

# #     "aptitude": [
# #       {{
# #         "topic": "",
# #         "models": []
# #       }}
# #     ],

# #     "reasoning": [
# #       {{
# #         "topic": "",
# #         "models": []
# #       }}
# #     ],

# #     "english": [
# #       {{
# #         "topic": "",
# #         "models": []
# #       }}
# #     ],

# #     "interview": [
# #       {{
# #         "topic": "",
# #         "models": []
# #       }}
# #     ]
# #   }},

# #   "daily_time_allocation": {{
# #     "technical_minutes": 60,
# #     "aptitude_minutes": 30,
# #     "reasoning_minutes": 30,
# #     "english_minutes": 20,
# #     "interview_minutes": 20,
# #     "total_minutes": 160
# #   }},

# #   "daily_practice_system": {{
# #     "technical": [],
# #     "aptitude": [],
# #     "reasoning": [],
# #     "english": [],
# #     "interview": []
# #   }},

# #   "interview_preparation": {{
# #     "technical_questions": [],
# #     "hr_questions": [],
# #     "project_questions": [],
# #     "communication_practice": []
# #   }}
# # }}
# # """

# #     try:

# #         response = gemini_client.models.generate_content(
# #             model=GEMINI_MODEL,
# #             contents=prompt,
# #             config=genai.types.GenerateContentConfig(
# #                 response_mime_type="application/json"
# #             )
# #         )

# #         raw_text = response.text

# #         if not raw_text:
# #             raise ValueError(
# #                 "Gemini returned an empty response."
# #             )

# #         raw_text = clean_json_response(
# #             raw_text
# #         )

# #         analysis = json.loads(
# #             raw_text
# #         )

# #         if not isinstance(
# #             analysis,
# #             dict
# #         ):
# #             raise ValueError(
# #                 "Gemini response is not a JSON object."
# #             )

# #         # -------------------------------------------------
# #         # CREATE ROADMAP IN PYTHON
# #         # -------------------------------------------------

# #         roadmap = create_56_day_roadmap(
# #             analysis
# #         )

# #         validate_roadmap(
# #             roadmap
# #         )

# #         analysis[
# #             "eight_week_roadmap"
# #         ] = roadmap

# #         return analysis

# #     except json.JSONDecodeError as error:

# #         raise HTTPException(
# #             status_code=500,
# #             detail=(
# #                 "Gemini returned invalid JSON. "
# #                 f"JSON error: {str(error)}"
# #             )
# #         )

# #     except HTTPException:
# #         raise

# #     except Exception as error:

# #         raise HTTPException(
# #             status_code=500,
# #             detail=(
# #                 f"Gemini analysis failed: {str(error)}"
# #             )
# #         )


# # # =========================================================
# # # ANALYZE JOB DESCRIPTION
# # # =========================================================

# # @router.post("/analyze")
# # def analyze_job_description(
# #     request: JDRequest,
# #     current_user: User = Depends(
# #         get_current_user
# #     ),
# #     db: Session = Depends(
# #         get_db
# #     ),
# # ):

# #     if not request.job_description.strip():

# #         raise HTTPException(
# #             status_code=400,
# #             detail="Job description cannot be empty"
# #         )

# #     try:

# #         # -------------------------------------------------
# #         # GENERATE ANALYSIS
# #         # -------------------------------------------------

# #         analysis = generate_analysis(
# #             request.job_description
# #         )

# #         # -------------------------------------------------
# #         # FINAL ROADMAP CHECK
# #         # -------------------------------------------------

# #         validate_roadmap(
# #             analysis[
# #                 "eight_week_roadmap"
# #             ]
# #         )

# #         # -------------------------------------------------
# #         # SAVE TO DATABASE
# #         # -------------------------------------------------

# #         saved_jd = JobDescription(
# #             user_id=current_user.id,
# #             job_description=request.job_description,
# #             ai_analysis=json.dumps(
# #                 analysis
# #             )
# #         )

# #         db.add(saved_jd)

# #         db.commit()

# #         db.refresh(
# #             saved_jd
# #         )

# #         # =================================================
# #         # CREATE NEW PROGRESS CYCLE
# #         # =================================================
# #         #
# #         # The latest Resume + this newly uploaded/analyzed
# #         # JD become one Progress Cycle.
# #         #
# #         # Example:
# #         #
# #         # Resume 1 + JD 1 -> Cycle 1
# #         # Resume 2 + JD 2 -> Cycle 2
# #         #
# #         # Progress will later be calculated separately
# #         # for each cycle.
# #         # =================================================

# #         latest_resume = (
# #             db.query(Resume)
# #             .filter(
# #                 Resume.user_id == current_user.id
# #             )
# #             .order_by(
# #                 Resume.id.desc()
# #             )
# #             .first()
# #         )

# #         if latest_resume:

# #             existing_cycle = (
# #                 db.query(ProgressCycle)
# #                 .filter(
# #                     ProgressCycle.user_id
# #                     == current_user.id,

# #                     ProgressCycle.resume_id
# #                     == latest_resume.id,

# #                     ProgressCycle.job_description_id
# #                     == saved_jd.id,
# #                 )
# #                 .first()
# #             )

# #             if not existing_cycle:

# #                 new_cycle = ProgressCycle(
# #                     user_id=current_user.id,
# #                     resume_id=latest_resume.id,
# #                     job_description_id=saved_jd.id,
# #                 )

# #                 db.add(
# #                     new_cycle
# #                 )

# #                 db.commit()

# #                 db.refresh(
# #                     new_cycle
# #                 )

# #         # -------------------------------------------------
# #         # RETURN
# #         # -------------------------------------------------

# #         return {
# #             "message": "Job description analyzed successfully",
# #             "user_id": current_user.id,
# #             "jd_id": saved_jd.id,
# #             "analysis": analysis
# #         }

# #     except HTTPException:

# #         db.rollback()

# #         raise

# #     except Exception as error:

# #         db.rollback()

# #         raise HTTPException(
# #             status_code=500,
# #             detail=(
# #                 f"Gemini analysis failed: {str(error)}"
# #             )
# #         )


# # # =========================================================
# # # GET LATEST SAVED JD
# # # =========================================================

# # @router.get("/latest")
# # def get_latest_job_description(
# #     current_user: User = Depends(
# #         get_current_user
# #     ),
# #     db: Session = Depends(
# #         get_db
# #     ),
# # ):

# #     saved_jd = (
# #         db.query(JobDescription)
# #         .filter(
# #             JobDescription.user_id
# #             == current_user.id
# #         )
# #         .order_by(
# #             JobDescription.id.desc()
# #         )
# #         .first()
# #     )

# #     if not saved_jd:

# #         return {
# #             "message": "No saved job description found",
# #             "job_description": "",
# #             "analysis": None
# #         }

# #     try:

# #         analysis = json.loads(
# #             saved_jd.ai_analysis
# #         )

# #     except json.JSONDecodeError:

# #         analysis = None

# #     return {
# #         "message": "Latest job description retrieved successfully",
# #         "jd_id": saved_jd.id,
# #         "job_description": saved_jd.job_description,
# #         "analysis": analysis
# #     }





# from fastapi import APIRouter, Depends, HTTPException
# from pydantic import BaseModel
# from sqlalchemy.orm import Session
# from dotenv import load_dotenv
# from google import genai
# import os
# import json

# from app.database import SessionLocal
# from app.models import User, JobDescription
# from app.routers.auth import get_current_user


# load_dotenv(override=True)


# router = APIRouter(
#     prefix="/api/v1/jd",
#     tags=["Job Description Analyzer"],
# )


# # =========================================================
# # DATABASE
# # =========================================================

# def get_db():
#     db = SessionLocal()

#     try:
#         yield db
#     finally:
#         db.close()


# # =========================================================
# # GEMINI
# # =========================================================

# GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# if not GEMINI_API_KEY:
#     raise RuntimeError("GEMINI_API_KEY is not configured")


# gemini_client = genai.Client(
#     api_key=GEMINI_API_KEY
# )

# GEMINI_MODEL = "gemini-3.5-flash-lite"


# # =========================================================
# # REQUEST MODEL
# # =========================================================

# class JDRequest(BaseModel):
#     job_description: str


# # =========================================================
# # CLEAN GEMINI JSON
# # =========================================================

# def clean_json_response(raw_text: str) -> str:

#     raw_text = raw_text.strip()

#     if raw_text.startswith("```json"):
#         raw_text = raw_text[7:].strip()

#     elif raw_text.startswith("```"):
#         raw_text = raw_text[3:].strip()

#     if raw_text.endswith("```"):
#         raw_text = raw_text[:-3].strip()

#     return raw_text


# # =========================================================
# # SAFE LIST
# # =========================================================

# def safe_list(value):

#     if isinstance(value, list):
#         return value

#     return []


# # =========================================================
# # CREATE 56-DAY ROADMAP
# # =========================================================

# def create_56_day_roadmap(analysis):

#     syllabus = analysis.get("complete_syllabus", {})

#     technical = safe_list(
#         syllabus.get("technical")
#     )

#     aptitude = safe_list(
#         syllabus.get("aptitude")
#     )

#     reasoning = safe_list(
#         syllabus.get("reasoning")
#     )

#     english = safe_list(
#         syllabus.get("english")
#     )

#     interview = safe_list(
#         syllabus.get("interview")
#     )

#     # -----------------------------------------------------
#     # FALLBACK TOPICS
#     # -----------------------------------------------------

#     if not technical:
#         technical = [
#             {
#                 "topic": "Programming Basics",
#                 "models": [
#                     "variables",
#                     "data types",
#                     "operators",
#                     "input and output",
#                     "conditional statements",
#                     "loops"
#                 ]
#             }
#         ]

#     if not aptitude:
#         aptitude = [
#             {
#                 "topic": "Percentages",
#                 "models": [
#                     "basic percentage",
#                     "increase and decrease",
#                     "reverse percentage",
#                     "successive percentage"
#                 ]
#             }
#         ]

#     if not reasoning:
#         reasoning = [
#             {
#                 "topic": "Logical Reasoning",
#                 "models": [
#                     "series",
#                     "coding-decoding",
#                     "blood relations",
#                     "directions"
#                 ]
#             }
#         ]

#     if not english:
#         english = [
#             {
#                 "topic": "English Communication",
#                 "models": [
#                     "grammar",
#                     "vocabulary",
#                     "sentence correction",
#                     "spoken English"
#                 ]
#             }
#         ]

#     if not interview:
#         interview = [
#             {
#                 "topic": "Self Introduction",
#                 "models": [
#                     "self introduction",
#                     "resume introduction",
#                     "career goals"
#                 ]
#             }
#         ]

#     # -----------------------------------------------------
#     # HELPERS
#     # -----------------------------------------------------

#     def get_item(items, index):

#         return items[index % len(items)]

#     def get_models(item):

#         models = item.get("models", [])

#         if not isinstance(models, list):
#             models = []

#         if not models:
#             models = [
#                 item.get("topic", "Important concepts")
#             ]

#         return models

#     # -----------------------------------------------------
#     # CREATE 56 DAYS
#     # -----------------------------------------------------

#     all_days = []

#     for day_number in range(1, 57):

#         technical_item = get_item(
#             technical,
#             day_number - 1
#         )

#         aptitude_item = get_item(
#             aptitude,
#             day_number - 1
#         )

#         reasoning_item = get_item(
#             reasoning,
#             day_number - 1
#         )

#         english_item = get_item(
#             english,
#             day_number - 1
#         )

#         interview_item = get_item(
#             interview,
#             day_number - 1
#         )

#         # -------------------------------------------------
#         # SPECIAL REVISION / MOCK DAYS
#         # -------------------------------------------------

#         if day_number in [7, 14, 21, 28, 35, 42, 49]:

#             technical_topic = "Technical Revision"
#             technical_models = [
#                 "Revise previously completed technical models"
#             ]

#             aptitude_topic = "Aptitude Revision"
#             aptitude_models = [
#                 "Revise previously completed aptitude models"
#             ]

#             reasoning_topic = "Reasoning Revision"
#             reasoning_models = [
#                 "Revise previously completed reasoning models"
#             ]

#             english_topic = "English Revision"
#             english_models = [
#                 "Revise grammar and vocabulary"
#             ]

#             interview_topic = "Interview Revision"
#             interview_models = [
#                 "Revise previously prepared interview questions"
#             ]

#         elif day_number == 56:

#             technical_topic = "Final Technical Mock"
#             technical_models = [
#                 "Mixed coding problems",
#                 "Important technical interview questions"
#             ]

#             aptitude_topic = "Full Aptitude Mock"
#             aptitude_models = [
#                 "Mixed aptitude questions"
#             ]

#             reasoning_topic = "Full Reasoning Mock"
#             reasoning_models = [
#                 "Mixed reasoning questions"
#             ]

#             english_topic = "Final English Practice"
#             english_models = [
#                 "Grammar",
#                 "Vocabulary",
#                 "Communication"
#             ]

#             interview_topic = "Final Mock Interview"
#             interview_models = [
#                 "Technical interview",
#                 "HR interview",
#                 "Project explanation"
#             ]

#         else:

#             technical_topic = technical_item.get(
#                 "topic",
#                 "Technical Preparation"
#             )

#             technical_models = get_models(
#                 technical_item
#             )

#             aptitude_topic = aptitude_item.get(
#                 "topic",
#                 "Aptitude"
#             )

#             aptitude_models = get_models(
#                 aptitude_item
#             )

#             reasoning_topic = reasoning_item.get(
#                 "topic",
#                 "Reasoning"
#             )

#             reasoning_models = get_models(
#                 reasoning_item
#             )

#             english_topic = english_item.get(
#                 "topic",
#                 "English"
#             )

#             english_models = get_models(
#                 english_item
#             )

#             interview_topic = interview_item.get(
#                 "topic",
#                 "Interview Preparation"
#             )

#             interview_models = get_models(
#                 interview_item
#             )

#         # -------------------------------------------------
#         # DAY OBJECT
#         # -------------------------------------------------

#         day = {
#             "day": day_number,

#             "technical": {
#                 "topic": technical_topic,
#                 "models": technical_models,
#                 "minutes": 60,
#                 "practice": [
#                     "Solve 2 coding problems",
#                     "Revise important concepts",
#                     "Practice interview questions"
#                 ]
#             },

#             "aptitude": {
#                 "topic": aptitude_topic,
#                 "models": aptitude_models,
#                 "minutes": 30,
#                 "practice": [
#                     "Solve 10 aptitude questions",
#                     "Review incorrect answers"
#                 ]
#             },

#             "reasoning": {
#                 "topic": reasoning_topic,
#                 "models": reasoning_models,
#                 "minutes": 30,
#                 "practice": [
#                     "Solve 10 reasoning questions",
#                     "Review shortcuts and mistakes"
#                 ]
#             },

#             "english": {
#                 "topic": english_topic,
#                 "models": english_models,
#                 "minutes": 20,
#                 "task": "Practice the selected English concepts and communication."
#             },

#             "interview": {
#                 "topic": interview_topic,
#                 "models": interview_models,
#                 "minutes": 20,
#                 "task": "Practice relevant interview questions and speak answers aloud."
#             }
#         }

#         all_days.append(day)

#     # -----------------------------------------------------
#     # SPLIT INTO 8 WEEKS
#     # -----------------------------------------------------

#     roadmap = []

#     for week_number in range(1, 9):

#         start_index = (week_number - 1) * 7
#         end_index = start_index + 7

#         week_days = all_days[
#             start_index:end_index
#         ]

#         if week_number == 1:
#             focus = "Foundation and basic concepts"

#         elif week_number == 2:
#             focus = "Core concepts and beginner practice"

#         elif week_number == 3:
#             focus = "Intermediate concepts and problem solving"

#         elif week_number == 4:
#             focus = "Technical and aptitude practice"

#         elif week_number == 5:
#             focus = "Advanced practice and interview preparation"

#         elif week_number == 6:
#             focus = "Mixed practice and timed preparation"

#         elif week_number == 7:
#             focus = "Revision, weak areas and mock tests"

#         else:
#             focus = "Final revision, coding and mock interviews"

#         roadmap.append({
#             "week": week_number,
#             "focus": focus,
#             "days": week_days
#         })

#     return roadmap


# # =========================================================
# # VALIDATE 8 WEEKS / 56 DAYS
# # =========================================================

# def validate_roadmap(roadmap):

#     if not isinstance(roadmap, list):
#         raise ValueError(
#             "Roadmap must be a list."
#         )

#     if len(roadmap) != 8:
#         raise ValueError(
#             "Roadmap must contain exactly 8 weeks."
#         )

#     expected_day = 1

#     for week_index, week in enumerate(
#         roadmap,
#         start=1
#     ):

#         if week.get("week") != week_index:
#             raise ValueError(
#                 f"Invalid week number: {week_index}"
#             )

#         days = week.get("days", [])

#         if len(days) != 7:
#             raise ValueError(
#                 f"Week {week_index} must contain exactly 7 days."
#             )

#         for day in days:

#             if day.get("day") != expected_day:
#                 raise ValueError(
#                     f"Invalid day number. Expected Day {expected_day}."
#                 )

#             expected_day += 1

#     if expected_day != 57:
#         raise ValueError(
#             "Roadmap must contain exactly 56 days."
#         )

#     return True


# # =========================================================
# # GENERATE AI ANALYSIS
# # =========================================================

# def generate_analysis(job_description: str):

#     prompt = f"""
# You are an expert AI Career and Placement Assistant.

# Analyze the following job description for a final-year engineering student.

# JOB DESCRIPTION:

# {job_description}

# Create a detailed but structured career preparation analysis.

# IMPORTANT:

# The job description is the primary source.

# Identify:

# 1. Job title
# 2. Company
# 3. Location
# 4. Job type
# 5. Eligibility
# 6. Responsibilities
# 7. Interview process
# 8. Skills required
# 9. Technical syllabus
# 10. Aptitude syllabus
# 11. Reasoning syllabus
# 12. English syllabus
# 13. Interview syllabus
# 14. Technical interview questions
# 15. HR questions
# 16. Project questions
# 17. Communication practice

# For every syllabus topic provide ALL important models.

# Do not limit a topic to only two models.

# Only include technologies relevant to the job description.

# The student is a beginner/final-year engineering student.

# Return ONLY valid JSON.

# Do not use Markdown.

# Do not use code fences.

# Use exactly this structure:

# {{
#   "job_overview": {{
#     "job_title": "",
#     "company": "",
#     "location": "",
#     "job_type": "",
#     "eligibility": [],
#     "responsibilities": [],
#     "interview_process": []
#   }},

#   "skills_to_prepare": [
#     {{
#       "skill": "",
#       "priority": "HIGH",
#       "reason": ""
#     }}
#   ],

#   "complete_syllabus": {{
#     "technical": [
#       {{
#         "topic": "",
#         "models": []
#       }}
#     ],

#     "aptitude": [
#       {{
#         "topic": "",
#         "models": []
#       }}
#     ],

#     "reasoning": [
#       {{
#         "topic": "",
#         "models": []
#       }}
#     ],

#     "english": [
#       {{
#         "topic": "",
#         "models": []
#       }}
#     ],

#     "interview": [
#       {{
#         "topic": "",
#         "models": []
#       }}
#     ]
#   }},

#   "daily_time_allocation": {{
#     "technical_minutes": 60,
#     "aptitude_minutes": 30,
#     "reasoning_minutes": 30,
#     "english_minutes": 20,
#     "interview_minutes": 20,
#     "total_minutes": 160
#   }},

#   "daily_practice_system": {{
#     "technical": [],
#     "aptitude": [],
#     "reasoning": [],
#     "english": [],
#     "interview": []
#   }},

#   "interview_preparation": {{
#     "technical_questions": [],
#     "hr_questions": [],
#     "project_questions": [],
#     "communication_practice": []
#   }}
# }}
# """

#     try:

#         response = gemini_client.models.generate_content(
#             model=GEMINI_MODEL,
#             contents=prompt,
#             config=genai.types.GenerateContentConfig(
#                 response_mime_type="application/json"
#             )
#         )

#         raw_text = response.text

#         if not raw_text:
#             raise ValueError(
#                 "Gemini returned an empty response."
#             )

#         raw_text = clean_json_response(
#             raw_text
#         )

#         analysis = json.loads(
#             raw_text
#         )

#         if not isinstance(
#             analysis,
#             dict
#         ):
#             raise ValueError(
#                 "Gemini response is not a JSON object."
#             )

#         # -------------------------------------------------
#         # CREATE ROADMAP IN PYTHON
#         # -------------------------------------------------

#         roadmap = create_56_day_roadmap(
#             analysis
#         )

#         validate_roadmap(
#             roadmap
#         )

#         analysis[
#             "eight_week_roadmap"
#         ] = roadmap

#         return analysis

#     except json.JSONDecodeError as error:

#         raise HTTPException(
#             status_code=500,
#             detail=(
#                 "Gemini returned invalid JSON. "
#                 f"JSON error: {str(error)}"
#             )
#         )

#     except HTTPException:
#         raise

#     except Exception as error:

#         raise HTTPException(
#             status_code=500,
#             detail=(
#                 f"Gemini analysis failed: {str(error)}"
#             )
#         )


# # =========================================================
# # ANALYZE JOB DESCRIPTION
# # =========================================================

# @router.post("/analyze")
# def analyze_job_description(
#     request: JDRequest,
#     current_user: User = Depends(
#         get_current_user
#     ),
#     db: Session = Depends(
#         get_db
#     ),
# ):

#     if not request.job_description.strip():

#         raise HTTPException(
#             status_code=400,
#             detail="Job description cannot be empty"
#         )

#     try:

#         # -------------------------------------------------
#         # GENERATE ANALYSIS
#         # -------------------------------------------------

#         analysis = generate_analysis(
#             request.job_description
#         )

#         # -------------------------------------------------
#         # FINAL ROADMAP CHECK
#         # -------------------------------------------------

#         validate_roadmap(
#             analysis[
#                 "eight_week_roadmap"
#             ]
#         )

#         # -------------------------------------------------
#         # SAVE TO DATABASE
#         # -------------------------------------------------

#         saved_jd = JobDescription(
#             user_id=current_user.id,
#             job_description=request.job_description,
#             ai_analysis=json.dumps(
#                 analysis
#             )
#         )

#         db.add(saved_jd)

#         db.commit()

#         db.refresh(
#             saved_jd
#         )

#         # -------------------------------------------------
#         # RETURN
#         # -------------------------------------------------

#         return {
#             "message": "Job description analyzed successfully",
#             "user_id": current_user.id,
#             "jd_id": saved_jd.id,
#             "analysis": analysis
#         }

#     except HTTPException:

#         db.rollback()

#         raise

#     except Exception as error:

#         db.rollback()

#         raise HTTPException(
#             status_code=500,
#             detail=(
#                 f"Gemini analysis failed: {str(error)}"
#             )
#         )


# # =========================================================
# # GET LATEST SAVED JD
# # =========================================================

# @router.get("/latest")
# def get_latest_job_description(
#     current_user: User = Depends(
#         get_current_user
#     ),
#     db: Session = Depends(
#         get_db
#     ),
# ):

#     saved_jd = (
#         db.query(JobDescription)
#         .filter(
#             JobDescription.user_id
#             == current_user.id
#         )
#         .order_by(
#             JobDescription.id.desc()
#         )
#         .first()
#     )

#     if not saved_jd:

#         return {
#             "message": "No saved job description found",
#             "job_description": "",
#             "analysis": None
#         }

#     try:

#         analysis = json.loads(
#             saved_jd.ai_analysis
#         )

#     except json.JSONDecodeError:

#         analysis = None

#     return {
#         "message": "Latest job description retrieved successfully",
#         "jd_id": saved_jd.id,
#         "job_description": saved_jd.job_description,
#         "analysis": analysis
#     }


from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from google import genai
import os
import json
import math

from app.database import SessionLocal
from app.models import User, JobDescription
from app.routers.auth import get_current_user


load_dotenv(override=True)


router = APIRouter(
    prefix="/api/v1/jd",
    tags=["Job Description Analyzer"],
)


# =========================================================
# DATABASE
# =========================================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# =========================================================
# GEMINI
# =========================================================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not configured")


gemini_client = genai.Client(
    api_key=GEMINI_API_KEY
)

GEMINI_MODEL = "gemini-3.5-flash-lite"


# =========================================================
# REQUEST MODEL
# =========================================================

class JDRequest(BaseModel):
    job_description: str


# =========================================================
# CLEAN GEMINI JSON
# =========================================================

def clean_json_response(raw_text: str) -> str:

    raw_text = raw_text.strip()

    if raw_text.startswith("```json"):
        raw_text = raw_text[7:].strip()

    elif raw_text.startswith("```"):
        raw_text = raw_text[3:].strip()

    if raw_text.endswith("```"):
        raw_text = raw_text[:-3].strip()

    return raw_text


# =========================================================
# SAFE HELPERS
# =========================================================

def safe_list(value):

    if isinstance(value, list):
        return value

    return []


def safe_string(value, default=""):

    if isinstance(value, str):
        return value.strip()

    return default


# =========================================================
# NORMALIZE TECHNICAL SYLLABUS
# =========================================================

def normalize_technical_syllabus(technical):

    normalized = []

    for course_item in safe_list(technical):

        # -------------------------------------------------
        # NEW FORMAT
        #
        # {
        #   "course": "Python",
        #   "topics": [
        #       {
        #           "topic": "Variables",
        #           "models": [...]
        #       }
        #   ]
        # }
        # -------------------------------------------------

        if isinstance(course_item, dict) and "course" in course_item:

            course_name = safe_string(
                course_item.get("course"),
                "Technical Course"
            )

            topics = safe_list(
                course_item.get("topics")
            )

            clean_topics = []

            for topic_item in topics:

                if not isinstance(topic_item, dict):
                    continue

                topic_name = safe_string(
                    topic_item.get("topic"),
                    "Important Topic"
                )

                models = safe_list(
                    topic_item.get("models")
                )

                models = [
                    str(model).strip()
                    for model in models
                    if str(model).strip()
                ]

                if not models:
                    models = [
                        topic_name
                    ]

                clean_topics.append({
                    "topic": topic_name,
                    "models": models
                })

            if clean_topics:

                normalized.append({
                    "course": course_name,
                    "topics": clean_topics
                })

        # -------------------------------------------------
        # OLD FORMAT SUPPORT
        #
        # {
        #   "topic": "Python",
        #   "models": [...]
        # }
        #
        # This keeps older Gemini responses working.
        # -------------------------------------------------

        elif isinstance(course_item, dict):

            topic_name = safe_string(
                course_item.get("topic"),
                "Technical Preparation"
            )

            models = safe_list(
                course_item.get("models")
            )

            models = [
                str(model).strip()
                for model in models
                if str(model).strip()
            ]

            if not models:
                models = [
                    topic_name
                ]

            normalized.append({
                "course": topic_name,
                "topics": [
                    {
                        "topic": topic_name,
                        "models": models
                    }
                ]
            })

    return normalized


# =========================================================
# NORMALIZE GENERAL SYLLABUS
# =========================================================

def normalize_general_syllabus(items, default_topic):

    normalized = []

    for item in safe_list(items):

        if not isinstance(item, dict):
            continue

        topic = safe_string(
            item.get("topic"),
            default_topic
        )

        models = safe_list(
            item.get("models")
        )

        models = [
            str(model).strip()
            for model in models
            if str(model).strip()
        ]

        if not models:
            models = [
                topic
            ]

        normalized.append({
            "topic": topic,
            "models": models
        })

    return normalized


# =========================================================
# CREATE FALLBACK SYLLABUS
# =========================================================

def apply_syllabus_fallbacks(analysis):

    syllabus = analysis.setdefault(
        "complete_syllabus",
        {}
    )

    # -----------------------------------------------------
    # TECHNICAL
    # -----------------------------------------------------

    technical = normalize_technical_syllabus(
        syllabus.get("technical")
    )

    if not technical:

        technical = [
            {
                "course": "Python",
                "topics": [
                    {
                        "topic": "Programming Basics",
                        "models": [
                            "variables",
                            "data types",
                            "input and output",
                            "operators"
                        ]
                    },
                    {
                        "topic": "Control Flow",
                        "models": [
                            "if",
                            "if-else",
                            "elif",
                            "for loop",
                            "while loop"
                        ]
                    },
                    {
                        "topic": "Data Structures",
                        "models": [
                            "strings",
                            "lists",
                            "tuples",
                            "sets",
                            "dictionaries"
                        ]
                    },
                    {
                        "topic": "Functions",
                        "models": [
                            "function definition",
                            "parameters",
                            "return values",
                            "default arguments"
                        ]
                    },
                    {
                        "topic": "OOP",
                        "models": [
                            "class",
                            "object",
                            "inheritance",
                            "polymorphism",
                            "encapsulation"
                        ]
                    }
                ]
            }
        ]

    syllabus["technical"] = technical

    # -----------------------------------------------------
    # APTITUDE
    # -----------------------------------------------------

    aptitude = normalize_general_syllabus(
        syllabus.get("aptitude"),
        "Quantitative Aptitude"
    )

    if not aptitude:

        aptitude = [
            {
                "topic": "Percentages",
                "models": [
                    "basic percentage",
                    "percentage conversion",
                    "percentage increase",
                    "percentage decrease",
                    "successive percentage",
                    "reverse percentage",
                    "percentage comparison"
                ]
            },
            {
                "topic": "Ratio and Proportion",
                "models": [
                    "basic ratio",
                    "ratio comparison",
                    "equivalent ratios",
                    "direct proportion",
                    "inverse proportion",
                    "compound ratio"
                ]
            },
            {
                "topic": "Averages",
                "models": [
                    "basic average",
                    "average of numbers",
                    "missing value",
                    "weighted average",
                    "combined average"
                ]
            },
            {
                "topic": "Profit and Loss",
                "models": [
                    "cost price and selling price",
                    "profit percentage",
                    "loss percentage",
                    "marked price",
                    "discount",
                    "successive discount"
                ]
            },
            {
                "topic": "Simple and Compound Interest",
                "models": [
                    "simple interest",
                    "amount calculation",
                    "compound interest",
                    "annual compounding",
                    "half-yearly compounding",
                    "difference between SI and CI"
                ]
            },
            {
                "topic": "Time, Speed and Distance",
                "models": [
                    "basic speed",
                    "distance calculation",
                    "time calculation",
                    "relative speed",
                    "average speed",
                    "trains",
                    "boats and streams"
                ]
            },
            {
                "topic": "Time and Work",
                "models": [
                    "basic work problems",
                    "work efficiency",
                    "combined work",
                    "men and work",
                    "pipes and cisterns"
                ]
            }
        ]

    syllabus["aptitude"] = aptitude

    # -----------------------------------------------------
    # DATA INTERPRETATION
    # -----------------------------------------------------

    data_interpretation = normalize_general_syllabus(
        syllabus.get("data_interpretation"),
        "Data Interpretation"
    )

    if not data_interpretation:

        data_interpretation = [
            {
                "topic": "Tabular Charts",
                "models": [
                    "total",
                    "difference",
                    "ratio",
                    "percentage",
                    "average"
                ]
            },
            {
                "topic": "Bar Graphs",
                "models": [
                    "simple bar graph",
                    "double bar graph",
                    "multiple bar graph",
                    "comparison questions",
                    "percentage questions"
                ]
            },
            {
                "topic": "Pie Charts",
                "models": [
                    "basic pie chart",
                    "percentage conversion",
                    "sector comparison",
                    "ratio questions",
                    "total value questions"
                ]
            },
            {
                "topic": "Line Graphs",
                "models": [
                    "single line graph",
                    "comparison",
                    "increase and decrease",
                    "trend analysis",
                    "percentage change"
                ]
            }
        ]

    syllabus["data_interpretation"] = data_interpretation

    # -----------------------------------------------------
    # REASONING
    # -----------------------------------------------------

    reasoning = normalize_general_syllabus(
        syllabus.get("reasoning"),
        "Logical Reasoning"
    )

    if not reasoning:

        reasoning = [
            {
                "topic": "Number Series",
                "models": [
                    "addition pattern",
                    "subtraction pattern",
                    "multiplication pattern",
                    "division pattern",
                    "mixed pattern"
                ]
            },
            {
                "topic": "Coding-Decoding",
                "models": [
                    "letter coding",
                    "number coding",
                    "substitution coding",
                    "reverse coding",
                    "mixed coding"
                ]
            },
            {
                "topic": "Blood Relations",
                "models": [
                    "direct relation",
                    "family tree",
                    "coded blood relation",
                    "generation-based questions"
                ]
            },
            {
                "topic": "Directions",
                "models": [
                    "basic directions",
                    "distance-based directions",
                    "turning questions",
                    "shortest distance",
                    "direction sense"
                ]
            },
            {
                "topic": "Seating Arrangement",
                "models": [
                    "linear arrangement",
                    "circular arrangement",
                    "facing north",
                    "facing south",
                    "mixed arrangement"
                ]
            },
            {
                "topic": "Syllogisms",
                "models": [
                    "basic syllogism",
                    "Venn diagram method",
                    "possibility cases",
                    "conclusion-based questions"
                ]
            }
        ]

    syllabus["reasoning"] = reasoning

    # -----------------------------------------------------
    # ENGLISH
    # -----------------------------------------------------

    english = normalize_general_syllabus(
        syllabus.get("english"),
        "English"
    )

    if not english:

        english = [
            {
                "topic": "Grammar",
                "models": [
                    "parts of speech",
                    "tenses",
                    "articles",
                    "prepositions",
                    "subject-verb agreement"
                ]
            },
            {
                "topic": "Vocabulary",
                "models": [
                    "synonyms",
                    "antonyms",
                    "word meanings",
                    "contextual vocabulary"
                ]
            },
            {
                "topic": "Sentence Correction",
                "models": [
                    "grammar errors",
                    "tense errors",
                    "article errors",
                    "preposition errors"
                ]
            },
            {
                "topic": "Reading Comprehension",
                "models": [
                    "main idea",
                    "specific information",
                    "inference",
                    "vocabulary in context"
                ]
            },
            {
                "topic": "Communication",
                "models": [
                    "self introduction",
                    "speaking practice",
                    "professional communication",
                    "group discussion"
                ]
            }
        ]

    syllabus["english"] = english

    # -----------------------------------------------------
    # INTERVIEW
    # -----------------------------------------------------

    interview = normalize_general_syllabus(
        syllabus.get("interview"),
        "Interview Preparation"
    )

    if not interview:

        interview = [
            {
                "topic": "Self Introduction",
                "models": [
                    "personal introduction",
                    "education",
                    "skills",
                    "career goals"
                ]
            },
            {
                "topic": "Resume Questions",
                "models": [
                    "resume explanation",
                    "skills explanation",
                    "certificates",
                    "strengths and weaknesses"
                ]
            },
            {
                "topic": "Project Questions",
                "models": [
                    "project introduction",
                    "technologies used",
                    "role in project",
                    "challenges",
                    "future improvements"
                ]
            },
            {
                "topic": "HR Questions",
                "models": [
                    "tell me about yourself",
                    "why should we hire you",
                    "why this company",
                    "short-term goals",
                    "long-term goals"
                ]
            }
        ]

    syllabus["interview"] = interview

    return analysis


# =========================================================
# FLATTEN TECHNICAL TOPICS FOR ROADMAP
# =========================================================

def flatten_technical_topics(technical):

    flattened = []

    for course in safe_list(technical):

        course_name = safe_string(
            course.get("course"),
            "Technical"
        )

        topics = safe_list(
            course.get("topics")
        )

        for topic_item in topics:

            topic_name = safe_string(
                topic_item.get("topic"),
                "Technical Topic"
            )

            models = safe_list(
                topic_item.get("models")
            )

            models = [
                str(model).strip()
                for model in models
                if str(model).strip()
            ]

            if not models:
                models = [
                    topic_name
                ]

            flattened.append({
                "course": course_name,
                "topic": topic_name,
                "models": models
            })

    return flattened


# =========================================================
# CREATE 56-DAY ROADMAP
# =========================================================

def create_56_day_roadmap(analysis):

    syllabus = analysis.get(
        "complete_syllabus",
        {}
    )

    technical = flatten_technical_topics(
        syllabus.get("technical", [])
    )

    aptitude = normalize_general_syllabus(
        syllabus.get("aptitude"),
        "Quantitative Aptitude"
    )

    data_interpretation = normalize_general_syllabus(
        syllabus.get("data_interpretation"),
        "Data Interpretation"
    )

    reasoning = normalize_general_syllabus(
        syllabus.get("reasoning"),
        "Logical Reasoning"
    )

    english = normalize_general_syllabus(
        syllabus.get("english"),
        "English"
    )

    interview = normalize_general_syllabus(
        syllabus.get("interview"),
        "Interview Preparation"
    )

    # -----------------------------------------------------
    # SAFETY FALLBACK
    # -----------------------------------------------------

    if not technical:
        technical = [
            {
                "course": "Programming",
                "topic": "Programming Basics",
                "models": [
                    "variables",
                    "data types",
                    "operators",
                    "conditions",
                    "loops"
                ]
            }
        ]

    if not aptitude:
        aptitude = [
            {
                "topic": "Percentages",
                "models": [
                    "basic percentage",
                    "increase",
                    "decrease",
                    "successive percentage"
                ]
            }
        ]

    if not data_interpretation:
        data_interpretation = [
            {
                "topic": "Tabular Charts",
                "models": [
                    "total",
                    "difference",
                    "ratio",
                    "percentage"
                ]
            }
        ]

    if not reasoning:
        reasoning = [
            {
                "topic": "Number Series",
                "models": [
                    "addition",
                    "subtraction",
                    "multiplication",
                    "mixed pattern"
                ]
            }
        ]

    if not english:
        english = [
            {
                "topic": "Grammar",
                "models": [
                    "tenses",
                    "articles",
                    "prepositions"
                ]
            }
        ]

    if not interview:
        interview = [
            {
                "topic": "Self Introduction",
                "models": [
                    "personal introduction",
                    "education",
                    "skills",
                    "career goals"
                ]
            }
        ]

    # -----------------------------------------------------
    # HELPER
    # -----------------------------------------------------

    def get_item(items, index):

        return items[index % len(items)]

    # -----------------------------------------------------
    # CREATE 56 DAYS
    # -----------------------------------------------------

    all_days = []

    for day_number in range(1, 57):

        technical_item = get_item(
            technical,
            day_number - 1
        )

        aptitude_item = get_item(
            aptitude,
            day_number - 1
        )

        di_item = get_item(
            data_interpretation,
            day_number - 1
        )

        reasoning_item = get_item(
            reasoning,
            day_number - 1
        )

        english_item = get_item(
            english,
            day_number - 1
        )

        interview_item = get_item(
            interview,
            day_number - 1
        )

        # -------------------------------------------------
        # WEEKLY REVISION DAYS
        # -------------------------------------------------

        if day_number in [7, 14, 21, 28, 35, 42, 49]:

            technical_data = {
                "course": "Technical Revision",
                "topic": "Weekly Technical Revision",
                "models": [
                    "Revise all technical topics studied this week",
                    "Practice previously learned coding problems"
                ],
                "minutes": 60,
                "practice": [
                    "Revise concepts",
                    "Solve coding problems",
                    "Review mistakes"
                ]
            }

            aptitude_data = {
                "topic": "Aptitude Revision",
                "models": [
                    "Revise all aptitude models studied this week"
                ],
                "minutes": 30,
                "practice": [
                    "Solve mixed aptitude questions",
                    "Review shortcuts"
                ]
            }

            di_data = {
                "topic": "Data Interpretation Revision",
                "models": [
                    "Revise all DI models studied this week"
                ],
                "minutes": 20,
                "practice": [
                    "Solve mixed DI questions"
                ]
            }

            reasoning_data = {
                "topic": "Reasoning Revision",
                "models": [
                    "Revise all reasoning models studied this week"
                ],
                "minutes": 30,
                "practice": [
                    "Solve mixed reasoning questions",
                    "Review shortcuts"
                ]
            }

            english_data = {
                "topic": "English Revision",
                "models": [
                    "Revise grammar and vocabulary"
                ],
                "minutes": 20,
                "practice": [
                    "Read and speak aloud",
                    "Review mistakes"
                ]
            }

            interview_data = {
                "topic": "Interview Revision",
                "models": [
                    "Revise previously prepared interview questions"
                ],
                "minutes": 20,
                "practice": [
                    "Speak answers aloud",
                    "Review important questions"
                ]
            }

        # -------------------------------------------------
        # FINAL DAY
        # -------------------------------------------------

        elif day_number == 56:

            technical_data = {
                "course": "All Technical Courses",
                "topic": "Final Technical Mock",
                "models": [
                    "Mixed coding problems",
                    "Core technical concepts",
                    "Technical interview questions"
                ],
                "minutes": 60,
                "practice": [
                    "Solve a mixed coding test",
                    "Answer technical interview questions"
                ]
            }

            aptitude_data = {
                "topic": "Full Aptitude Mock",
                "models": [
                    "Percentages",
                    "Ratio and Proportion",
                    "Averages",
                    "Profit and Loss",
                    "Interest",
                    "Time and Work",
                    "Time Speed and Distance"
                ],
                "minutes": 30,
                "practice": [
                    "Take a timed aptitude test"
                ]
            }

            di_data = {
                "topic": "Full DI Mock",
                "models": [
                    "Tables",
                    "Bar Graphs",
                    "Pie Charts",
                    "Line Graphs"
                ],
                "minutes": 20,
                "practice": [
                    "Take a timed DI test"
                ]
            }

            reasoning_data = {
                "topic": "Full Reasoning Mock",
                "models": [
                    "Mixed reasoning models"
                ],
                "minutes": 30,
                "practice": [
                    "Take a timed reasoning test"
                ]
            }

            english_data = {
                "topic": "Final English Practice",
                "models": [
                    "Grammar",
                    "Vocabulary",
                    "Reading",
                    "Communication"
                ],
                "minutes": 20,
                "practice": [
                    "Speak answers aloud",
                    "Practice communication"
                ]
            }

            interview_data = {
                "topic": "Final Mock Interview",
                "models": [
                    "Technical interview",
                    "HR interview",
                    "Project explanation",
                    "Self introduction"
                ],
                "minutes": 20,
                "practice": [
                    "Complete one mock interview"
                ]
            }

        # -------------------------------------------------
        # NORMAL STUDY DAY
        # -------------------------------------------------

        else:

            technical_data = {
                "course": technical_item["course"],
                "topic": technical_item["topic"],
                "models": technical_item["models"],
                "minutes": 60,
                "practice": [
                    "Study the selected concepts",
                    "Solve 2 coding problems",
                    "Revise important concepts"
                ]
            }

            aptitude_data = {
                "topic": aptitude_item["topic"],
                "models": aptitude_item["models"],
                "minutes": 30,
                "practice": [
                    "Study the selected models",
                    "Solve 10 questions",
                    "Review incorrect answers"
                ]
            }

            di_data = {
                "topic": di_item["topic"],
                "models": di_item["models"],
                "minutes": 20,
                "practice": [
                    "Study the selected DI models",
                    "Solve practice questions"
                ]
            }

            reasoning_data = {
                "topic": reasoning_item["topic"],
                "models": reasoning_item["models"],
                "minutes": 30,
                "practice": [
                    "Study the selected models",
                    "Solve 10 questions",
                    "Review shortcuts"
                ]
            }

            english_data = {
                "topic": english_item["topic"],
                "models": english_item["models"],
                "minutes": 20,
                "practice": [
                    "Practice the selected concepts",
                    "Speak answers aloud"
                ]
            }

            interview_data = {
                "topic": interview_item["topic"],
                "models": interview_item["models"],
                "minutes": 20,
                "practice": [
                    "Practice relevant interview questions",
                    "Speak answers aloud"
                ]
            }

        # -------------------------------------------------
        # DAY OBJECT
        # -------------------------------------------------

        day = {
            "day": day_number,

            "technical": technical_data,

            "aptitude": aptitude_data,

            "data_interpretation": di_data,

            "reasoning": reasoning_data,

            "english": english_data,

            "interview": interview_data
        }

        all_days.append(day)

    # -----------------------------------------------------
    # SPLIT INTO 8 WEEKS
    # -----------------------------------------------------

    roadmap = []

    weekly_focus = {
        1: "Foundation and basic concepts",
        2: "Core concepts and beginner practice",
        3: "Intermediate concepts and problem solving",
        4: "Technical and aptitude practice",
        5: "Advanced practice and interview preparation",
        6: "Mixed practice and timed preparation",
        7: "Revision, weak areas and mock tests",
        8: "Final revision, coding and mock interviews"
    }

    for week_number in range(1, 9):

        start_index = (week_number - 1) * 7
        end_index = start_index + 7

        roadmap.append({
            "week": week_number,
            "focus": weekly_focus[week_number],
            "days": all_days[
                start_index:end_index
            ]
        })

    return roadmap


# =========================================================
# VALIDATE 8 WEEKS / 56 DAYS
# =========================================================

def validate_roadmap(roadmap):

    if not isinstance(roadmap, list):
        raise ValueError(
            "Roadmap must be a list."
        )

    if len(roadmap) != 8:
        raise ValueError(
            "Roadmap must contain exactly 8 weeks."
        )

    expected_day = 1

    for week_index, week in enumerate(
        roadmap,
        start=1
    ):

        if week.get("week") != week_index:
            raise ValueError(
                f"Invalid week number: {week_index}"
            )

        days = week.get("days", [])

        if len(days) != 7:
            raise ValueError(
                f"Week {week_index} must contain exactly 7 days."
            )

        for day in days:

            if day.get("day") != expected_day:
                raise ValueError(
                    f"Invalid day number. Expected Day {expected_day}."
                )

            expected_day += 1

    if expected_day != 57:
        raise ValueError(
            "Roadmap must contain exactly 56 days."
        )

    return True


# =========================================================
# GENERATE AI ANALYSIS
# =========================================================

def generate_analysis(job_description: str):

    prompt = f"""
You are an expert AI Career and Placement Assistant.

Analyze the following job description for a final-year engineering student.

JOB DESCRIPTION:

{job_description}

The job description is the PRIMARY source.

Create a detailed, realistic and beginner-friendly career preparation plan.

=========================================================
IMPORTANT SYLLABUS RULE
=========================================================

Do NOT give only 2 or 3 models for a topic.

For EVERY topic, identify ALL important and commonly asked
models that a placement candidate should practice.

The syllabus must be comprehensive but relevant to the job.

Do not include unrelated technologies.

=========================================================
TECHNICAL SYLLABUS FORMAT
=========================================================

Technical must follow:

Technical
    -> Course
        -> Topics
            -> Models

Example:

"technical": [
  {{
    "course": "Python",
    "topics": [
      {{
        "topic": "Variables and Data Types",
        "models": [
          "variable declaration",
          "integer",
          "float",
          "string",
          "boolean",
          "type conversion"
        ]
      }},
      {{
        "topic": "Control Flow",
        "models": [
          "if",
          "if-else",
          "elif",
          "for loop",
          "while loop",
          "nested loops"
        ]
      }}
    ]
  }}
]

If the job requires Java, include Java.

If the job requires Python, include Python.

If the job requires SQL, include SQL.

If the job requires web development, include relevant
HTML, CSS and JavaScript topics.

Only include courses relevant to the job description.

=========================================================
QUANTITATIVE APTITUDE FORMAT
=========================================================

Aptitude must follow:

Topic
    -> ALL models

Example:

"aptitude": [
  {{
    "topic": "Percentages",
    "models": [
      "basic percentage",
      "percentage conversion",
      "percentage increase",
      "percentage decrease",
      "successive percentage",
      "reverse percentage",
      "percentage comparison"
    ]
  }}
]

Include all important placement models for topics such as:

Percentages
Ratio and Proportion
Averages
Profit and Loss
Simple and Compound Interest
Time, Speed and Distance
Time and Work
and other relevant quantitative topics.

=========================================================
DATA INTERPRETATION
=========================================================

Include:

Tabular Charts
Bar Graphs
Pie Charts
Line Graphs

For each one provide ALL important question models.

=========================================================
REASONING FORMAT
=========================================================

Reasoning must follow:

Topic
    -> ALL models

Include relevant topics such as:

Number Series
Coding-Decoding
Blood Relations
Directions
Seating Arrangement
Syllogisms
Analogy
Classification
Odd One Out
Alphabet Series
Statement and Conclusions
Data Sufficiency
and other relevant placement reasoning topics.

For every topic provide all important models.

=========================================================
ENGLISH
=========================================================

Include relevant:

Grammar
Vocabulary
Sentence Correction
Reading Comprehension
Communication
Group Discussion
and other relevant placement English topics.

For each topic provide important models/types.

=========================================================
INTERVIEW
=========================================================

Include:

Self Introduction
Resume Questions
Technical Questions
Project Questions
HR Questions
Communication Practice

=========================================================
OUTPUT
=========================================================

Return ONLY valid JSON.

Do NOT use Markdown.

Do NOT use code fences.

Use exactly this structure:

{{
  "job_overview": {{
    "job_title": "",
    "company": "",
    "location": "",
    "job_type": "",
    "eligibility": [],
    "responsibilities": [],
    "interview_process": []
  }},

  "skills_to_prepare": [
    {{
      "skill": "",
      "priority": "HIGH",
      "reason": ""
    }}
  ],

  "complete_syllabus": {{

    "technical": [
      {{
        "course": "",
        "topics": [
          {{
            "topic": "",
            "models": []
          }}
        ]
      }}
    ],

    "aptitude": [
      {{
        "topic": "",
        "models": []
      }}
    ],

    "data_interpretation": [
      {{
        "topic": "",
        "models": []
      }}
    ],

    "reasoning": [
      {{
        "topic": "",
        "models": []
      }}
    ],

    "english": [
      {{
        "topic": "",
        "models": []
      }}
    ],

    "interview": [
      {{
        "topic": "",
        "models": []
      }}
    ]
  }},

  "daily_time_allocation": {{
    "technical_minutes": 60,
    "aptitude_minutes": 30,
    "data_interpretation_minutes": 20,
    "reasoning_minutes": 30,
    "english_minutes": 20,
    "interview_minutes": 20,
    "total_minutes": 180
  }},

  "daily_practice_system": {{
    "technical": [],
    "aptitude": [],
    "data_interpretation": [],
    "reasoning": [],
    "english": [],
    "interview": []
  }},

  "interview_preparation": {{
    "technical_questions": [],
    "hr_questions": [],
    "project_questions": [],
    "communication_practice": []
  }}
}}
"""

    try:

        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )

        raw_text = response.text

        if not raw_text:
            raise ValueError(
                "Gemini returned an empty response."
            )

        raw_text = clean_json_response(
            raw_text
        )

        analysis = json.loads(
            raw_text
        )

        if not isinstance(
            analysis,
            dict
        ):
            raise ValueError(
                "Gemini response is not a JSON object."
            )

        # -------------------------------------------------
        # NORMALIZE SYLLABUS
        # -------------------------------------------------

        analysis = apply_syllabus_fallbacks(
            analysis
        )

        # -------------------------------------------------
        # CREATE 56-DAY ROADMAP
        # -------------------------------------------------

        roadmap = create_56_day_roadmap(
            analysis
        )

        validate_roadmap(
            roadmap
        )

        analysis[
            "eight_week_roadmap"
        ] = roadmap

        return analysis

    except json.JSONDecodeError as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "Gemini returned invalid JSON. "
                f"JSON error: {str(error)}"
            )
        )

    except HTTPException:
        raise

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Gemini analysis failed: {str(error)}"
            )
        )


# =========================================================
# ANALYZE JOB DESCRIPTION
# =========================================================

@router.post("/analyze")
def analyze_job_description(
    request: JDRequest,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(
        get_db
    ),
):

    if not request.job_description.strip():

        raise HTTPException(
            status_code=400,
            detail="Job description cannot be empty"
        )

    try:

        # -------------------------------------------------
        # GENERATE ANALYSIS
        # -------------------------------------------------

        analysis = generate_analysis(
            request.job_description
        )

        # -------------------------------------------------
        # FINAL ROADMAP CHECK
        # -------------------------------------------------

        validate_roadmap(
            analysis[
                "eight_week_roadmap"
            ]
        )

        # -------------------------------------------------
        # SAVE TO DATABASE
        # -------------------------------------------------

        saved_jd = JobDescription(
            user_id=current_user.id,
            job_description=request.job_description,
            ai_analysis=json.dumps(
                analysis
            )
        )

        db.add(saved_jd)

        db.commit()

        db.refresh(
            saved_jd
        )

        # -------------------------------------------------
        # RETURN
        # -------------------------------------------------

        return {
            "message": "Job description analyzed successfully",
            "user_id": current_user.id,
            "jd_id": saved_jd.id,
            "analysis": analysis
        }

    except HTTPException:

        db.rollback()

        raise

    except Exception as error:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Gemini analysis failed: {str(error)}"
            )
        )


# =========================================================
# GET LATEST SAVED JD
# =========================================================

@router.get("/latest")
def get_latest_job_description(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(
        get_db
    ),
):

    saved_jd = (
        db.query(JobDescription)
        .filter(
            JobDescription.user_id
            == current_user.id
        )
        .order_by(
            JobDescription.id.desc()
        )
        .first()
    )

    if not saved_jd:

        return {
            "message": "No saved job description found",
            "job_description": "",
            "analysis": None
        }

    try:

        analysis = json.loads(
            saved_jd.ai_analysis
        )

    except json.JSONDecodeError:

        analysis = None

    return {
        "message": "Latest job description retrieved successfully",
        "jd_id": saved_jd.id,
        "job_description": saved_jd.job_description,
        "analysis": analysis
    }