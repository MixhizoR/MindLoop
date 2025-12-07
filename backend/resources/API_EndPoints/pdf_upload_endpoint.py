from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
import os
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import Card
from resources.PdfAIEntegrations.ai_promt_manager import send_pdf_path_get_card_data

router = APIRouter(
    prefix="/pdf",
    tags=["PDF İşleme"] 
)

@router.post("/upload", 
             summary="PDF Yükle ve Flashcard Oluştur",
             response_description="Oluşturulan kart sayısı ve işlem durumu.")
async def upload_pdf_endpoint(
    pdf_file: UploadFile = File(..., description="Yüklenecek PDF dosyası."),
    db: AsyncSession = Depends(get_db)
):
    
    # 1. Adım: PDF'i geçici olarak kaydet
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    file_location = os.path.join(temp_dir, pdf_file.filename)
    
    try:
        with open(file_location, "wb") as f:
            content = await pdf_file.read()
            f.write(content)
        
        # 2. ve 3. Adım: PDF İşleme ve AI Kart Üretimi (Modüler Yapı)
        # ai_promt_manager içindeki fonksiyon hem metni çıkarır hem de AI'dan JSON döner.
        cards_data = send_pdf_path_get_card_data(file_location)
        
        if not cards_data:
             raise HTTPException(status_code=500, detail="AI kart üretemedi veya format hatası oluştu.")

        # 4. Adım: Veritabanına kaydet
        new_cards = []
        for card_item in cards_data:
            new_card = Card(
                front=card_item.get("front"),
                back=card_item.get("back"),
                source_file=pdf_file.filename,
                status="new",
                interval=1,
                repetitions=0,
                easiness_factor=2.5 # Varsayılan SM-2 değeri
            )
            db.add(new_card)
            new_cards.append(new_card)
            
        await db.commit()
        
        return {
            "status": "success",
            "message": f"PDF başarıyla işlendi. {len(new_cards)} yeni kart oluşturuldu.",
            "card_count": len(new_cards),
            "cards_preview": cards_data[:3]
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"İşlem hatası: {str(e)}"
        )
    finally:
        # Temizlik
        if os.path.exists(file_location):
             # Dosya kilitli kalmaması için küçük bir güvenlik önlemi denenebilir ama 
             # basitçe remove genellikle yeterlidir.
             try:
                os.remove(file_location)
             except Exception:
                pass