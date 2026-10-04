from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from io import BytesIO
import os
import json
import re

import pymupdf
from docx import Document
from dotenv import load_dotenv
from google import genai
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Resume, User
from app.routers.auth import get_current_user


# =========================================================
# CONFIG
# =========================================================

load_dotenv(override=True)

router = APIRouter(prefix="/api/v1/resume", tags=["Resume Analyzer"])

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not configured")

gemini_client = genai.Client(api_key=GEMINI_API_KEY)
GEMINI_MODEL = "gemini-3.5-flash-lite"


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
# GENERAL HELPERS
# =========================================================

def clean_text(value):
    if value is None:
        return ""

    if isinstance(value, dict):
        if value.get("value") is not None:
            return clean_text(value.get("value"))
        if value.get("name") is not None:
            name = clean_text(value.get("name"))
            issuer = clean_text(value.get("issuer"))
            return f"{name} — {issuer}" if issuer else name
        if value.get("role") is not None:
            role = clean_text(value.get("role"))
            reason = clean_text(value.get("reason"))
            return f"{role} — {reason}" if reason else role
        if value.get("title") is not None:
            title = clean_text(value.get("title"))
            description = clean_text(value.get("description"))
            return f"{title} — {description}" if description else title
        if value.get("category") is not None and value.get("value") is not None:
            return f"{clean_text(value.get('category'))}: {clean_text(value.get('value'))}"
        return ""

    if isinstance(value, list):
        return ", ".join(clean_text(item) for item in value if clean_text(item))

    return re.sub(r"\s+", " ", str(value)).strip()


def clean_list(value):
    if not isinstance(value, list):
        return []
    result = []
    seen = set()
    for item in value:
        text = clean_text(item)
        if not text or text == "[object Object]":
            continue
        key = text.lower()
        if key not in seen:
            seen.add(key)
            result.append(text)
    return result


def unique_list(items):
    result = []
    seen = set()
    for item in items:
        value = clean_text(item)
        if not value:
            continue
        key = value.lower()
        if key not in seen:
            seen.add(key)
            result.append(value)
    return result


def normalize_newlines(text):
    text = (text or "").replace("\r\n", "\n").replace("\r", "\n")
    return [clean_text(x) for x in text.split("\n") if clean_text(x)]


def is_heading(line):
    return clean_text(line).lower() in {
        "education", "academic details", "academic qualification",
        "educational qualification", "qualifications",
        "skills", "technical skills", "professional skills",
        "technical competencies", "projects", "academic projects",
        "personal information", "personal details", "languages",
        "languages known", "certifications", "certificates", "courses",
        "internships", "internship", "experience", "work experience",
        "professional experience", "achievements", "awards",
        "accomplishments", "summary", "professional summary",
        "career objective", "objective", "profile", "declaration"
    }


# =========================================================
# FILE EXTRACTION
# =========================================================

def extract_pdf_text(content: bytes) -> str:
    parts = []
    with pymupdf.open(stream=content, filetype="pdf") as pdf:
        for page in pdf:
            parts.append(page.get_text())
    return "\n".join(parts).strip()


def extract_docx_text(content: bytes) -> str:
    document = Document(BytesIO(content))
    return "\n".join(
        clean_text(p.text)
        for p in document.paragraphs
        if clean_text(p.text)
    ).strip()


# =========================================================
# JSON
# =========================================================

def clean_json_response(text):
    if not text:
        return {}

    text = str(text).strip()

    if text.startswith("```"):
        lines = text.splitlines()
        if lines:
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    try:
        value = json.loads(text)
        return value if isinstance(value, dict) else {}
    except Exception:
        pass

    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        try:
            value = json.loads(text[start:end + 1])
            return value if isinstance(value, dict) else {}
        except Exception:
            return {}

    return {}


# =========================================================
# SECTIONS
# =========================================================

SECTION_ALIASES = {
    "education": [
        "education", "academic details", "academic qualification",
        "educational qualification", "qualifications"
    ],
    "skills": [
        "skills", "technical skills", "professional skills",
        "technical competencies"
    ],
    "projects": [
        "projects", "academic projects", "personal projects"
    ],
    "certifications": [
        "certifications", "certificates", "courses"
    ],
    "experience": [
        "experience", "work experience", "professional experience",
        "internships", "internship"
    ],
    "languages": ["languages", "languages known"],
    "achievements": ["achievements", "awards", "accomplishments"],
    "summary": [
        "summary", "professional summary", "profile",
        "career objective", "objective"
    ],
}


def identify_section(line):
    value = clean_text(line).lower()
    for section, aliases in SECTION_ALIASES.items():
        if value in aliases:
            return section
    return None


def split_sections(text):
    sections = {
        "education": [], "skills": [], "projects": [],
        "certifications": [], "experience": [], "languages": [],
        "achievements": [], "summary": [], "other": []
    }

    current = "other"
    for line in normalize_newlines(text):
        detected = identify_section(line)
        if detected:
            current = detected
        else:
            sections[current].append(line)

    return sections


# =========================================================
# EDUCATION
# =========================================================

DEGREE_PATTERNS = [
    r"\bMBA\b", r"\bM\.?B\.?A\.?\b",
    r"\bB\.?TECH\b", r"\bB\.?E\.?\b",
    r"\bM\.?TECH\b", r"\bM\.?E\.?\b",
    r"\bB\.?SC\b", r"\bM\.?SC\b",
    r"\bB\.?COM\b", r"\bM\.?COM\b",
    r"\bB\.?A\b", r"\bM\.?A\b",
    r"\bBCA\b", r"\bMCA\b", r"\bBBA\b",
    r"\bM\.?PHIL\b", r"\bPH\.?D\b",
    r"\bINTERMEDIATE\b", r"\bHSC\b",
    r"\bSSC\b", r"\b10TH\b", r"\b12TH\b",
]


def contains_degree(text):
    return any(
        re.search(p, clean_text(text), re.I)
        for p in DEGREE_PATTERNS
    )


def extract_degree(text):
    patterns = [
        (r"\bM\.?B\.?A\.?\b", "MBA"),
        (r"\bMBA\b", "MBA"),
        (r"\bB\.?TECH\b", "B.Tech"),
        (r"\bB\.?E\.?\b", "B.E."),
        (r"\bM\.?TECH\b", "M.Tech"),
        (r"\bM\.?E\.?\b", "M.E."),
        (r"\bB\.?SC\b", "B.Sc."),
        (r"\bM\.?SC\b", "M.Sc."),
        (r"\bB\.?COM\b", "B.Com"),
        (r"\bM\.?COM\b", "M.Com"),
        (r"\bB\.?A\b", "B.A."),
        (r"\bM\.?A\b", "M.A."),
        (r"\bBCA\b", "BCA"),
        (r"\bMCA\b", "MCA"),
        (r"\bBBA\b", "BBA"),
        (r"\bINTERMEDIATE\b", "Intermediate"),
        (r"\bHSC\b", "Intermediate"),
        (r"\b12TH\b", "Intermediate"),
        (r"\bSSC\b", "SSC"),
        (r"\b10TH\b", "SSC"),
    ]
    for pattern, degree in patterns:
        if re.search(pattern, text, re.I):
            return degree
    return ""


