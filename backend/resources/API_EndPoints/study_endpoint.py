from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date, timedelta
from typing import Literal, List
from pydantic import BaseModel

# Try-except block to handle imports depending on execution context
try:
    from app.database import get_db
    from app.models import Card
except ImportError:
    import sys
    import os
    # Add backend directory to sys.path if not present
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))
    from app.database import get_db
    from app.models import Card

router = APIRouter(
    prefix="/api",
    tags=["Study"]
)

# Pydantic Schemas
class StudyCardResponse(BaseModel):
    id: int
    front: str
    back: str
    status: str

class StudyListResponse(BaseModel):
    data: List[StudyCardResponse]

class SubmitAnswerRequest(BaseModel):
    card_id: int
    rating: Literal['easy', 'medium', 'hard']

class SubmitAnswerResponse(BaseModel):
    status: str
    new_interval: int
    next_review: str
    message: str

@router.get("/study-daily", response_model=StudyListResponse)
async def get_study_daily(db: AsyncSession = Depends(get_db)):
    """
    Get cards scheduled for review today or earlier.
    """
    today = date.today()
    # Select cards where next_review_date is null (new) or <= today
    # Note: Spec says <= Today. Logic usually implies new cards should also be shown or have a date.
    # Model default is date.today for next_review_date. So new cards are valid for today.
    query = select(Card).where(Card.next_review_date <= today)
    result = await db.execute(query)
    cards = result.scalars().all()
    
    return {
        "data": [
            {
                "id": card.id,
                "front": card.front,
                "back": card.back,
                "status": card.status
            } for card in cards
        ]
    }

@router.post("/submit-answer", response_model=SubmitAnswerResponse)
async def submit_answer(
    answer: SubmitAnswerRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Submit an answer for a card and update its schedule based on SM-2 simplified logic.
    """
    query = select(Card).where(Card.id == answer.card_id)
    result = await db.execute(query)
    card = result.scalar_one_or_none()
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    # Calculate new interval
    current_interval = card.interval if card.interval is not None else 1
    
    if answer.rating == "hard":
        new_interval = 1
    elif answer.rating == "medium":
        new_interval = int(current_interval * 1.5)
    elif answer.rating == "easy":
        new_interval = current_interval * 2
    else:
        new_interval = 1 # Fallback
        
    next_review = date.today() + timedelta(days=new_interval)
    
    # Update card
    card.interval = new_interval
    card.next_review_date = next_review
    # Update status to indicate it has been reviewed at least once if it was 'new'
    if card.status == 'new':
        card.status = 'learning' # Or 'reviewed'
    
    await db.commit()
    
    return {
        "status": "success",
        "new_interval": new_interval,
        "next_review": next_review.isoformat(),
        "message": "Kart güncellendi."
    }
