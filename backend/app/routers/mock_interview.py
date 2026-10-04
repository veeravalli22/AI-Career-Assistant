import json
import os
from datetime import datetime

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from google import genai
from pydantic import BaseModel

from app.database import get_db
from app.models import (
    Resume,
    JobDescription,
    CareerProfile,
    ModuleProgress,
)
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/api/v1/mock-interview",
    tags=["AI Mock Interview"],
)


load_dotenv(override=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not configured")

gemini_client = genai.Client(api_key=GEMINI_API_KEY)

GEMINI_MODEL = "gemini-3.5-flash-lite"


def parse_json_response(text: str):
    """
    Safely convert Gemini JSON response into Python dictionary.
    """

    text = text.strip()

    if text.startswith("```json"):
        text = text[7:]

    if text.startswith("```"):
        text = text[3:]

    if text.endswith("```"):
        text = text[:-3]

    text = text.strip()

    try:
        return json.loads(text)

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="AI returned an invalid response format.",
        )


# ============================================================
# START MOCK INTERVIEW
# ============================================================

@router.get("/start")
def start_mock_interview(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Start a personalized AI mock interview using:
    - Latest resume
    - Career profile
    - Latest job description
    """

    resume = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Please upload your resume before starting the mock interview.",
        )

    career_profile = (
        db.query(CareerProfile)
        .filter(CareerProfile.user_id == current_user.id)
        .first()
    )

    if not career_profile:
        raise HTTPException(
            status_code=404,
            detail="Please complete your career profile before starting the mock interview.",
        )

    job_description = (
        db.query(JobDescription)
        .filter(JobDescription.user_id == current_user.id)
        .order_by(JobDescription.created_at.desc())
        .first()
    )

    resume_analysis = {}

    try:
        resume_analysis = json.loads(resume.ai_analysis)

    except Exception:
        resume_analysis = {
            "raw_analysis": resume.ai_analysis
        }

    jd_text = ""
    jd_analysis = {}

    if job_description:
        jd_text = job_description.job_description

        try:
            jd_analysis = json.loads(job_description.ai_analysis)

        except Exception:
            jd_analysis = {
                "raw_analysis": job_description.ai_analysis
            }

    prompt = f"""
You are an AI interviewer for a fresher-level job interview.

Create a personalized mock interview for this candidate.

IMPORTANT RULES:
1. Use only information supported by the candidate's resume, career profile,
   and job description.
2. Do NOT invent skills, projects, certifications, experience, achievements,
   or technologies.
3. The candidate is a fresher.
4. Target role must be based on the saved career profile.
5. Questions should be realistic for a fresher interview.
6. Mix technical, coding, SQL, project, role-specific, HR and behavioral
   questions.
7. Start with a simple introduction question.
8. Questions should gradually increase in difficulty.
9. Do not provide answers to the questions.
10. Return ONLY valid JSON.

CANDIDATE CAREER PROFILE:
Career Goal: {career_profile.career_goal}
Target Role: {career_profile.target_role}
Experience Level: {career_profile.experience_level}
Preferred Domain: {career_profile.preferred_domain}
Preferred Work Type: {career_profile.preferred_work_type}
Additional Goal: {career_profile.additional_goal}

RESUME:
{resume.extracted_text}

RESUME AI ANALYSIS:
{json.dumps(resume_analysis, indent=2)}

JOB DESCRIPTION:
{jd_text}

JOB DESCRIPTION AI ANALYSIS:
{json.dumps(jd_analysis, indent=2)}

Create exactly 10 interview questions.

Use this JSON structure:

{{
    "interview_title": "Personalized AI Mock Interview",
    "target_role": "string",
    "difficulty": "Beginner to Intermediate",
    "total_questions": 10,
    "instructions": [
        "Answer each question as if you are in a real interview.",
        "Keep answers clear and concise.",
        "For technical questions, explain your reasoning."
    ],
    "questions": [
        {{
            "question_number": 1,
            "category": "Introduction",
            "difficulty": "Beginner",
            "question": "string"
        }},
        {{
            "question_number": 2,
            "category": "Technical",
            "difficulty": "Beginner",
            "question": "string"
        }},
        {{
            "question_number": 3,
            "category": "Coding",
            "difficulty": "Beginner",
            "question": "string"
        }},
        {{
            "question_number": 4,
            "category": "SQL",
            "difficulty": "Beginner",
            "question": "string"
        }},
        {{
            "question_number": 5,
            "category": "Project",
            "difficulty": "Beginner",
            "question": "string"
        }},
        {{
            "question_number": 6,
            "category": "Role Specific",
            "difficulty": "Intermediate",
            "question": "string"
        }},
        {{
            "question_number": 7,
            "category": "Technical",
            "difficulty": "Intermediate",
            "question": "string"
        }},
        {{
            "question_number": 8,
            "category": "Behavioral",
            "difficulty": "Intermediate",
            "question": "string"
        }},
        {{
            "question_number": 9,
            "category": "HR",
            "difficulty": "Intermediate",
            "question": "string"
        }},
        {{
            "question_number": 10,
            "category": "Final",
            "difficulty": "Intermediate",
            "question": "string"
        }}
    ],
    "final_message": "string"
}}
"""

    try:
        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        )

        preparation = parse_json_response(response.text)

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate mock interview: {str(e)}",
        )

    return {
        "success": True,
        "message": "AI mock interview generated successfully.",
        "mock_interview": preparation,
    }


# ============================================================
# ANSWER EVALUATION
# ============================================================

class AnswerEvaluationRequest(BaseModel):
    question: str
    category: str
    answer: str


@router.post("/evaluate")
def evaluate_answer(
    request: AnswerEvaluationRequest,
    current_user=Depends(get_current_user),
):
    """
    Evaluate one interview answer.
    """

    if not request.answer.strip():
        raise HTTPException(
            status_code=400,
            detail="Please provide an answer before submitting.",
        )

    prompt = f"""
You are an AI interview evaluator.

Evaluate the candidate's answer for a fresher-level interview.

IMPORTANT RULES:
1. Evaluate only the answer provided.
2. Do not invent candidate experience or skills.
3. Be supportive and beginner-friendly.
4. Give practical feedback.
5. Return ONLY valid JSON.
6. Score the answer from 0 to 10.

Interview Category:
{request.category}

Interview Question:
{request.question}

Candidate Answer:
{request.answer}

Return exactly this JSON structure:

{{
    "score": 0,
    "rating": "Needs Improvement",
    "feedback": "string",
    "strengths": [
        "string"
    ],
    "missing_points": [
        "string"
    ],
    "improved_answer": "string",
    "communication_feedback": "string"
}}

Rating rules:
0-3 = Needs Improvement
4-6 = Average
7-8 = Good
9-10 = Excellent
"""

    try:
        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        )

        evaluation = parse_json_response(response.text)

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to evaluate answer: {str(e)}",
        )

    return {
        "success": True,
        "message": "Answer evaluated successfully.",
        "evaluation": evaluation,
    }


# ============================================================
# FINAL INTERVIEW REPORT
# ============================================================

class InterviewEvaluation(BaseModel):
    question_number: int
    category: str
    question: str
    answer: str
    score: float
    rating: str
    feedback: str
    strengths: list[str]
    missing_points: list[str]
    improved_answer: str
    communication_feedback: str


class FinalInterviewReportRequest(BaseModel):
    evaluations: list[InterviewEvaluation]


@router.post("/final-report")
def generate_final_report(
    request: FinalInterviewReportRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Generate the final AI mock interview report
    from all evaluated answers.
    """

    if not request.evaluations:
        raise HTTPException(
            status_code=400,
            detail="No interview evaluations were provided.",
        )

    if len(request.evaluations) < 10:
        raise HTTPException(
            status_code=400,
            detail="Please complete all 10 interview questions before generating the final report.",
        )

    # --------------------------------------------------------
    # Calculate basic scores
    # --------------------------------------------------------

    total_score = sum(
        float(item.score)
        for item in request.evaluations
    )

    average_score = total_score / len(request.evaluations)

    overall_score = round(
        (average_score / 10) * 100
    )

    # --------------------------------------------------------
    # Category scores
    # --------------------------------------------------------

    category_scores = {}

    for item in request.evaluations:

        category = item.category.strip()

        if category not in category_scores:
            category_scores[category] = []

        category_scores[category].append(
            float(item.score)
        )

    category_performance = {}

    for category, scores in category_scores.items():

        category_average = sum(scores) / len(scores)

        category_performance[category] = {
            "score": round(category_average, 1),
            "out_of": 10,
        }

    # --------------------------------------------------------
    # Prepare data for Gemini
    # --------------------------------------------------------

    evaluation_data = []

    for item in request.evaluations:

        evaluation_data.append(
            {
                "question_number": item.question_number,
                "category": item.category,
                "question": item.question,
                "answer": item.answer,
                "score": item.score,
                "rating": item.rating,
                "feedback": item.feedback,
                "strengths": item.strengths,
                "missing_points": item.missing_points,
                "communication_feedback": item.communication_feedback,
            }
        )

    prompt = f"""
You are an AI career and interview coach.

Create a final mock interview performance report for a fresher.

The candidate completed 10 interview questions.

IMPORTANT RULES:
1. Use ONLY the evaluation data provided below.
2. Do not invent skills, experience, projects or achievements.
3. Be supportive and practical.
4. Give realistic improvement suggestions.
5. Do not exaggerate the candidate's performance.
6. Return ONLY valid JSON.

BASIC SCORE:

Total Score: {total_score}
Average Score: {round(average_score, 2)}/10
Overall Score: {overall_score}/100

CATEGORY PERFORMANCE:

{json.dumps(category_performance, indent=2)}

INDIVIDUAL EVALUATIONS:

{json.dumps(evaluation_data, indent=2)}

Return exactly this JSON structure:

{{
    "report_title": "AI Mock Interview Final Report",

    "overall_score": {overall_score},

    "average_score": {round(average_score, 2)},

    "performance_summary": "string",

    "technical_performance": {{
        "score": 0,
        "summary": "string"
    }},

    "coding_performance": {{
        "score": 0,
        "summary": "string"
    }},

    "sql_performance": {{
        "score": 0,
        "summary": "string"
    }},

    "communication_performance": {{
        "score": 0,
        "summary": "string"
    }},

    "strengths": [
        "string",
        "string",
        "string"
    ],

    "weak_areas": [
        "string",
        "string",
        "string"
    ],

    "improvement_suggestions": [
        "string",
        "string",
        "string"
    ],

    "recommended_focus_topics": [
        "string",
        "string",
        "string"
    ],

    "interview_readiness": "string",

    "next_steps": [
        "string",
        "string",
        "string"
    ]
}}
"""

    try:

        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        )

        report = parse_json_response(response.text)

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate final interview report: {str(e)}",
        )

    # --------------------------------------------------------
    # Add calculated values from backend
    # --------------------------------------------------------

    report["overall_score"] = overall_score

    report["average_score"] = round(
        average_score,
        2,
    )

    report["category_performance"] = category_performance

    # --------------------------------------------------------
    # Mark AI Mock Interview as Completed
    # --------------------------------------------------------

    progress = (
        db.query(ModuleProgress)
        .filter(
            ModuleProgress.user_id == current_user.id,
            ModuleProgress.module_name == "mock_interview",
        )
        .first()
    )

    if not progress:
        progress = ModuleProgress(
            user_id=current_user.id,
            module_name="mock_interview",
            completed=True,
            completed_at=datetime.utcnow(),
        )

        db.add(progress)

    else:
        progress.completed = True
        progress.completed_at = datetime.utcnow()

    db.commit()

    # --------------------------------------------------------
    # Final response
    # --------------------------------------------------------

    return {
        "success": True,
        "message": "Final interview report generated successfully.",
        "report": report,
    }