def extract_cgpa(text):
    patterns = [
        r"(?:CGPA|GPA)\s*[:\-]?\s*(\d+(?:\.\d+)?)",
        r"(\d+(?:\.\d+)?)\s*(?:CGPA|GPA)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.I)
        if match:
            return match.group(1)
    return ""


def extract_percentage(text):
    patterns = [
        r"(?:percentage|percent|marks)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*%?",
        r"(\d+(?:\.\d+)?)\s*%",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.I)
        if match:
            value = match.group(1)
            try:
                if 0 < float(value) <= 100:
                    return value
            except ValueError:
                pass
    return ""


def extract_duration(text):
    match = re.search(
        r"\b(20\d{2})\s*[-–]\s*(20\d{2}|Present|Current|Expected)\b",
        text, re.I
    )
    if match:
        return f"{match.group(1)}–{match.group(2)}"

    # Academic year written as "2023 to 2027"
    match = re.search(
        r"\b(20\d{2})\s+(?:to|until)\s+(20\d{2})\b",
        text, re.I
    )
    if match:
        return f"{match.group(1)}–{match.group(2)}"

    return ""


def looks_like_college(line):
    value = clean_text(line).lower()
    return any(x in value for x in [
        "college", "university", "institute", "school",
        "engineering", "kalasala", "academy", "junior college"
    ])


def extract_specialization(text, degree):
    # Example: MBA (Finance + HR)
    match = re.search(
        rf"\b{re.escape(degree)}\b\s*\(([^)]+)\)",
        text, re.I
    )
    if match:
        return clean_text(match.group(1))

    # Example: Intermediate (MPC)
    if degree == "Intermediate":
        match = re.search(
            r"\b(?:Intermediate|HSC|12th)\b\s*\(([^)]+)\)",
            text, re.I
        )
        if match:
            return clean_text(match.group(1))

    # Explicit specialization label
    match = re.search(
        r"(?:specialization|specialisation)\s*[:\-]\s*"
        r"(.+?)(?=\s+(?:CGPA|GPA|Percentage|Marks)\b|\s+\d{4}\b|$)",
        text, re.I
    )
    if match:
        return clean_text(match.group(1))

    # B.Tech Computer Science Engineering
    if degree in {"B.Tech", "B.E.", "M.Tech", "M.E.", "B.Sc.", "M.Sc."}:
        match = re.search(
            rf"\b{re.escape(degree)}\b\s*"
            r"[-–:]?\s*(.+?)(?=\s*[-–|]\s*(?:20\d{2})|\s+(?:CGPA|GPA|Percentage|Marks)\b|$)",
            text, re.I
        )
        if match:
            value = clean_text(match.group(1))
            value = re.sub(
                r"\s*[-–|]\s*$", "", value
            ).strip()
            if value and len(value) <= 100:
                return value

    return ""


def extract_education_details(full_text, sections):
    """
    Extract education from the resume in its original order.

    The resume format is:
        College name
        Degree / specialization | duration | CGPA

    Therefore the college is normally the line immediately BEFORE
    the degree line. This avoids mixing MBA and B.Sc. colleges.
    """
    lines = sections.get("education", [])
    if not lines:
        lines = normalize_newlines(full_text)

    cleaned_lines = [clean_text(line) for line in lines]
    cleaned_lines = [line for line in cleaned_lines if line]

    records = []

    for i, line in enumerate(cleaned_lines):
        if not contains_degree(line):
            continue

        degree = extract_degree(line)
        if not degree:
            continue

        # In this resume the institution is directly above the degree.
        college = ""
        if i > 0:
            previous = cleaned_lines[i - 1]
            if looks_like_college(previous):
                college = previous

        # Support one-line formats too.
        if not college:
            match = re.search(
                r"^(.+?)\s+(?=(?:MBA|B\.?\s*Sc\.?|B\.?\s*Tech|B\.?\s*Com|"
                r"B\.?\s*A\.?|BCA|BBA|MCA|M\.?\s*Tech|M\.?\s*Sc\.?)\b)",
                line,
                re.I,
            )
            if match:
                candidate = clean_text(match.group(1))
                if looks_like_college(candidate):
                    college = candidate

        # Degree line plus any continuation lines until the next degree.
        block = [line]
        j = i + 1
        while j < len(cleaned_lines) and len(block) < 5:
            nxt = cleaned_lines[j]
            if contains_degree(nxt) or is_heading(nxt):
                break
            block.append(nxt)
            j += 1

        block_text = " | ".join(block)

        specialization = extract_specialization(block_text, degree)

        # Exact MBA format in the resume.
        if degree.upper() == "MBA":
            match = re.search(
                r"\bMBA\b\s*[—–-]\s*(.+?)(?=\s*\||\s+20\d{2}\b|$)",
                line,
                re.I,
            )
            if match:
                specialization = clean_text(match.group(1))

        # Exact B.Sc. format in the resume.
        if degree.upper().replace(" ", "") in {"B.SC.", "B.SC"}:
            match = re.search(
                r"\bB\.?\s*Sc\.?\b\s*\(([^)]+)\)",
                line,
                re.I,
            )
            if match:
                specialization = clean_text(match.group(1))

        specialization = re.sub(
            r"\s*[—–-]\s*20\d{2}(?:\s*[—–-]\s*20\d{2})?\s*$",
            "",
            specialization or "",
            flags=re.I,
        ).strip()

        cgpa = extract_cgpa(block_text)
        percentage = extract_percentage(block_text)
        duration = extract_duration(block_text)

        if degree == "SSC" and not duration:
            match = re.search(r"\b(20\d{2})\b", block_text)
            if match:
                duration = match.group(1)

        if degree in {"MBA", "M.Tech", "M.E.", "M.Sc.", "M.Com", "M.A.", "MCA"}:
            qtype = "Postgraduate"
            title = f"{degree} Details"
        elif degree in {"B.Tech", "B.E.", "B.Sc.", "B.Com", "B.A.", "BCA", "BBA"}:
            qtype = "Graduation"
            title = f"{degree} Details"
        elif degree == "Intermediate":
            qtype = "Intermediate"
            title = "Intermediate Details"
        elif degree == "SSC":
            qtype = "School"
            title = "SSC / 10th Details"
        else:
            qtype = "Education"
            title = f"{degree} Details"

        record = {
            "title": title,
            "type": qtype,
            "college": college,
            "degree": degree,
            "specialization": specialization,
            "cgpa": cgpa,
            "percentage": percentage,
            "duration": duration,
        }

        # Do not merge MBA and B.Sc. They are different qualifications.
        key = (
            degree.lower(),
            college.lower(),
            duration.lower(),
        )
        if not any(
            (
                item["degree"].lower(),
                item["college"].lower(),
                item["duration"].lower(),
            ) == key
            for item in records
        ):
            records.append(record)

    order = {
        "Postgraduate": 1,
        "Graduation": 2,
        "Intermediate": 3,
        "School": 4,
        "Education": 5,
    }
    records.sort(key=lambda x: order.get(x["type"], 99))
    return records


def education_to_display(records):
    """
    One clean line per qualification, matching the resume:
    College — Degree | specialization | duration | CGPA
    """
    result = []
    seen = set()

    for record in records or []:
        if isinstance(record, str):
            value = clean_text(record)
        elif isinstance(record, dict):
            degree = clean_text(record.get("degree"))
            specialization = clean_text(record.get("specialization"))
            college = clean_text(record.get("college"))
            cgpa = clean_text(record.get("cgpa"))
            percentage = clean_text(record.get("percentage"))
            duration = clean_text(record.get("duration"))

            if degree.upper() == "MBA":
                qualification = (
                    f"MBA — {specialization}"
                    if specialization
                    else "MBA"
                )
            elif degree.upper().replace(" ", "") in {"B.SC.", "B.SC"}:
                qualification = (
                    f"B.Sc. ({specialization})"
                    if specialization
                    else "B.Sc."
                )
            else:
                qualification = degree

            details = " | ".join(
                part
                for part in [
                    qualification,
                    duration,
                    f"CGPA: {cgpa}" if cgpa else "",
                    f"{percentage.replace('%', '').strip()}%" if percentage else "",
                ]
                if part
            )

            if college and details:
                value = f"{college} — {details}"
            else:
                value = college or details
        else:
            value = ""

        value = clean_text(value)

        if value and value != "[object Object]":
            key = re.sub(r"\s+", " ", value.lower()).strip()
            if key not in seen:
                seen.add(key)
                result.append(value)

    return result


# =========================================================
# PERSONAL INFORMATION
# =========================================================

def find_label_value(text, labels):
    for label in labels:
        match = re.search(
            rf"(?im)^\s*{re.escape(label)}\s*[:\-]\s*([^\n|]+)",
            text,
        )
        if match:
            return clean_text(match.group(1))
    return ""


def extract_personal_information(text):
    return {
        "location": find_label_value(text, ["Location", "City", "Address"]),
        "gender": find_label_value(text, ["Gender"]),
        "languages": find_label_value(text, ["Languages Known", "Languages Spoken"]),
    }


# =========================================================
# SKILLS
# =========================================================

# =========================================================
# PERSONAL INFORMATION
# =========================================================

def find_label_value(text, labels):
    for label in labels:
        match = re.search(
            rf"{re.escape(label)}\s*[:\-]\s*([^\n|]+)",
            text, re.I
        )
        if match:
            return clean_text(match.group(1))
    return ""


def extract_personal_information(text):
    return {
        "location": find_label_value(
            text, ["Location", "City", "Address"]
        ),
        "gender": find_label_value(
            text, ["Gender"]
        ),
        "languages": find_label_value(
            text, ["Languages Known", "Languages", "Language"]
        ),
    }


# =========================================================
# SKILLS
# =========================================================

BASIC_WORDS = [
    "basic", "beginner", "familiar", "knowledge",
    "working knowledge"
]


def skill_level(text):
    value = text.lower()
    if any(
        re.search(rf"\b{re.escape(word)}\b", value)
        for word in BASIC_WORDS
    ):
        return "BASIC"
    return "STATED"


def remove_level_words(text):
    return clean_text(re.sub(
        r"^(basic|beginner|familiar with|knowledge of|working knowledge of)\s+",
        "", text, flags=re.I
    ))


def split_skill_line(line):
    line = clean_text(line)
    if not line:
        return []

    # Remove category prefix such as "Programming Languages:"
    if ":" in line:
        prefix, rest = line.split(":", 1)
        if len(prefix) <= 40:
            line = rest.strip()

    pieces = re.split(r",|;|\||\s+&\s+", line)
    result = []

    for piece in pieces:
        piece = clean_text(piece)
        if not piece or len(piece) > 80:
            continue

        # Split "HTML/CSS" but preserve normal words.
        if "/" in piece:
            slash_parts = [clean_text(x) for x in piece.split("/")]
            if len(slash_parts) <= 4 and all(
                0 < len(x) <= 35 for x in slash_parts
            ):
                result.extend(slash_parts)
                continue

        result.append(piece)

    return result


def classify_skill(skill):
    value = skill.lower()

    if any(x in value for x in [
        "python", "java", "javascript", "c++",
        "c#", "c", "typescript"
    ]):
        return "programming_languages"

    if any(x in value for x in [
        "html", "css", "react", "bootstrap",
        "node", "angular", "frontend", "web"
    ]):
        return "web_technologies"

    if any(x in value for x in [
        "sql", "mysql", "postgresql", "mongodb", "oracle"
    ]):
        return "databases"

    if any(x in value for x in [
        "github", "git", "vs code", "visual studio code",
        "excel", "power bi", "tableau"
    ]):
        return "tools_platforms"

    return "other"


def extract_skills(full_text, sections):
    lines = sections.get("skills", [])

    if not lines:
        all_lines = normalize_newlines(full_text)
        for i, line in enumerate(all_lines):
            if identify_section(line) == "skills":
                lines = all_lines[i + 1:i + 25]
                break

    entries = []

    for line in lines:
        if is_heading(line):
            continue

        for piece in split_skill_line(line):
            level = skill_level(piece)
            name = remove_level_words(piece)

            if not name:
                continue

            entries.append({
                "name": name,
                "display": piece,
                "level": level,
                "category": classify_skill(name),
            })

    final = []
    seen = set()

    for item in entries:
        key = item["name"].lower()
        if key not in seen:
            seen.add(key)
            final.append(item)

    categories = {
        "programming_languages": [],
        "web_technologies": [],
        "databases": [],
        "tools_platforms": [],
        "other": [],
    }

    for item in final:
        categories[item["category"]].append(item["display"])

    return {
        **{
            key: unique_list(value)
            for key, value in categories.items()
        },
        "details": final,
    }


# =========================================================
# OTHER RESUME DATA
# =========================================================

def extract_projects(full_text, sections):
    return [
        x for x in clean_list(sections.get("projects", []))
        if not is_heading(x)
    ][:15]


def extract_certifications(sections):
    return [
        x for x in clean_list(sections.get("certifications", []))
        if not is_heading(x)
    ][:15]


def extract_experience(sections):
    return [
        x for x in clean_list(sections.get("experience", []))
        if not is_heading(x)
    ][:20]


def extract_languages(full_text, sections, personal_information):
    known_human = {
        "english", "telugu", "hindi", "kannada", "tamil", "malayalam",
        "marathi", "bengali", "gujarati", "punjabi", "urdu", "odia",
    }
    programming = {
        "c", "c++", "c#", "java", "python", "javascript", "typescript",
        "kotlin", "swift", "php", "ruby", "go", "rust", "scala",
    }

    candidates = []
    if personal_information.get("languages"):
        candidates.extend(re.split(r",|;|\||\s+&\s+", personal_information["languages"]))

    candidates.extend(clean_list(sections.get("languages", [])))

    result = []
    seen = set()
    for candidate in candidates:
        text = clean_text(candidate)
        if not text:
            continue
        parts = re.split(r",|;|\||\s+&\s+", text)
        for part in parts:
            part = clean_text(part)
            if not part:
                continue
            lower = part.lower()
            if lower in programming:
                continue
            if any(lang in lower for lang in known_human):
                key = lower
                if key not in seen:
                    seen.add(key)
                    result.append(part)

    return result[:10]


def extract_achievements(sections):
    return [
        x for x in clean_list(sections.get("achievements", []))
        if not is_heading(x)
    ][:15]


def extract_summary(sections):
    return " ".join(
        clean_list(sections.get("summary", []))
    ).strip()


# =========================================================
# DOMAIN / SPECIALIZATION
# =========================================================

def get_specializations(education_details):
    return unique_list([
        record.get("specialization", "")
        for record in education_details
        if record.get("specialization")
    ])


def specialization_flags(education_details):
    text = " ".join(
        [
            record.get("degree", "")
            + " "
            + record.get("specialization", "")
            for record in education_details
        ]
    ).lower()

    return {
        "finance": bool(re.search(
            r"\bfinance\b|\bfinancial\b", text
        )),
        "hr": bool(re.search(
            r"\bhr\b|\bhuman resources?\b|\bhuman resource\b", text
        )),
        "marketing": bool(re.search(
            r"\bmarketing\b|\bdigital marketing\b", text
        )),
        "computer_science": bool(re.search(
            r"computer science|computer engineering|"
            r"information technology|information science|"
            r"software engineering|computer applications",
            text
        )),
    }


# =========================================================
# COURSE SYLLABUS
# =========================================================

def syllabus(goal, fresher, advanced):
    return {
        "goal": goal,
        "fresher_topics": fresher,
        "advanced_topics": advanced,
    }


COURSE_SYLLABUS = {

    "JavaScript": syllabus(
        "Learn JavaScript from zero to practical frontend level.",
        [
            "JavaScript introduction",
            "Variables: let, const and var",
            "Data types",
            "Type conversion",
            "Operators",
            "if, else-if and else",
            "switch",
            "for, while and do-while loops",
            "break and continue",
            "Functions",
            "Parameters and return values",
            "Arrow functions",
            "Strings and string methods",
            "Arrays and array methods",
            "Objects",
            "Object methods",
            "Template literals",
            "ES6 basics",
            "DOM basics",
            "getElementById",
            "querySelector",
            "textContent",
            "classList",
            "addEventListener",
            "Click, input and keyboard events",
            "Form submission",
            "Form validation",
            "Fetch API",
            "JSON",
            "Promises basics",
            "async and await",
            "LocalStorage",
            "Error handling",
            "Calculator project",
            "To-do list project",
            "Form validation project",
            "Weather API project",
        ],
        [
            "Advanced ES6+",
            "Modules",
            "Closures",
            "Promises in depth",
            "Advanced async JavaScript",
            "API integration patterns",
            "Performance basics",
            "Testing basics",
            "TypeScript",
        ],
    ),

    "React.js": syllabus(
        "Learn React from zero to fresher frontend project level.",
        [
            "React introduction",
            "Node and npm basics",
            "Project setup",
            "Components",
            "JSX",
            "Props",
            "State",
            "useState",
            "Event handling",
            "Conditional rendering",
            "Lists and keys",
            "Forms",
            "Form validation",
            "useEffect",
            "API calls",
            "Loading and error states",
            "React Router",
            "Navigation",
            "Context API basics",
            "Reusable components",
            "Project structure",
            "Frontend project",
        ],
        [
            "Advanced hooks",
            "useMemo",
            "useCallback",
            "Performance optimization",
            "Advanced Context API",
            "Authentication",
            "State management",
            "Redux basics",
            "Testing",
            "Deployment",
        ],
    ),

    "Python": syllabus(
        "Learn Python from zero to fresher coding and project level.",
        [
            "Python setup and VS Code",
            "print()",
            "Variables and data types",
            "Input and type conversion",
            "Operators",
            "if, elif and else",
            "for and while loops",
            "break and continue",
            "Strings and string methods",
            "Lists and list methods",
            "Tuples",
            "Sets",
            "Dictionaries",
            "Functions",
            "Arguments and return values",
            "Exception handling",
            "File handling",
            "Modules",
            "Classes and objects",
            "Inheritance basics",
            "List comprehensions",
            "Lambda basics",
            "Searching",
            "Sorting",
            "Number and digit problems",
            "Palindrome",
            "Prime numbers",
            "Factorial",
            "Fibonacci",
            "Two Sum",
            "Valid Anagram",
            "Basic DSA problems",
            "Python mini project",
        ],
        [
            "Advanced OOP",
            "Decorators",
            "Generators",
            "Iterators",
            "Regular expressions",
            "APIs",
            "Requests",
            "JSON",
            "NumPy",
            "Pandas",
            "FastAPI",
            "Database connectivity",
            "Automation",
        ],
    ),

    "Java": syllabus(
        "Learn Java fundamentals to fresher interview level.",
        [
            "Java setup",
            "Variables and data types",
            "Input and output",
            "Operators",
            "if-else and switch",
            "Loops",
            "Arrays",
            "Strings",
            "Methods",
            "Classes and objects",
            "Constructors",
            "this keyword",
            "Inheritance",
            "Polymorphism",
            "Encapsulation",
            "Abstraction",
            "Interfaces",
            "Exception handling",
            "ArrayList",
            "HashSet",
            "HashMap",
            "Collections",
            "FileReader and FileWriter",
            "Try-with-resources",
            "LocalDate",
            "Basic coding problems",
            "Java interview questions",
        ],
        [
            "Generics",
            "Streams",
            "Lambda expressions",
            "Multithreading",
            "JDBC",
            "Spring Boot",
            "REST APIs",
            "Hibernate",
        ],
    ),

    "SQL": syllabus(
        "Learn SQL from zero to fresher database interview level.",
        [
            "Database basics",
            "Tables and records",
            "Primary key",
            "Foreign key",
            "SELECT",
            "WHERE",
            "ORDER BY",
            "GROUP BY",
            "HAVING",
            "DISTINCT",
            "INSERT",
            "UPDATE",
            "DELETE",
            "COUNT, SUM and AVG",
            "MIN and MAX",
            "LIKE",
            "IN",
            "BETWEEN",
            "NULL",
            "INNER JOIN",
            "LEFT JOIN",
            "RIGHT JOIN basics",
            "Subqueries",
            "CASE",
            "Constraints",
            "Basic database design",
            "SQL interview questions",
        ],
        [
            "Advanced joins",
            "CTEs",
            "Window functions",
            "Indexes",
            "Query optimization",
            "Transactions",
            "Views",
            "Stored procedures",
        ],
    ),

    "Git & GitHub": syllabus(
        "Learn Git and GitHub for real project development.",
        [
            "Git introduction",
            "Repository basics",
            "git init",
            "git status",
            "git add",
            "git commit",
            "git log",
            "Branches",
            "git switch",
            "git merge",
            "git clone",
            "git pull",
            "git push",
            "GitHub repositories",
            "README files",
            "Uploading projects",
            "Basic collaboration",
            "Simple conflict resolution",
        ],
        [
            "Advanced branching",
            "Rebase",
            "Cherry-pick",
            "Pull requests",
            "Code review",
            "GitHub Actions",
            "CI/CD basics",
        ],
    ),

    "DSA": syllabus(
        "Learn placement-focused data structures and algorithms.",
        [
            "Time complexity basics",
            "Arrays",
            "Strings",
            "Two pointers",
            "Sliding window basics",
            "Hashing",
            "HashMap",
            "HashSet",
            "Searching",
            "Binary search",
            "Sorting",
            "Bubble sort",
            "Selection sort",
            "Insertion sort",
            "Recursion basics",
            "Stack",
            "Queue",
            "Linked list basics",
            "Trees basics",
            "Binary tree basics",
            "Graph basics",
            "Easy coding problems",
            "Medium coding problems",
            "Placement problem practice",
        ],
        [
            "Advanced trees",
            "Graphs",
            "Dynamic programming",
            "Greedy algorithms",
            "Backtracking",
            "Advanced graph algorithms",
        ],
    ),

    "Financial Analysis": syllabus(
        "Learn financial analysis from zero to fresher finance-role level.",
        [
            "Finance basics",
            "Revenue, cost and profit",
            "Assets, liabilities and equity",
            "Accounting equation",
            "Income Statement",
            "Balance Sheet",
            "Cash Flow Statement",
            "Profit versus cash flow",
            "Working capital",
            "Accounts receivable and payable",
            "Inventory basics",
            "Gross and net profit",
            "EBIT and EBITDA",
            "Horizontal analysis",
            "Vertical analysis",
            "Trend analysis",
            "Liquidity ratios",
            "Profitability ratios",
            "Solvency ratios",
            "Efficiency ratios",
            "Budget basics",
            "Actual versus budget",
            "Variance analysis",
            "Forecasting basics",
            "Annual report reading",
            "Financial insights",
            "Finance case studies",
        ],
        [
            "Advanced Excel financial models",
            "Three-statement modeling",
            "Revenue forecasting",
            "Cash-flow forecasting",
            "Scenario analysis",
            "Sensitivity analysis",
            "Capital budgeting",
            "NPV and IRR",
            "DCF valuation",
            "WACC basics",
            "Comparable company analysis",
            "Power BI for finance",
            "Python for finance",
        ],
    ),

    "Business Analytics Fundamentals": syllabus(
        "Learn business analytics and convert data into business insights.",
        [
            "Business analytics basics",
            "Types of business data",
            "Data cleaning",
            "Excel for analytics",
            "Mean, median and mode",
            "Percentage and growth",
            "Trend analysis",
            "Pivot tables",
            "Charts and dashboards",
            "Business KPIs",
            "Sales analysis",
            "Customer analysis",
            "Financial data analysis",
            "Basic SQL",
            "Business insights",
            "Analytics case studies",
        ],
        [
            "Power BI",
            "Advanced SQL",
            "Data modeling",
            "Python for analytics",
            "Predictive analytics basics",
            "Dashboard automation",
        ],
    ),

    "Business Communication": syllabus(
        "Improve professional communication for interviews and workplace use.",
        [
            "Professional English basics",
            "Self introduction",
            "Explaining education",
            "Explaining skills",
            "Explaining projects",
            "Explaining internship experience",
            "Professional email writing",
            "Professional greetings",
            "Phone communication",
            "Interview answers",
            "Strengths and weaknesses",
            "Career goals",
            "Group discussion basics",
            "Agreeing and disagreeing politely",
            "Workplace communication",
        ],
        [
            "Business presentations",
            "Client communication",
            "Negotiation",
            "Leadership communication",
            "Public speaking",
            "Business writing",
        ],
    ),

    "Recruitment Fundamentals": syllabus(
        "Learn recruitment from beginner level to entry-level talent acquisition work.",
        [
            "HR and recruitment basics",
            "Recruitment life cycle",
            "Job analysis",
            "Job description",
            "Understanding job requirements",
            "Candidate sourcing",
            "Job portals",
            "LinkedIn sourcing basics",
            "Resume screening",
            "Candidate shortlisting",
            "Candidate calling",
            "Email communication",
            "Interview scheduling",
            "Candidate follow-up",
            "Recruitment trackers",
            "Candidate database",
            "Offer process basics",
            "Onboarding basics",
            "Recruitment metrics",
        ],
        [
            "Boolean search",
            "Advanced LinkedIn sourcing",
            "Recruitment analytics",
            "Recruitment dashboards",
            "Applicant Tracking Systems",
            "Employer branding",
            "Campus hiring",
            "Recruitment automation",
        ],
    ),

    "HR Operations Fundamentals": syllabus(
        "Learn HR operations for entry-level HR roles.",
        [
            "HR department basics",
            "Employee life cycle",
            "Joining formalities",
            "Employee documentation",
            "Onboarding",
            "Induction",
            "Attendance management",
            "Leave management",
            "Employee records",
            "Payroll basics",
            "Salary structure basics",
            "Employee benefits",
            "Performance management",
            "Training and development",
            "Employee engagement",
            "HR policies",
            "Exit process",
            "HR communication",
            "HR interview preparation",
        ],
        [
            "HR analytics",
            "HR dashboards",
            "Workforce planning",
            "Performance analytics",
            "Compensation analytics",
            "HRIS systems",
            "People analytics",
            "HR automation",
        ],
    ),

    "MS Excel": syllabus(
        "Learn Excel from beginner level for practical business work.",
        [
            "Excel interface",
            "Rows, columns, cells and ranges",
            "Data entry",
            "Formatting",
            "SUM",
            "AVERAGE",
            "MIN and MAX",
            "COUNT and COUNTA",
            "IF",
            "SUMIF and SUMIFS",
            "COUNTIF and COUNTIFS",
            "XLOOKUP",
            "VLOOKUP",
            "INDEX and MATCH",
            "Text functions",
            "Date functions",
            "Sorting and filtering",
            "Conditional formatting",
            "Data validation",
            "Excel tables",
            "Pivot tables",
            "Charts",
            "Basic dashboards",
            "Data cleaning",
        ],
        [
            "Dynamic arrays",
            "Power Query",
            "Power Pivot",
            "Data modeling",
            "Advanced dashboards",
            "What-if analysis",
            "Solver",
            "VBA basics",
        ],
    ),
}


COURSE_ALIASES = {
    "financial analysis": "Financial Analysis",
    "finance": "Financial Analysis",
    "financial analyst": "Financial Analysis",
    "excel": "MS Excel",
    "ms excel": "MS Excel",
    "advanced excel": "MS Excel",
    "recruitment": "Recruitment Fundamentals",
    "talent acquisition": "Recruitment Fundamentals",
    "hr operations": "HR Operations Fundamentals",
    "human resources": "HR Operations Fundamentals",
    "business analytics": "Business Analytics Fundamentals",
    "analytics": "Business Analytics Fundamentals",
    "business communication": "Business Communication",
    "communication": "Business Communication",
    "python": "Python",
    "java": "Java",
    "javascript": "JavaScript",
    "js": "JavaScript",
    "react": "React.js",
    "react.js": "React.js",
    "sql": "SQL",
    "git": "Git & GitHub",
    "github": "Git & GitHub",
    "dsa": "DSA",
}


def get_course_key(name):
    value = clean_text(name).lower()
    return COURSE_ALIASES.get(value, name if name in COURSE_SYLLABUS else "")


def build_course(course_name):
    key = get_course_key(course_name)
    data = COURSE_SYLLABUS.get(key)

    if not data:
        return {
            "skill": course_name,
            "course_name": course_name,
            "goal": f"Learn {course_name} from beginner level.",
            "fresher_topics": [
                f"{course_name} basics",
                f"{course_name} practical concepts",
                f"{course_name} exercises",
                f"{course_name} mini project",
                f"{course_name} interview preparation",
            ],
            "advanced_topics": [
                f"Advanced {course_name}",
                f"Real-world {course_name} projects",
            ],
        }

    return {
        "skill": key,
        "course_name": key,
        "goal": data["goal"],
        "fresher_topics": data["fresher_topics"],
        "advanced_topics": data["advanced_topics"],
    }


# =========================================================
# RECOMMENDED COURSES
# =========================================================

def get_recommended_courses(education_details, skills):
    flags = specialization_flags(education_details)
    courses = []

    # ONE primary domain at a time.
    # This prevents an HR/Finance resume from receiving
    # unrelated CSE courses and vice versa.

    if flags["computer_science"]:
        courses = [
            "JavaScript",
            "SQL",
            "Git & GitHub",
            "DSA",
        ]

        # If Java/Python are actually on the resume,
        # they become improvement courses.
        names = {
            x.get("name", "").lower()
            for x in skills.get("details", [])
        }

        if "python" in names:
            courses.append("Python")

        if "java" in names:
            courses.append("Java")

    elif flags["finance"]:
        courses = [
            "Financial Analysis",
            "Business Analytics Fundamentals",
        ]

    elif flags["hr"]:
        courses = [
            "Recruitment Fundamentals",
            "HR Operations Fundamentals",
            "Business Communication",
        ]

    elif flags["marketing"]:
        courses = [
            "Business Analytics Fundamentals",
            "Business Communication",
        ]

    # No domain detected:
    # Do NOT invent Excel/HR courses.
    return [
        build_course(x)
        for x in unique_list(courses)[:6]
    ]


# =========================================================
# PROFILE
# =========================================================

def build_current_profile(
    education_details,
    skills,
    projects,
    certifications,
    experience,
    languages,
    achievements,
    personal_information,
):
    actual_skills = unique_list(
        skills.get("programming_languages", [])
        + skills.get("web_technologies", [])
        + skills.get("databases", [])
        + skills.get("tools_platforms", [])
        + skills.get("other", [])
    )

    education_display = education_to_display(education_details)

    profile_items = []
    for item in education_display:
        profile_items.append({"category": "Education", "value": item})
    for item in actual_skills:
        profile_items.append({"category": "Skill", "value": item})
    for item in projects:
        profile_items.append({"category": "Project", "value": item})
    for item in certifications:
        profile_items.append({"category": "Certification", "value": item})
    for item in experience:
        profile_items.append({"category": "Experience", "value": item})
    for item in languages:
        profile_items.append({"category": "Language", "value": item})
    for item in achievements:
        profile_items.append({"category": "Achievement", "value": item})

    return {
        "education": education_display,
        "education_details": education_details,
        "specialization": get_specializations(education_details),
        "skills": actual_skills,
        "skill_details": skills.get("details", []),
        "projects": projects,
        "certifications": certifications,
        "internships_experience": experience,
        "languages": languages,
        "achievements": achievements,
        "personal_information": personal_information,
        "profile_items": profile_items,
        "profile_found": bool(profile_items or education_display),
    }


# =========================================================
# SUITABLE JOB ROLES
# =========================================================

def build_suitable_roles(education_details, skills, projects):
    """Return roles based on actual education/specialization.

    Supports combined specializations such as MBA Finance + HR instead of
    choosing only the first matching domain.
    """
    flags = specialization_flags(education_details)
    roles = []

    if flags["finance"]:
        roles.extend([
            {
                "role": "Finance Executive / Finance Trainee",
                "reason": "Finance specialization is relevant to entry-level finance roles.",
            },
            {
                "role": "Financial Analyst Trainee",
                "reason": "Finance specialization and analytical skills support this role.",
            },
        ])

    if flags["hr"]:
        roles.extend([
            {
                "role": "HR Executive / HR Trainee",
                "reason": "HR specialization is relevant to entry-level HR roles.",
            },
            {
                "role": "Recruitment / Talent Acquisition Trainee",
                "reason": "HR specialization is relevant to recruitment and talent acquisition.",
            },
        ])

    if flags["marketing"]:
        roles.extend([
            {
                "role": "Marketing Executive Trainee",
                "reason": "Marketing specialization is relevant to entry-level marketing roles.",
            },
            {
                "role": "Marketing Analytics Trainee",
                "reason": "Marketing specialization and analytics skills support this role.",
            },
        ])

    if flags["computer_science"]:
        role_skills = " ".join(
            x.get("name", "")
            for x in skills.get("details", [])
            if isinstance(x, dict)
        ).lower()

        roles.append({
            "role": "Software Developer Trainee",
            "reason": "Computer Science education supports entry-level software roles.",
        })

        if any(x in role_skills for x in ["javascript", "html", "css", "react"]):
            roles.append({
                "role": "Frontend Developer Trainee",
                "reason": "Web development skills are present in the resume.",
            })

        if "python" in role_skills:
            roles.append({
                "role": "Python Developer Trainee",
                "reason": "Python is present in the resume.",
            })

    return roles[:6]


# =========================================================
# IMPROVEMENTS
# =========================================================

def build_improve(education_details, skills, projects, experience):
    actions = []

    basic = [
        x.get("name", "")
        for x in skills.get("details", [])
        if x.get("level") == "BASIC"
    ]

    for skill in unique_list(basic):
        actions.append(
            f"Improve {skill} from basic level to practical job-ready level."
        )

    if not projects:
        actions.append(
            "Build at least one practical project related to your target career."
        )

    if not experience:
        actions.append(
            "Gain internship or practical project experience."
        )

    if not actions:
        actions.append(
            "Strengthen your existing skills with practical projects and interview practice."
        )

    actions.append(
        "Practice interview questions based on your target role."
    )

    return unique_list(actions)[:6]


# =========================================================
# NEXT STEPS
# =========================================================

def build_next_steps(
    education_details,
    skills,
    projects,
    recommended_courses,
):
    steps = []

    if recommended_courses:
        first = recommended_courses[0]["course_name"]
        steps.append(
            f"Start {first} from the fresher-level syllabus."
        )

    basic = unique_list([
        x.get("name", "")
        for x in skills.get("details", [])
        if x.get("level") == "BASIC"
    ])

    if basic:
        steps.append(
            "Improve your basic skills: "
            + ", ".join(basic)
            + "."
        )

    if projects:
        steps.append(
            "Improve your existing projects and prepare to explain them in interviews."
        )
    else:
        steps.append(
            "Build one practical project related to your target career."
        )

    steps.append(
        "Practice interview questions based on your target role."
    )

    return unique_list(steps)[:5]


# =========================================================
# PROJECT IDEAS
# =========================================================

def project_idea(name, description, technologies, outputs):
    return {
        "project_name": name,
        "title": name,
        "description": description,
        "technologies": technologies,
        "actual_output": outputs,
    }


def build_project_ideas(education_details):
    """Return concrete, non-empty project ideas for the detected domain."""
    flags = specialization_flags(education_details)

    if flags["finance"] and flags["hr"]:
        return [
            project_idea("HR & Payroll Analytics Dashboard", "Analyze employee salary, payroll, attendance and HR metrics.", ["Excel", "Power BI"], ["Payroll dashboard", "HR KPI charts", "Employee cost analysis"]),
            project_idea("Recruitment Cost & Hiring Analytics", "Track hiring cost, time-to-hire, candidate stages and recruitment performance.", ["Excel", "Power BI"], ["Recruitment funnel", "Hiring KPI report", "Cost analysis"]),
            project_idea("Employee Compensation Analysis", "Compare salaries, departments, benefits and compensation trends.", ["Excel", "Power BI"], ["Salary comparison", "Department analysis", "Compensation dashboard"]),
            project_idea("Finance & HR Management Dashboard", "Combine department budgets, employee costs and workforce metrics.", ["Excel", "Power BI"], ["Budget dashboard", "Employee cost metrics", "Management KPI report"]),
        ]

    if flags["finance"]:
        return [
            project_idea("Personal Expense & Budget Analyzer", "Track income, expenses, budgets and spending patterns.", ["Excel", "Power BI"], ["Expense dashboard", "Budget summary", "Monthly spending charts"]),
            project_idea("Financial Statement Analysis Dashboard", "Analyze revenue, expenses, profit and financial ratios.", ["Excel", "Power BI"], ["Financial KPI dashboard", "Ratio analysis", "Trend charts"]),
            project_idea("Investment Analysis Dashboard", "Compare investment returns, risk and performance.", ["Excel", "Power BI"], ["Return comparison", "Risk analysis", "Investment dashboard"]),
            project_idea("Sales & Revenue Analysis", "Analyze sales performance, revenue trends and product contribution.", ["Excel", "Power BI"], ["Sales dashboard", "Revenue trends", "Product analysis"]),
        ]

    if flags["hr"]:
        return [
            project_idea("Recruitment Analytics Dashboard", "Analyze applications, interview stages, hiring time and recruitment sources.", ["Excel", "Power BI"], ["Recruitment funnel", "Time-to-hire report", "Hiring KPI dashboard"]),
            project_idea("Employee Management System", "Maintain employee records, departments and employment information.", ["Python", "SQL"], ["Employee records", "Search and update functions", "Employee report"]),
            project_idea("Employee Attendance & Leave System", "Track attendance, leave requests and monthly attendance summaries.", ["Python", "SQL"], ["Attendance report", "Leave summary", "Monthly report"]),
            project_idea("Employee Performance Dashboard", "Track performance ratings, goals and department-level metrics.", ["Excel", "Power BI"], ["Performance KPIs", "Department comparison", "Performance report"]),
        ]

    if flags["marketing"]:
        return [
            project_idea("Sales & Marketing Analytics Dashboard", "Analyze sales, campaigns, customers and marketing performance.", ["Excel", "Power BI"], ["Campaign KPIs", "Sales trends", "Marketing dashboard"]),
            project_idea("Customer Segmentation System", "Group customers using purchase and engagement information.", ["Python", "Excel"], ["Customer segments", "Segment summary", "Customer insights"]),
            project_idea("Marketing Campaign Analyzer", "Compare campaign reach, engagement and conversion performance.", ["Excel", "Power BI"], ["Campaign comparison", "Conversion report", "Performance dashboard"]),
        ]

    if flags["computer_science"]:
        return [
            project_idea("Job & Skill Gap Analyzer", "Compare resumes with job descriptions and identify matching and missing skills.", ["Python", "FastAPI", "React Native", "PostgreSQL"], ["Skill comparison", "Missing skills list", "Learning recommendations"]),
            project_idea("Student Placement Preparation App", "Provide aptitude, coding and interview preparation features.", ["Python", "React Native", "PostgreSQL"], ["Practice modules", "Progress tracking", "Interview preparation"]),
            project_idea("AI Resume Analyzer", "Extract education, skills, projects and career recommendations from resumes.", ["Python", "FastAPI", "Gemini API", "React Native"], ["Resume analysis", "Skill recommendations", "Career guidance"]),
            project_idea("Full Stack Job Portal", "Build job search, registration, applications and tracking.", ["React", "Node.js", "PostgreSQL"], ["Job search", "User accounts", "Application tracking"]),
        ]

    return [
        project_idea("Career Profile & Skills Dashboard", "Organize education, skills, certifications and career goals.", ["Excel", "Power BI"], ["Profile dashboard", "Skills summary", "Career goals report"]),
        project_idea("Business Data Analysis Dashboard", "Analyze a small business dataset and present useful KPIs and insights.", ["Excel", "Power BI"], ["Business KPIs", "Charts", "Insights report"]),
        project_idea("Student Career Tracker", "Track courses, skills, applications, interviews and career progress.", ["Python", "SQL"], ["Course tracker", "Application tracker", "Progress report"]),
        project_idea("Resume & Job Application Tracker", "Store resumes, job applications, interview dates and application status.", ["Python", "SQL"], ["Resume records", "Application status", "Interview tracker"]),
    ]


# =========================================================
# GEMINI SUPPORT
# =========================================================

def analyze_resume_with_gemini(resume_text):
    prompt = f"""
You are an AI Resume Analyzer.

Use ONLY information actually present in the resume.
Do not invent education, skills, projects, certifications or experience.
Preserve qualifiers such as Basic, Beginner and Familiar with.
Return ONLY JSON.

{{
  "summary": "",
  "projects": [],
  "certifications": [],
  "experience": []
}}

RESUME:
{resume_text}
"""

    response = gemini_client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
    )

    return clean_json_response(response.text)


