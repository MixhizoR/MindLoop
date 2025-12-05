document.addEventListener('DOMContentLoaded', () => {

    // ==================================================
    // 1. SAYFA KONTROLÜ (Hangi sayfadayız?)
    // ==================================================
    const isStudyPage = document.getElementById('cardContainer');
    const isUploadPage = document.getElementById('uploadBtn');

    // ==================================================
    // 2. ÇALIŞMA ALANI MANTIĞI (index.html)
    // ==================================================
    if (isStudyPage) {
        const cardContainer = document.getElementById('cardContainer');
        const flipCardInner = document.getElementById('flipCardInner');
        const actionButtons = document.getElementById('actionButtons');
        const messageBox = document.getElementById('messageBox');

        // İçerik alanları
        const questionEl = document.getElementById('cardQuestion');
        const answerEl = document.getElementById('cardAnswer');
        const cardCategory = document.getElementById('cardCategory');

        let studyQueue = [];
        let currentIndex = 0;
        let isFlipped = false;

        // Bildirim zamanlayıcısı (Hızlı geçişler için kontrol bizde)
        let toastTimeout;

        // --- MOCK API: Verileri Çekme ---
        function fetchDailyCards() {
            console.log("📡 API İsteği Simülasyonu: Veriler hazırlanıyor...");

            // 1. Önce hafızaya (LocalStorage) bakalım
            const storedData = localStorage.getItem('studyCards');

            if (storedData) {
                // Varsa onları kullan
                studyQueue = JSON.parse(storedData);
                console.log("✅ Hafızadan Yüklendi:", studyQueue);
            } else {
                // Yoksa (ilk açılışsa) varsayılan verileri yükle
                const defaultData = [
                    { id: 101, title: "Tarih", question: "İstanbul kaç yılında fethedildi?", answer: "1453" },
                    { id: 102, title: "Yazılım", question: "HTML'in açılımı nedir?", answer: "HyperText Markup Language" },
                    { id: 103, title: "Coğrafya", question: "Türkiye'nin en yüksek dağı?", answer: "Ağrı Dağı" }
                ];
                studyQueue = defaultData;
                localStorage.setItem('studyCards', JSON.stringify(defaultData));
                console.log("⚠️ Varsayılan veriler yüklendi.");
            }

            // İlk kartı ekrana bas
            if (studyQueue.length > 0) {
                loadCard(0);
            } else {
                showFinishMessage();
            }
        }

        // --- KARTI EKRANA BASMA ---
        function loadCard(index) {
            if (index >= studyQueue.length) {
                showFinishMessage();
                return;
            }

            const data = studyQueue[index];

            // Kartı sıfırla (Ön yüzü çevir)
            flipCardInner.classList.remove('is-flipped');
            isFlipped = false;

            // Butonları gizle
            actionButtons.classList.add('invisible', 'opacity-0');

            // İçerikleri doldur
            questionEl.textContent = data.question;
            answerEl.textContent = data.answer;
            if (cardCategory) cardCategory.textContent = data.title;
        }

        // --- KART DÖNDÜRME ---
        cardContainer.addEventListener('click', (e) => {
            hideToast(); // YENİ: Karta tıklayınca varsa bildirimi hemen gizle

            if (!isFlipped) {
                flipCardInner.classList.add('is-flipped');
                actionButtons.classList.remove('invisible', 'opacity-0');
                isFlipped = true;
            }
        });

        // --- YENİ: EKRANDA BOŞ YERE TIKLAYINCA BİLDİRİMİ GİZLE ---
        document.body.addEventListener('click', (e) => {
            // Eğer tıklanan yer buton veya kart değilse bildirimi kapat
            if (!e.target.closest('button') && !e.target.closest('.flip-card-container')) {
                hideToast();
            }
        });

        // --- YARDIMCI: BİLDİRİMİ GİZLEME ---
        function hideToast() {
            const toast = document.getElementById('toastNotification');
            if (toast) {
                toast.classList.add('opacity-0', 'translate-y-10');
            }
        }

        // --- CEVAP GÖNDERME (HIZLI BİLDİRİM MODU) ---
        window.submitAnswer = function (difficulty) {
            if (!isFlipped) return;

            // Varsa eski zamanlayıcıyı iptal et (Üst üste binmesin)
            if (toastTimeout) clearTimeout(toastTimeout);

            const currentCard = studyQueue[currentIndex];
            const nextIndex = currentIndex + 1;

            // 1. ALGORİTMA: Tarih Hesaplama
            const now = new Date();
            let nextReviewDate = new Date();
            let userMessage = "";

            if (difficulty === 'EASY') {
                nextReviewDate.setDate(now.getDate() + 3); // 3 Gün Sonra
                userMessage = "Süper! 3 gün sonraya planlandı.";
            } else if (difficulty === 'MEDIUM') {
                nextReviewDate.setDate(now.getDate() + 1); // 1 Gün Sonra
                userMessage = "Tamam, yarına planlandı.";
            } else {
                // Zor: Tarih değişmez (Hemen tekrar)
                userMessage = "Zorlandın mı? Yakında tekrar edelim.";
            }

            // Tarihi Türkçe formatına çevir
            const dateStr = nextReviewDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });

            // 2. TOAST BİLDİRİMİNİ GÖSTER (Seri Mod)
            const toast = document.getElementById('toastNotification');
            if (toast) {
                const toastText = document.getElementById('toastText');
                toastText.innerHTML = `${userMessage} <span class="text-gray-400 text-xs ml-1">(${dateStr})</span>`;

                // Önce gizle (resetle)
                toast.classList.add('opacity-0', 'translate-y-10');

                // Çok kısa bir gecikmeyle (10ms) tekrar göster (Animasyonu tetikle)
                setTimeout(() => {
                    toast.classList.remove('opacity-0', 'translate-y-10');
                }, 10);

                // 1.5 Saniye sonra otomatik gizle (Hızlı)
                toastTimeout = setTimeout(() => {
                    hideToast();
                }, 1500);
            }

            // 3. VERİTABANI GÜNCELLEME (LocalStorage)
            let allCards = JSON.parse(localStorage.getItem('studyCards')) || [];
            const updatedCards = allCards.map(card => {
                if (card.id === currentCard.id) {
                    return { ...card, nextReviewDate: nextReviewDate.toISOString() };
                }
                return card;
            });
            localStorage.setItem('studyCards', JSON.stringify(updatedCards));

            // 4. SONRAKİ KARTA GEÇİŞ
            if (nextIndex >= studyQueue.length) {
                showFinishMessage();
                return;
            }

            const nextCard = studyQueue[nextIndex];

            // Hile: Kart terstayken yeni soruyu yükle
            questionEl.textContent = nextCard.question;
            if (cardCategory) cardCategory.textContent = nextCard.title;

            flipCardInner.classList.remove('is-flipped');
            actionButtons.classList.add('invisible', 'opacity-0');
            isFlipped = false;

            // Animasyon süresi (1sn) kadar bekle, sonra cevabı değiştir
            setTimeout(() => {
                currentIndex++;
                answerEl.textContent = nextCard.answer;
            }, 1000);
        };

        // --- BİTİŞ EKRANI ---
        function showFinishMessage() {
            document.getElementById('cardContainer').classList.add('hidden');
            actionButtons.classList.add('hidden');
            messageBox.classList.remove('hidden');
            hideToast(); // Bitiş ekranında bildirim kalmasın
        }

        // --- BUTON DİNLEYİCİLERİ ---
        document.getElementById('markEasy').addEventListener('click', (e) => { e.stopPropagation(); window.submitAnswer('EASY'); });
        document.getElementById('markMedium').addEventListener('click', (e) => { e.stopPropagation(); window.submitAnswer('MEDIUM'); });
        document.getElementById('markHard').addEventListener('click', (e) => { e.stopPropagation(); window.submitAnswer('HARD'); });

        // --- FAVICON SİHİRBAZI ---
        const imagePath = 'mindLoop.jpeg'; // Dosya adın neyse buraya yaz
        const link = document.querySelector("link[rel~='icon']");
        if (link) {
            const canvas = document.createElement('canvas');
            canvas.width = 64; canvas.height = 64;
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.src = imagePath;
            img.onload = () => {
                ctx.beginPath(); ctx.arc(32, 32, 32, 0, Math.PI * 2, true); ctx.closePath(); ctx.clip();
                ctx.drawImage(img, 0, 0, 64, 64);
                link.href = canvas.toDataURL();
            };
        }

        // Başlat
        fetchDailyCards();
    }

    // ==================================================
    // 3. UPLOAD ALANI MANTIĞI (Gerçek JSON Dosya Okuma)
    // ==================================================
    if (isUploadPage) {
        const fileInput = document.getElementById('fileInput');
        const uploadBtn = document.getElementById('uploadBtn');
        const fileNameDisplay = document.getElementById('fileName');
        const fileNameArea = document.getElementById('fileNameArea');
        const uploadStatus = document.getElementById('uploadStatus');

        // Dosya Seçilince
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                fileNameDisplay.textContent = file.name;
                fileNameArea.classList.remove('hidden');
                fileNameArea.classList.add('flex');
                uploadBtn.disabled = false;
                uploadBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        });

        // Yükle Butonuna Basınca
        uploadBtn.addEventListener('click', () => {
            const file = fileInput.files[0];
            if (!file) return;

            const originalBtnText = uploadBtn.innerHTML;
            uploadBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Okunuyor...`;
            uploadBtn.disabled = true;

            // --- FİLE READER (DOSYA OKUYUCU) ---
            const reader = new FileReader();

            reader.onload = function (e) {
                try {
                    // 1. İçeriği al
                    const fileContent = e.target.result;

                    // 2. JSON'a çevir
                    const newQuestions = JSON.parse(fileContent);

                    // 3. Kontrol et (Liste mi?)
                    if (!Array.isArray(newQuestions)) {
                        throw new Error("Dosya formatı hatalı! Köşeli parantez [...] ile başlamalı.");
                    }

                    // 4. Eskileri al + Yenileri ekle
                    const existingData = JSON.parse(localStorage.getItem('studyCards')) || [];
                    const updatedData = existingData.concat(newQuestions);

                    // 5. Kaydet
                    localStorage.setItem('studyCards', JSON.stringify(updatedData));

                    // 6. Başarılı Mesajı
                    setTimeout(() => {
                        uploadBtn.innerHTML = originalBtnText;
                        uploadBtn.disabled = false;

                        uploadStatus.classList.remove('hidden');
                        uploadStatus.classList.add('bg-green-100', 'text-green-700', 'border', 'border-green-200');
                        uploadStatus.innerHTML = `<i class="fa-solid fa-circle-check"></i> <strong>Harika!</strong> ${newQuestions.length} yeni soru yüklendi.`;

                        fileInput.value = "";
                        fileNameArea.classList.add('hidden');
                        uploadBtn.disabled = true;
                        uploadBtn.classList.add('opacity-50');

                        console.log("✅ Yüklenen Sorular:", newQuestions);
                    }, 1000);

                } catch (error) {
                    uploadBtn.innerHTML = originalBtnText;
                    uploadBtn.disabled = false;
                    alert("Hata: " + error.message);
                    console.error("JSON Hatası:", error);
                }
            };

            // Okumayı başlat
            reader.readAsText(file);
        });
    }
});