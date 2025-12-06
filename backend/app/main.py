from contextlib import asynccontextmanager
from fastapi import FastAPI
from .database import engine, Base
# Import models to ensure they are registered with Base.metadata
from .models import Card

# Import routers
try:
    from resources.API_EndPoints import pdf_upload_endpoint
except ImportError:
    # Handle case where resources is not in python path (e.g. running from wrong dir)
    import sys
    import os
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    from resources.API_EndPoints import pdf_upload_endpoint

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(title="MindLoop API", lifespan=lifespan)

# Include routers
app.include_router(pdf_upload_endpoint.router)

@app.get("/")
def read_root():
    return {"message": "MindLoop API is running"}
