# MindLoop 🧠
>
> **Mikro-Öğrenme & Aralıklı Tekrar (SRS) Platformu**

MindLoop, yüklediğiniz PDF ders notlarını Yapay Zeka (AI) kullanarak otomatik olarak soru-cevap kartlarına dönüştüren ve bu kartları **Aralıklı Tekrar (Spaced Repetition System - SRS)** yöntemiyle size sunan bir web uygulamasıdır. Öğrenme sürecinizi optimize etmek ve bilgileri kalıcı hafızaya atmak için tasarlanmıştır.

---

## 🚀 Özellikler

* **📄 Akıllı PDF Analizi:** Ders notlarınızı yükleyin, AI (Gemini/GPT) sizin için önemli kısımları çıkarıp kart yapsın.
* **🧠 SRS Algoritması:** SM-2 algoritmasının modernize edilmiş bir versiyonu ile kartları tam unutmaya başladığınız anda tekrar edin.
* **📊 İlerleme Takibi:** Günlük çalışma listeleri ve öğrenme durumunuzu ("Yeni", "Öğreniliyor", "Gözden Geçirildi") takip edin.
* **⚡ Hızlı ve Hafif:** Python (FastAPI) backend ve Vanilla JS frontend ile minimalist ve performanslı yapı.

---

## 🛠️ Teknoloji Yığını

Bu proje modern ve yönetilebilir bir teknoloji yığını üzerine inşa edilmiştir.

### Backend

* **Dil:** Python 3.10+
* **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Yüksek performanslı, async API)
* **Veritabanı:** SQLite & SQLAlchemy (Hafif ve taşınabilir veri saklama)
* **AI Motoru:** Google Gemini Flash veya OpenAI GPT-4o-mini
* **PDF İşleme:** `pdfplumber`

### Frontend

* **Core:** HTML5, CSS3
* **Logic:** Modern Vanilla JavaScript (ES6+)
* **Stil:** Özel CSS (Tailwind veya dış kütüphane bağımlılığı olmadan)

---

## 📂 Proje Yapısı

```
MindLoop/
├── .agent/              # Ajan ve workflow yapılandırmaları
├── backend/             # Python FastAPI sunucusu
│   ├── app/             # Uygulama kaynak kodları (Models, DB, Routes)
│   ├── resources/       # Statik kaynaklar
│   ├── learning.db      # SQLite veritabanı
│   ├── main.py          # Entry point
│   └── requirements.txt # Python bağımlılıkları
├── frontend/            # Kullanıcı arayüzü
│   ├── index.html       # Ana çalışma sayfası
│   ├── upload.html      # PDF yükleme sayfası
│   ├── app.js           # Frontend mantığı
│   └── style.css        # Tasarım dosyaları
├── TECHNICAL_SPEC.md    # Detaylı teknik dokümantasyon
└── README.md            # Proje dokümantasyonu
```

---

## ⚙️ Kurulum ve Çalıştırma

Projenin yerel makinenizde çalışması için aşağıdaki adımları takip edin.

### 1. Backend Kurulumu

Terminali açın ve `backend` klasörüne gidin:

```bash
cd backend
```

Sanal ortam (Virtual Environment) oluşturun ve aktif edin:

```bash
# Windows için
python -m venv venv
.\venv\Scripts\activate

# macOS/Linux için
python3 -m venv venv
source venv/bin/activate
```

Gerekli paketleri yükleyin:

```bash
pip install -r requirements.txt
```

`.env` dosyasını oluşturun:
`backend` klasörü içinde `.env` adında bir dosya oluşturun ve API anahtarınızı ekleyin (Örnek `.env.example` dosyasında mevcuttur).

```ini
GEMINI_API_KEY=Sizin_API_Anahtariniz_Buraya
# Veya OpenAI kullanıyorsanız ilgili key
```

Sunucuyu başlatın:

```bash
python main.py
# Veya: uvicorn app.main:app --reload
```

Backend `http://localhost:8000` adresinde çalışmaya başlayacaktır.

### 2. Frontend Kurulumu

Frontend tarafı saf HTML/JS olduğu için ekstra bir "build" işlemine gerek yoktur.

1. `frontend` klasörüne gidin.
2. `index.html` veya `upload.html` dosyasını tarayıcınızda açın.
    * Daha iyi bir deneyim için [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) (VS Code eklentisi) kullanmanız önerilir.

---

## 📖 Kullanım Senaryosu

1. **Kart Oluşturma:**
    * Web arayüzünden `Upload` sayfasına gidin.
    * Ders notunuzu (PDF) seçin ve yükleyin.
    * Sistem analizi yapıp kartları veritabanına kaydedene kadar bekleyin.

2. **Günlük Çalışma:**
    * Ana sayfayı açın.
    * "Günlük Çalışma Listesi" otomatik olarak yüklenecektir.
    * Kartın sorusunu okuyun, cevabı düşünün ve karta tıklayarak çevirin.
    * Cevabınızı ne kadar kolay hatırladığınıza göre **Zor**, **Orta** veya **Kolay** butonlarından birine basın.
    * Sistem bir sonraki tekrar tarihini akıllıca hesaplayacaktır.

---

## 🤝 Katkıda Bulunma

1. Bu projeyi forklayın.
2. Yeni bir özellik dalı (feature branch) oluşturun (`git checkout -b feature/YeniOzellik`).
3. Değişikliklerinizi commit edin (`git commit -m 'Yeni özellik eklendi'`).
4. Dalınızı pushlayın (`git push origin feature/YeniOzellik`).
5. Bir Pull Request (PR) oluşturun.

---

## 📄 Lisans

Bu proje MIT Lisansı ile lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakabilirsiniz.
