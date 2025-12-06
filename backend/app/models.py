from datetime import date
from typing import Optional
from sqlalchemy import String, Text, Integer, Date
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base

class Card(Base):
    __tablename__ = "cards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    front: Mapped[str] = mapped_column(Text, nullable=False)
    back: Mapped[str] = mapped_column(Text, nullable=False)
    source_file: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    next_review_date: Mapped[Optional[date]] = mapped_column(Date, default=date.today)
    interval: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String, default="new")