# =========================================================
# FINAL ANALYSIS
# =========================================================

def build_final_analysis(resume_text, gemini_data):
    sections = split_sections(resume_text)

    education_details = extract_education_details(resume_text, sections)
    skills = extract_skills(resume_text, sections)
    personal_information = extract_personal_information(resume_text)
    projects = extract_projects(resume_text, sections)
    certifications = extract_certifications(sections)
    experience = extract_experience(sections)
    languages = extract_languages(resume_text, sections, personal_information)
    achievements = extract_achievements(sections)
    summary = extract_summary(sections)

    if not summary:
        summary = clean_text(gemini_data.get("summary", ""))

    if not projects:
        projects = clean_list(gemini_data.get("projects", []))
    if not certifications:
        certifications = clean_list(gemini_data.get("certifications", []))
    if not experience:
        experience = clean_list(gemini_data.get("experience", []))

    current_profile = build_current_profile(
        education_details,
        skills,
        projects,
        certifications,
        experience,
        languages,
        achievements,
        personal_information,
    )

    recommended_courses = get_recommended_courses(education_details, skills)
    suitable_roles = build_suitable_roles(education_details, skills, projects)
    improve = build_improve(education_details, skills, projects, experience)
    next_steps = build_next_steps(education_details, skills, projects, recommended_courses)
    project_ideas = build_project_ideas(education_details)

    return {
        "summary": summary,
        "education": education_to_display(education_details),
        "education_details": education_details,
        "specialization": " + ".join(get_specializations(education_details)),
        "personal_information": personal_information,
        "skills": {
            "programming_languages": skills["programming_languages"],
            "web_technologies": skills["web_technologies"],
            "databases": skills["databases"],
            "tools_platforms": skills["tools_platforms"],
            "other": skills["other"],
            "details": skills["details"],
        },
        "projects": projects,
        "certifications": certifications,
        "internships_experience": experience,
        "languages": languages,
        "achievements": achievements,
        "career_analysis": {
            "what_you_already_have": current_profile,
            "current_profile": current_profile,
            "learn_next": recommended_courses,
            "jobs_you_can_apply_for": suitable_roles,
            "suitable_roles": suitable_roles,
            "what_you_should_improve": improve,
            "improve": improve,
            "your_next_step": next_steps,
            "next_steps": next_steps,
            "project_ideas": project_ideas,
        },
        "what_you_already_have": current_profile,
        "what_you_should_learn_next": recommended_courses,
        "jobs_you_can_apply_for": suitable_roles,
        "what_you_should_improve": improve,
        "your_next_step": next_steps,
        "profile_found": current_profile["profile_found"],
    }


