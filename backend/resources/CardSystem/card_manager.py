import resources.CardSystem.card_json_manager as card_json_manager

def get_card_list(json_string):
    return card_json_manager.get_card_list(json_string)

def get_card_list_for_path(path):
    return card_json_manager.get_card_list_for_path(path)

def save_cards(cards,path):
    card_json_manager.save_cards(cards,path)