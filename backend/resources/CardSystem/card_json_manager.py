import json

def get_json_string(path):
    try:
        with open(path, "r", encoding="utf-8") as dosya:
            icerik = dosya.read()
            return icerik 
    except FileNotFoundError:
        print(f"Hata: Dosya bulunamadı: {path}")
        return None

def get_card_list(json_string):
    temiz_json_string = json_string.strip() 

    if temiz_json_string.startswith("```json"):
        temiz_json_string = temiz_json_string.replace("```json", "", 1)
    if temiz_json_string.endswith("```"):
        temiz_json_string = temiz_json_string.rstrip("```")
    
    temiz_json_string = temiz_json_string.strip()

    return json.loads(temiz_json_string)

def get_card_list_for_path(path):
    try:
        with open(path, "r", encoding="utf-8") as dosya:
            return json.load(dosya) 
    except FileNotFoundError:
        print(f"Hata: Dosya bulunamadı: {path}")
        return []
    except json.JSONDecodeError as e:
        print(f"Hata: '{path}' geçerli bir JSON dosyası değil. {e}")
        return []
    

def save_cards(cards, path):
    json_string = json.dumps(cards, indent=4, ensure_ascii=False) 

    try:
        with open(path, "w", encoding="utf-8") as dosya:
            dosya.write(json_string) 
        
        print(f"Başarılı: Kart verileri '{path}' dosyasına kaydedildi.")
        
    except Exception as e:
        print(f"Yazma hatası oluştu: {e}")