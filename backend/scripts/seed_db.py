import sqlite3
import os

db_path = "../learning.db"

if not os.path.exists(db_path):
    print(f"Hata: {db_path} bulunamadı.")
    exit(1)

connection = sqlite3.connect(db_path)
cursor = connection.cursor()

with open("seed_cards.sql", "r", encoding="utf-8") as f:
    sql_script = f.read()

try:
    cursor.executescript(sql_script)
    connection.commit()
    print("SQL başarıyla çalıştırıldı. 3 kart eklendi.")
except Exception as e:
    print(f"Hata oluştu: {e}")
finally:
    connection.close()
