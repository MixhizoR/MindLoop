import google.generativeai as genai

def get_GOOGLE_API_KEY():
    try:
        with open("GEMINI_TOKEN.txt", "r", encoding="utf-8") as dosya:
            icerik = dosya.read()
            return icerik
    except FileNotFoundError:
            print("Token Dosya bulunamadı!")

def send_prompt(text):
    genai.configure(api_key=get_GOOGLE_API_KEY())

    model = genai.GenerativeModel('gemini-2.5-flash')

    response = model.generate_content(text)
    return response