# =========================================================
# UPLOAD
# =========================================================

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected.",
        )

    allowed_types = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported.",
        )

    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty.",
        )

    try:
        if file.content_type == "application/pdf":
            extracted_text = extract_pdf_text(content)
        else:
            extracted_text = extract_docx_text(content)
    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=f"Could not read resume: {str(error)}",
        )

    if not extracted_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Could not extract text from the resume.",
        )

    try:
        gemini_data = analyze_resume_with_gemini(
            extracted_text
        )
    except Exception:
        gemini_data = {}

    analysis = build_final_analysis(
        extracted_text,
        gemini_data,
    )

    try:
        new_resume = Resume(
            user_id=current_user.id,
            filename=file.filename,
            content_type=file.content_type,
            extracted_text=extracted_text,
            ai_analysis=json.dumps(
                analysis,
                ensure_ascii=False,
            ),
        )

        db.add(new_resume)
        db.commit()
        db.refresh(new_resume)

    except Exception as error:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Could not save resume: {str(error)}",
        )

    return {
        "message": "Resume analyzed and saved successfully.",
        "resume_id": new_resume.id,
        "user_id": current_user.id,
        "filename": file.filename,
        "text_length": len(extracted_text),
        "ai_analysis": analysis,
    }


# =========================================================
# LATEST
# =========================================================

@router.get("/latest")
def get_latest_resume(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.id.desc())
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="No resume found.",
        )

    try:
        analysis = json.loads(
            resume.ai_analysis
        )
    except Exception:
        analysis = {}

    return {
        "resume_id": resume.id,
        "filename": resume.filename,
        "extracted_text": resume.extracted_text,
        "ai_analysis": analysis,
    }
   