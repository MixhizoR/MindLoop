from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, status
import os
import uuid
import shutil
from typing import Dict, Any

# Veritabanı ve Model importları
from app.models import Card
# DİKKAT: Arka planda DB işlemi için session factory'ye ihtiyacımız var.
# Genelde database.py içinde 'SessionLocal' veya 'async_session_maker' adıyla tanımlıdır.
from app.database import AsyncSessionLocal 
from resources.PdfAIEntegrations.ai_promt_manager import send_pdf_path_get_card_data

router = APIRouter(
    prefix="/pdf",
    tags=["PDF İşleme"] 
)

# Geçici hafıza (Prodüksiyonda Redis veya DB tablosu kullanılmalı)
# Yapı: { "task_id": { "status": "processing" | "completed" | "failed", "data": ... } }
TASKS: Dict[str, Any] = {}

async def process_pdf_background(task_id: str, file_path: str, original_filename: str):
    """
    Arka planda çalışacak asıl işçi fonksiyon.
    """
    try:
        # 1. AI İşlemi
        cards_data = send_pdf_path_get_card_data(file_path)
        
        if not cards_data:
            TASKS[task_id] = {"status": "failed", "error": "AI veri üretemedi."}
            return

        # 2. Veritabanına Kayıt
        # Not: BackgroundTask içinde Depends(get_db) çalışmaz, yeni bir session açmalıyız.
        async with AsyncSessionLocal() as db:
            new_cards = []
            for card_item in cards_data:
                new_card = Card(
                    front=card_item.get("front"),
                    back=card_item.get("back"),
                    source_file=original_filename,
                    status="new",
                    interval=1,
                    repetitions=0,
                    easiness_factor=2.5
                )
                db.add(new_card)
                new_cards.append(new_card)
            
            await db.commit()
            
            # Veritabanı nesnelerini dict'e çevirip task sonucuna ekleyelim (JSON serileştirme için)
            # Basitlik adına cards_data'yı dönüyoruz.
            TASKS[task_id] = {
                "status": "completed", 
                "data": cards_data,
                "card_count": len(new_cards)
            }

    except Exception as e:
        import traceback
        traceback.print_exc()
        TASKS[task_id] = {"status": "failed", "error": str(e)}
        
    finally:
        # 3. Temizlik
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass

@router.post("/upload-pdf", 
             status_code=status.HTTP_202_ACCEPTED,
             summary="PDF Yükle (Asenkron)",
             response_description="İşlem başlatıldı ve Task ID döndürüldü.")
async def upload_pdf_endpoint(
    background_tasks: BackgroundTasks,
    pdf_file: UploadFile = File(..., description="Yüklenecek PDF dosyası.")
):
    # 1. Task ID Oluştur
    task_id = str(uuid.uuid4())
    
    # 2. Dosyayı Diske Kaydet 
    # (Dosya içeriğini memory'de tutup background'a atmak risklidir, diske yazmak en iyisi)
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    file_location = os.path.join(temp_dir, f"{task_id}_{pdf_file.filename}")
    
    with open(file_location, "wb") as f:
        content = await pdf_file.read()
        f.write(content)

    # 3. Task Durumunu 'Processing' Olarak İşaretle
    TASKS[task_id] = {"status": "processing"}

    # 4. Arka Plan Görevini Kuyruğa Ekle
    background_tasks.add_task(
        process_pdf_background, 
        task_id, 
        file_location, 
        pdf_file.filename
    )

    # 5. Anında Cevap Dön (Fire and Forget)
    return {
        "task_id": task_id,
        "status": "processing",
        "message": "PDF yüklendi, arka planda işleniyor. Durumu /task/{task_id} adresinden kontrol edin."
    }

@router.get("/task/{task_id}", summary="İşlem Durumu Sorgula")
async def get_task_status(task_id: str):
    task = TASKS.get(task_id)
    
    if not task:
        raise HTTPException(status_code=404, detail="Task bulunamadı.")
        
    if task["status"] == "processing":
        return {"status": "processing"}
    
    if task["status"] == "failed":
        return {"status": "failed", "error": task.get("error")}
        
    # status == completed
    return {
        "status": "completed",
        "data": task.get("data"),
        "card_count": task.get("card_count")
    }