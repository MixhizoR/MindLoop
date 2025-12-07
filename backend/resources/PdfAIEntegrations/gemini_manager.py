import os
import google.generativeai as genai
from dotenv import load_dotenv



def get_GOOGLE_API_KEY():
    load_dotenv()
    return os.getenv('GEMINI_API_KEY')

def send_prompt(text):
    api_key = get_GOOGLE_API_KEY()
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in environment variables.")
        
    genai.configure(api_key=api_key)

    model = genai.GenerativeModel('gemini-2.5-flash')

    response = model.generate_content(text)
    return response