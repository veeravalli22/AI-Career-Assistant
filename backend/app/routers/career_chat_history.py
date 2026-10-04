from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ChatSession, ChatMessage
from app.routers.auth import get_current_user

router = APIRouter(
    prefix="/api/v1/career-chat",
    tags=["AI Career Chat History"],
)


# ============================================================
# SCHEMAS
# ============================================================

class CreateSessionRequest(BaseModel):
    title: str = "New Chat"


class EditMessageRequest(BaseModel):
    content: str


# ============================================================
# CREATE NEW CHAT
# ============================================================

@router.post("/sessions")
def create_chat_session(
    request: CreateSessionRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = ChatSession(
        user_id=current_user.id,
        title=request.title.strip() or "New Chat",
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "success": True,
        "session": {
            "id": session.id,
            "title": session.title,
            "created_at": session.created_at,
            "updated_at": session.updated_at,
        },
    }


# ============================================================
# GET PREVIOUS CHATS
# ============================================================

@router.get("/sessions")
def get_chat_sessions(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )

    return {
        "success": True,
        "sessions": [
            {
                "id": session.id,
                "title": session.title,
                "created_at": session.created_at,
                "updated_at": session.updated_at,
            }
            for session in sessions
        ],
    }


# ============================================================
# GET MESSAGES OF ONE CHAT
# ============================================================

@router.get("/sessions/{session_id}")
def get_chat_session(
    session_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = (
        db.query(ChatSession)
        .filter(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id,
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Chat session not found.",
        )

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    return {
        "success": True,
        "session": {
            "id": session.id,
            "title": session.title,
            "created_at": session.created_at,
            "updated_at": session.updated_at,
        },
        "messages": [
            {
                "id": message.id,
                "role": message.role,
                "content": message.content,
                "created_at": message.created_at,
            }
            for message in messages
        ],
    }


# ============================================================
# EDIT MESSAGE
# ============================================================

@router.put("/messages/{message_id}")
def edit_chat_message(
    message_id: int,
    request: EditMessageRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    message = (
        db.query(ChatMessage)
        .join(ChatSession, ChatMessage.session_id == ChatSession.id)
        .filter(
            ChatMessage.id == message_id,
            ChatSession.user_id == current_user.id,
        )
        .first()
    )

    if not message:
        raise HTTPException(
            status_code=404,
            detail="Message not found.",
        )

    if message.role != "user":
        raise HTTPException(
            status_code=400,
            detail="Only user messages can be edited.",
        )

    new_content = request.content.strip()

    if not new_content:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty.",
        )

    session_id = message.session_id

    # Get all messages after the edited user message.
    later_messages = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.session_id == session_id,
            ChatMessage.id > message.id,
        )
        .all()
    )

    # Delete the old AI response and everything after the edited message.
    for later_message in later_messages:
        db.delete(later_message)

    # Update the original user message.
    message.content = new_content

    # Update chat session timestamp.
    chat_session = (
        db.query(ChatSession)
        .filter(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id,
        )
        .first()
    )

    if chat_session:
        from datetime import datetime, timezone
        chat_session.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(message)

    return {
        "success": True,
        "message": {
            "id": message.id,
            "role": message.role,
            "content": message.content,
            "created_at": message.created_at,
        },
        "session_id": session_id,
    }

# ============================================================
# DELETE CHAT
# ============================================================

@router.delete("/sessions/{session_id}")
def delete_chat_session(
    session_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = (
        db.query(ChatSession)
        .filter(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id,
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Chat session not found.",
        )

    db.query(ChatMessage).filter(
        ChatMessage.session_id == session.id
    ).delete()

    db.delete(session)
    db.commit()

    return {
        "success": True,
        "message": "Chat deleted successfully.",
    }