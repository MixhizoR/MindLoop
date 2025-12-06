from contextlib import asynccontextmanager
from fastapi import FastAPI
from .database import engine, Base
# Import models to ensure they are registered with Base.metadata
from .models import Card

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(title="MindLoop API", lifespan=lifespan)

@app.get("/")
def read_root():
    return {"message": "MindLoop API is running"}
