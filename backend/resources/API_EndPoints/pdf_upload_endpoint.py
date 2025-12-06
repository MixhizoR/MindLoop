from fastapi import APIRouter, UploadFile, File, HTTPException
import os

# Sadece router nesnesini tanımlıyoruz. 
# Prefix'i, URL'nin /pdf ile başlamasını sağlar.
router = APIRouter(
    prefix="/pdf",
    tags=["PDF İşleme"] # 'Kullanıcı Yönetimi' yerine 'PDF İşleme' daha uygun
)

@router.post("/upload", 
             summary="PDF Yükle ve Flashcard Oluştur",
             response_description="Oluşturulan kart sayısı ve işlem durumu.")
# Endpoint artık /pdf/upload URL'sinde erişilebilir.
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
        
        # Buraya AI ve DB kaydetme mantığınız gelecek
        
        # Başarılı mesajı dön
        return {
            "status": "success",
            "message": f"PDF başarıyla yüklendi ve işlenmeye hazır. Dosya: {pdf_file.filename}",
            "endpoint_url": "/pdf/upload"
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