from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
# Import models to ensure they are registered with Base.metadata
from .models import Card

# Import routers
try:
    from resources.API_EndPoints import pdf_upload_endpoint
    from resources.API_EndPoints import study_endpoint
except ImportError:
    import sys
    import os
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    from resources.API_EndPoints import pdf_upload_endpoint
    from resources.API_EndPoints import study_endpoint

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(title="MindLoop API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pdf_upload_endpoint.router)
app.include_router(study_endpoint.router)

# Frontend entegrasyonu:
# Frontend dosyalarının (HTML, CSS, JS) bulunduğu klasör yolu
frontend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../frontend'))

# 1. Ana sayfaya ("/") gidildiğinde index.html dönsün
@app.get("/")
async def read_index():
    return FileResponse(os.path.join(frontend_path, 'index.html'))

# 2. Diğer tüm statik dosyalar (app.js, style.css, resimler vb.) için frontend klasörünü bağla
# Not: API route'ları yukarıda tanımlandığı için önceliklidir.
app.mount("/", StaticFiles(directory=frontend_path), name="static")
