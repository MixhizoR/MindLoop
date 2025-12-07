"""
Gemini Model Checker

Bu script, .env dosyasındaki GEMINI_API_KEY'i kullanarak Google Gemini API'ye bağlanır
ve mevcut (kullanılabilir) modelleri listeler. 

Kullanım:
    python backend/scripts/check_gemini_models.py
    
Gereksinimler:
    - .env dosyasında GEMINI_API_KEY tanımlı olmalı.
    - google-generativeai ve python-dotenv kütüphaneleri yüklü olmalı.
"""

import os
import sys
import google.generativeai as genai
from dotenv import load_dotenv

# Add the parent directory to sys.path to ensure imports work if needed, 
# though for this simple script it might not be strictly necessary if run from proper context.
# Adjusting path to find .env effectively if run from scripts/ dir
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.append(backend_dir)

# Load .env from backend directory
dotenv_path = os.path.join(backend_dir, '.env')
load_dotenv(dotenv_path)

api_key = os.getenv('GEMINI_API_KEY')

if not api_key:
    print("Error: GEMINI_API_KEY not found in .env file.")
    print(f"Searched in: {dotenv_path}")
    exit(1)

genai.configure(api_key=api_key)

mask_key = f"{api_key[:5]}...{api_key[-5:]}" if len(api_key) > 10 else "***"
print(f"Checking models with API Key: {mask_key}")

try:
    print("\nAvailable 'generateContent' models:")
    print("-" * 30)
    found = False
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
            found = True
    
    if not found:
        print("No models found with generateContent capability.")
    print("-" * 30)

except Exception as e:
    print(f"Error listing models: {e}")
