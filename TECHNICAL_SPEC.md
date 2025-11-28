# Proje: Mikro-Öğrenme & SRS MVP - Teknik Dokümantasyon

**Durum:** Taslak (Draft) v1.0
**Tarih:** 28 Kasım 2024
**Amaç:** PDF yükleyip yapay zeka ile soru kartı oluşturan ve bunları aralıklı tekrar (SRS) yöntemiyle sunan sistemin teknik detayları.

---

## 1. Teknoloji Yığını (Tech Stack)

* **Backend:** Python 3.10+, FastAPI
* **Database:** SQLite (Tek dosya: `learning.db`)
* **AI Service:** OpenAI API (GPT-4o-mini) veya Google Gemini Flash
* **Frontend:** HTML5, CSS3, Vanilla JavaScript (Fetch API)
* **Format:** JSON (Veri haberleşmesi için)

---

## 2. Veritabanı Tasarımı (Database Schema)

MVP kapsamında karmaşıklığı önlemek için tek bir ana tablo kullanılacaktır. Kullanıcı tablosu şimdilik yoktur (Single User varsayımı).

### Tablo: `cards`

Her bir satır bir "Flashcard"ı temsil eder.

| Kolon Adı | Veri Tipi | Açıklama | Örnek |
| :--- | :--- | :--- | :--- |
| `id` | Integer (PK) | Benzersiz kimlik | `1` |
| `front` | Text | Kartın ön yüzü (Soru) | `"Python'da liste nasıl tanımlanır?"` |
| `back` | Text | Kartın arka yüzü (Cevap) | `"Köşeli parantez [] ile."` |
| `source_file` | Text | Hangi PDF'ten geldiği | `"ders_notlari.pdf"` |
| `next_review_date` | Date (ISO) | Bir sonraki tekrar tarihi | `"2024-11-29"` |
| `interval` | Integer | Kaç gün sonra sorulacağı | `1` (Varsayılan: 1) |
| `status` | String | Kartın durumu | `"new"`, `"learning"`, `"reviewed"` |

---

## 3. Algoritma Mantığı (Backend Logic)

Kullanıcı bir kartı cevapladığında `next_review_date` ve `interval` şu mantığa göre güncellenir (Basitleştirilmiş SM-2):

**Girdi:** `rating` (Kullanıcının verdiği cevap kalitesi)

1. **Hard (Zor):** Hatırlayamadım veya çok zorlandım.
2. **Medium (Orta):** Hatırladım ama emin değildim.
3. **Easy (Kolay):** Çok rahat hatırladım.

**Mantık:**

* **Eğer `rating` == "Hard":**
  * `interval` = 1 (Yarın tekrar sor)
* **Eğer `rating` == "Medium":**
  * `interval` = `interval` * 1.5 (Süreyi %50 artır)
* **Eğer `rating` == "Easy":**
  * `interval` = `interval` * 2 (Süreyi ikiye katla)

**Sonuç:**

* Yeni Tarih (`new_date`) = `BUGÜN` + `interval` (gün)
* Veritabanında `next_review_date` ve `interval` güncellenir.

---

## 4. API Sözleşmesi (API Contract)

Frontend ve Backend bu endpointler üzerinden konuşacaktır.

### A. PDF Yükleme ve Kart Oluşturma

* **Endpoint:** `POST /api/upload`
* **Amaç:** PDF dosyasını alır, metni çıkarır, AI'a gönderir, gelen JSON'u DB'ye kaydeder.
* **Frontend Request (Form Data):**
  * Key: `file`, Value: `[ders_notu.pdf]`
* **Backend Response (JSON):**

    ```json
    {
      "status": "success",
      "message": "PDF işlendi, 12 yeni kart oluşturuldu.",
      "card_count": 12
    }
    ```

### B. Günlük Çalışma Listesini Getir

* **Endpoint:** `GET /api/study-daily`
* **Amaç:** Tarihi bugün veya geçmişte olan kartları listeler.
* **Frontend Request:** (Parametre yok)
* **Backend Response (JSON):**

    ```json
    {
      "data": [
        {
          "id": 101,
          "front": "HTTP açılımı nedir?",
          "back": "HyperText Transfer Protocol",
          "status": "learning"
        },
        {
          "id": 102,
          "front": "REST API'de GET ne işe yarar?",
          "back": "Veri okumak (Read) için kullanılır.",
          "status": "new"
        }
      ]
    }
    ```

### C. Cevap Gönderme (İlerleme Kaydı)

* **Endpoint:** `POST /api/submit-answer`
* **Amaç:** Kullanıcının karta verdiği tepkiyi kaydeder ve bir sonraki tarihi belirler.
* **Frontend Request (JSON Body):**

    ```json
    {
      "card_id": 101,
      "rating": "easy"
    }
    ```

    *(Not: rating değerleri sadece "easy", "medium", "hard" olabilir)*

* **Backend Response (JSON):**

    ```json
    {
      "status": "success",
      "new_interval": 4,
      "next_review": "2024-12-02",
      "message": "Kart güncellendi."
    }
    ```

---

## 5. Yapay Zeka Entegrasyonu (AI Prompt Strategy)

Backend tarafında PDF metni parçalandıktan sonra AI modeline (GPT/Gemini) şu sistem mesajı ile gönderilmelidir:

**System Prompt:**
> "Sen bir eğitim asistanısın. Sana verilen metni analiz et ve öğrenilmesi gereken temel kavramları belirle. Bu kavramları Soru (front) ve Cevap (back) çiftleri halinde hazırla. Cevaplar kısa ve net olsun.
>
> Çıktıyı SADECE geçerli bir JSON formatında ver. Başka hiçbir konuşma metni ekleme. Format şu şekilde olmalı:"
>
> `[{"front": "Soru buraya", "back": "Cevap buraya"}, {"front": "Soru 2", "back": "Cevap 2"}]`

---

## 6. Frontend Akışı ve Gerekli Ekranlar

1. **Upload Bölümü:**
    * Bir `<input type="file">` ve "Yükle" butonu.
    * Yükleme sırasında "Yükleniyor..." animasyonu (Loading state).
    * Başarılı olunca "X kart eklendi" mesajı.

2. **Çalışma Alanı (Study Zone):**
    * Sayfa açılınca `/api/study-daily` isteği atılır.
    * Gelen liste bir JavaScript dizisinde (Array) tutulur.
    * Ekranda sadece 1 kart görünür.
    * Karta tıklayınca arkası döner (CSS class: `.flipped`).
    * Arkası dönünce altında 3 buton çıkar: [Zor] [Orta] [Kolay].
    * Butona basınca `/api/submit-answer` isteği atılır ve sıradaki karta geçilir.
    * Liste bitince "Tebrikler, bugünkü çalışma bitti!" mesajı gösterilir.
