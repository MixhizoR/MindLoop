import resources.PdfAIEntegrations.pdf_to_text_converter as pdf
import resources.PdfAIEntegrations.gemini_manager as gemini

static_promt_path = "other/static_prompt.txt"


def get_static_prompt():
    try:
        with open(static_promt_path, "r", encoding="utf-8") as dosya:
            icerik = dosya.read()
            return icerik
    except FileNotFoundError:
            print("static_promt Dosya bulunamadı!")


def send_pdf_path_get_card_data(pdf_path):
    pdf_content = pdf.pdf_to_text_plumber(pdf_path)
    static_promt_content = get_static_prompt()
            
    finish_prompt = static_promt_content + pdf_content

    return gemini.send_prompt(finish_prompt)

def send_content_get_card_data(content):
    static_promt_content = get_static_prompt()

    finish_prompt = static_promt_content + content
    return gemini.send_prompt(finish_prompt)