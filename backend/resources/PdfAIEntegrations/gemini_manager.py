import os
import google.generativeai as genai
from dotenv import load_dotenv



def get_GOOGLE_API_KEY():
    load_dotenv()
    return os.getenv('GEMINI_TOKEN')

def send_prompt(text):
    genai.configure(api_key=get_GOOGLE_API_KEY())

    model = genai.GenerativeModel('gemini-2.5-flash')

    response = model.generate_content(text)
    return response