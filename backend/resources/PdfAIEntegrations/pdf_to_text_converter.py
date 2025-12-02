import pdfplumber

def pdf_to_text_plumber(pdf_path):
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            print(f"Toplam Sayfa Sayısı: {len(pdf.pages)}")
            
            for page in pdf.pages:
                # Metni çıkar
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        return text

    except Exception as e:
        return f"Hata oluştu: {e}"