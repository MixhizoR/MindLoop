import asyncio
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, status
import os
import uuid
import tempfile # <--- BU SATIR ÇOK ÖNEMLİ
from typing import Dict, Any
import time

# Kendi proje yapına göre importları kontrol et
from app.models import Card
from app.database import AsyncSessionLocal 
from resources.PdfAIEntegrations.ai_promt_manager import send_pdf_path_get_card_data

router = APIRouter(prefix="/pdf", tags=["PDF İşleme"])

TASKS: Dict[str, Any] = {}

async def full_background_process(task_id: str, file_bytes: bytes, original_filename: str):

    await asyncio.sleep(1)
    
    temp_path = None
    try:
        # --- DÜZELTME BURADA ---
        # Dosyayı projenin içine DEĞİL, bilgisayarın geçici klasörüne kaydediyoruz.
        # Bu sayede VS Code değişikliği görüp sayfayı yenilemez.
        temp_dir = tempfile.gettempdir() 
        temp_path = os.path.join(temp_dir, f"{task_id}_{original_filename}")
        
        with open(temp_path, "wb") as f:
            f.write(file_bytes)

        # AI İşlemi
        cards_data = send_pdf_path_get_card_data(temp_path)

        #cards_data = [{"front": "Soru buraya", "back": "Cevap buraya"}, {"front": "Soru 2", "back": "Cevap 2"}]
        #time.sleep(10)
        
        if not cards_data:
            TASKS[task_id] = {"status": "failed", "error": "AI içerikten soru çıkaramadı."}
            return

        # Veritabanı Kayıt
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
            
            TASKS[task_id] = {
                "status": "completed", 
                "data": cards_data, 
                "card_count": len(new_cards)
            }

    except Exception as e:
        print(f"Background Task Hatası: {e}")
        TASKS[task_id] = {"status": "failed", "error": "Hata"}
        
    finally:
        if temp_path and os.path.exists(temp_path):
            try: os.remove(temp_path)
            except: pass

@router.post("/upload-pdf", status_code=status.HTTP_202_ACCEPTED)
async def upload_pdf_endpoint(background_tasks: BackgroundTasks, pdf_file: UploadFile = File(...)):
    # 1. Task ID
    task_id = str(uuid.uuid4())
    
    # 2. Dosyayı RAM'e Oku
    file_bytes = await pdf_file.read()
    
    # 3. İşlem Başlat
    TASKS[task_id] = {"status": "processing"}
    background_tasks.add_task(full_background_process, task_id, file_bytes, pdf_file.filename)

    # 4. Hemen Cevap Dön
    return {"task_id": task_id, "status": "queued", "message": "İşleme alındı."}

@router.get("/task/{task_id}")
async def get_task_status(task_id: str):
    task = TASKS.get(task_id)
    if not task: raise HTTPException(status_code=404, detail="Task bulunamadı.")
    return task