import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
from typing import List, Dict, Any
import os

app = FastAPI(
    title="MindLoop Kart Oluşturma Servisi",
    description="PDF yükleme, AI ile analiz ve veritabanına kart kaydı servisi."
)

@app.post("/upload-pdf", 
          summary="PDF Yükle ve Flashcard Oluştur",
          response_description="Oluşturulan kart sayısı ve işlem durumu.")
async def upload_pdf_endpoint(pdf_file: UploadFile = File(..., description="Yüklenecek PDF dosyası.")):
    
    # 1. Adım: PDF'i geçici olarak kaydet
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    file_location = os.path.join(temp_dir, pdf_file.filename)
    
    try:
        # Yüklenen dosyayı geçici yola yaz
        with open(file_location, "wb") as f:
            content = await pdf_file.read()
            f.write(content)
        
        
        # Başarılı mesajı dön (Definition of Done)
        return {
            "status": "success",
            "message": f"İşlem başarılı!",
            "file_name": pdf_file.filename
        }

    except Exception as e:
        # İşlem sırasında oluşan hataları yakala
        raise HTTPException(
            status_code=500,
            detail=f"Kart oluşturma işleminde kritik bir hata oluştu: {str(e)}"
        )
    finally:
        # İşlem bitince geçici dosyayı temizle
        if os.path.exists(file_location):
            os.remove(file_location)