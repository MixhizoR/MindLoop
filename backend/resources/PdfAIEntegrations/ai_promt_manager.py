import json
from resources.PdfAIEntegrations.pdf_to_text_converter import pdf_to_text_plumber
from resources.PdfAIEntegrations.gemini_manager import send_prompt

SYSTEM_PROMPT = """
Sen bir eğitim asistanısın. Sana verilen metni analiz et ve öğrenilmesi gereken temel kavramları belirle. 
Bu kavramları Soru (front) ve Cevap (back) çiftleri halinde hazırla. Cevaplar kısa ve net olsun.

Çıktıyı SADECE geçerli bir JSON formatında ver. Başka hiçbir konuşma metni ekleme.
Format şu şekilde olmalı:
[{"front": "Soru buraya", "back": "Cevap buraya"}, {"front": "Soru 2", "back": "Cevap 2"}]
"""

def clean_json_response(response_text):
    """Clean markdown formatting from AI response"""
    cleaned = response_text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned.replace("```json", "", 1)
    if cleaned.startswith("```"):
        cleaned = cleaned.replace("```", "", 1)
    if cleaned.endswith("```"):
        cleaned = cleaned.rsplit("```", 1)[0]
    return cleaned.strip()

def send_pdf_path_get_card_data(pdf_path):
    """
    Reads PDF, constructs prompt, sends to Gemini, and parses JSON response.
    Returns a list of dictionaries (cards).
    """
    pdf_content = pdf_to_text_plumber(pdf_path)
    
    # Limit content length to avoid token limits (basic check)
    # In a production app, chunks should be handled better.
    if len(pdf_content) > 30000:
        pdf_content = pdf_content[:30000] + "... (truncated)"
        
    final_prompt = f"{SYSTEM_PROMPT}\n\nİşlenecek Metin:\n{pdf_content}"

    gemini_response = send_prompt(final_prompt)
    
    try:
        if not gemini_response.text:
            return []
            
        json_str = clean_json_response(gemini_response.text)
        cards_data = json.loads(json_str)
        return cards_data
    except Exception as e:
        print(f"JSON Parsing Error: {e}")
        print(f"Raw Response: {gemini_response.text}")
        return []

def send_content_get_card_data(content):
    final_prompt = f"{SYSTEM_PROMPT}\n\nİşlenecek Metin:\n{content}"
    gemini_response = send_prompt(final_prompt)
    
    try:
        json_str = clean_json_response(gemini_response.text)
        cards_data = json.loads(json_str)
        return cards_data
    except Exception as e:
        print(f"JSON Parsing Error: {e}")
        return []