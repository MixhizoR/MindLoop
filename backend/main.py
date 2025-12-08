from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# PDF Router'ınızı import edin (Dosya adınız pdf_router.py ise)
import  resources.API_EndPoints.pdf_upload_endpoint as pdf_upload_endpoint
# veya kodlarınız tek dosyadaysa router değişkenini aşağıda include edin.

app = FastAPI()

# ==========================================
# 1. CORS AYARLARI (BU KISIM EKSİK OLABİLİR)
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Geliştirme aşamasında herkese izin ver
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, OPTIONS vb. hepsine izin ver
    allow_headers=["*"],
)

# Router'ı dahil et
app.include_router(pdf_upload_endpoint.router)

# Test Endpoint
@app.get("/")
def read_root():
    return {"message": "API Çalışıyor"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)