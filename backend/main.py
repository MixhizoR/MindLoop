import resources.PdfAIEntegrations.ai_promt_manager as promt_manager
import resources.CardSystem.card_manager as card_manager

pdf_path = "C:/Users/nmnzd/Desktop/Ders/yazılıkmanalizi/hafta1_v3.pdf"
result = promt_manager.send_pdf_path_get_card_data(pdf_path)

cards = card_manager.get_card_list(result.text)

card_manager.save_cards(cards,"cikti1.json")