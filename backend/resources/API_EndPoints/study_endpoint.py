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
    
    # SM-2 Algorithm Implementation
    # Mapping inputs to Quality (q):
    # Hard: Recall failed (q=1) -> reset reps, interval=1
    # Medium: Hesitant recall (q=3) -> pass
    # Easy: Perfect recall (q=5) -> pass

    q = 0
    if answer.rating == "hard":
        q = 1
    elif answer.rating == "medium":
        q = 3
    elif answer.rating == "easy":
        q = 5
    
    # Current state
    reps = card.repetitions
    ef = card.easiness_factor
    interval = card.interval if card.interval is not None else 1
    
    if q < 3:
        # Failed
        reps = 0
        interval = 1
    else:
        # Passed
        reps += 1
        if reps == 1:
            interval = 1
        elif reps == 2:
            interval = 6
        else:
            interval = int(interval * ef)
        
        # Update EF
        ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        if ef < 1.3:
            ef = 1.3
            
    next_review = date.today() + timedelta(days=interval)
    
    # Update card
    card.interval = interval
    card.repetitions = reps
    card.easiness_factor = ef
    card.next_review_date = next_review
    # Update status to indicate it has been reviewed at least once if it was 'new'
    if card.status == 'new':
        card.status = 'learning' # Or 'reviewed'
    
    await db.commit()
    
    return {
        "status": "success",
        "new_interval": interval,
        "next_review": next_review.isoformat(),
        "message": "Kart güncellendi."
    }
