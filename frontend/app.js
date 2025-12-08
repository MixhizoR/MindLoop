document.addEventListener('DOMContentLoaded', () => {

    // ==================================================
    // 🌍 GLOBAL AYARLAR & SEÇİCİLER
    // ==================================================
    // Backend portunun 8000 olduğundan emin ol (FastAPI varsayılanı)
    const BACKEND_URL = 'http://127.0.0.1:8000';
    console.log(`🚀 Uygulama Başlatıldı. API Hedefi: ${BACKEND_URL}`);

    const isStudyPage = document.getElementById('cardContainer');
    const isUploadPage = document.getElementById('uploadBtn');

    // ==================================================
    // 📚 BÖLÜM 1: ÇALIŞMA SAYFASI (Study Page - API Entegreli)
    // ==================================================
    if (isStudyPage) {
        // --- DOM Elements ---
        const cardContainer = document.getElementById('cardContainer');
        const flipCardInner = document.getElementById('flipCardInner');
        const actionButtons = document.getElementById('actionButtons');
        const messageBox = document.getElementById('messageBox');

        // Butonlar
        const markEasyBtn = document.getElementById('markEasy');
        const markMediumBtn = document.getElementById('markMedium');
        const markHardBtn = document.getElementById('markHard');

        // İçerik Alanları
        const questionEl = document.getElementById('cardQuestion');
        const answerEl = document.getElementById('cardAnswer');
        const cardCategory = document.getElementById('cardCategory');
        const toastNotification = document.getElementById('toastNotification');
        const toastText = document.getElementById('toastText');

        // State (Durum) Değişkenleri
        let studyQueue = [];
        let currentIndex = 0;
        let isFlipped = false;
        let toastTimeout;

        // --- Toast Bildirim Fonksiyonları ---
        function hideToast() {
            if (toastNotification) {
                toastNotification.classList.add('opacity-0', 'translate-y-10');
            }
        }

        // --- 1. KARTLARI ÇEK (BACKEND) ---
        async function fetchDailyCards() {
            try {
                console.log("⏳ Backend'e bağlanılıyor: /api/study-daily");
                questionEl.textContent = "Kartlar Yükleniyor...";

                const response = await fetch(`${BACKEND_URL}/api/study-daily`);
                if (!response.ok) throw new Error(`HTTP hatası! Durum: ${response.status}`);

                const data = await response.json();
                studyQueue = data.data || []; // API formatına göre ayarlandı

                console.log(`✅ ${studyQueue.length} kart yüklendi.`);

                if (studyQueue.length > 0) {
                    loadCard(0);
                } else {
                    showFinishMessage();
                }

            } catch (error) {
                console.error("❌ Kartlar çekilemedi:", error);
                if (questionEl) questionEl.textContent = "Bağlantı Hatası!";
                if (answerEl) answerEl.textContent = `Backend çalışıyor mu? (${BACKEND_URL})`;
            }
        }

        // --- 2. KARTI EKRANA BAS ---
        function loadCard(index) {
            if (index >= studyQueue.length) {
                showFinishMessage();
                return;
            }

            const data = studyQueue[index];

            // Kartı sıfırla
            flipCardInner.classList.remove('is-flipped');
            isFlipped = false;
            actionButtons.classList.add('invisible', 'opacity-0');

            // İçeriği doldur (Backend'den gelen 'front' ve 'back' key'lerine göre)
            questionEl.textContent = data.front || data.question;
            answerEl.textContent = data.back || data.answer;

            // Kategori veya Kaynak Dosya İsmi
            if (cardCategory) {
                cardCategory.textContent = data.source_file ? data.source_file.replace('.pdf', '') : 'Genel';
            }
        }

        // --- 3. KARTI ÇEVİR ---
        cardContainer.addEventListener('click', () => {
            hideToast();
            if (studyQueue.length > 0 && !isFlipped) {
                flipCardInner.classList.add('is-flipped');

                // Animasyon bitince butonları göster
                setTimeout(() => {
                    actionButtons.classList.remove('invisible', 'opacity-0');
                }, 300);

                isFlipped = true;
            }
        });

        // --- 4. CEVABI GÖNDER (API) ---
        window.submitAnswer = async function (difficulty) {
            const currentCard = studyQueue[currentIndex];
            if (!currentCard || !currentCard.id) return;

            try {
                const response = await fetch(`${BACKEND_URL}/api/submit-answer`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        card_id: currentCard.id,
                        rating: difficulty.toLowerCase() // "EASY" -> "easy"
                    })
                });

                if (!response.ok) throw new Error(`API Hatası: ${response.status}`);

                const result = await response.json();

                // Kullanıcıya geri bildirim (Toast)
                let userMessage = "";
                if (difficulty === 'EASY') userMessage = "Süper! Çok iyi hatırladın. 🎉";
                else if (difficulty === 'MEDIUM') userMessage = "Güzel, yakında tekrar edelim. 👍";
                else userMessage = "Zorlandın mı? Sık tekrar lazım. 💪";

                const dateStr = new Date(result.next_review).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });

                toastText.innerHTML = `${userMessage} <span class="text-gray-400 text-xs ml-1">(Tarih: ${dateStr})</span>`;
                toastNotification.classList.remove('opacity-0', 'translate-y-10');

                if (toastTimeout) clearTimeout(toastTimeout);
                toastTimeout = setTimeout(hideToast, 3000);

                // Sonraki karta geç
                const nextIndex = currentIndex + 1;
                if (nextIndex >= studyQueue.length) {
                    setTimeout(showFinishMessage, 800);
                } else {
                    // Kart geçiş animasyonu
                    flipCardInner.classList.remove('is-flipped');
                    actionButtons.classList.add('invisible', 'opacity-0');
                    isFlipped = false;
                    setTimeout(() => {
                        currentIndex++;
                        loadCard(currentIndex);
                    }, 800);
                }

            } catch (error) {
                console.error("Cevap gönderilemedi:", error);
                alert("Cevap kaydedilirken hata oluştu!");
            }
        };

        // --- Bitiş Ekranı ---
        function showFinishMessage() {
            document.getElementById('cardContainer').classList.add('hidden');
            actionButtons.classList.add('hidden');
            messageBox.classList.remove('hidden');
            hideToast();
        }

        // --- Event Listeners ---
        if (markEasyBtn) markEasyBtn.addEventListener('click', (e) => { e.stopPropagation(); window.submitAnswer('EASY'); });
        if (markMediumBtn) markMediumBtn.addEventListener('click', (e) => { e.stopPropagation(); window.submitAnswer('MEDIUM'); });
        if (markHardBtn) markHardBtn.addEventListener('click', (e) => { e.stopPropagation(); window.submitAnswer('HARD'); });

        // Uygulamayı Başlat
        fetchDailyCards();
    }

    // ==================================================
    // 📤 BÖLÜM 2: YÜKLEME SAYFASI (Upload Page - Polling Mantığı)
    // ==================================================
    if (isUploadPage) {
        console.log("📂 Upload Sayfası Aktif.");

        const fileInput = document.getElementById('fileInput');
        const uploadBtn = document.getElementById('uploadBtn');
        const fileNameDisplay = document.getElementById('fileName');
        const fileNameArea = document.getElementById('fileNameArea');
        const uploadStatus = document.getElementById('uploadStatus');

        let pollingInterval = null;
        let consecutiveErrors = 0;
        const MAX_RETRIES = 3;

        // Dosya Seçilince
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                fileNameDisplay.textContent = file.name;
                fileNameArea.classList.remove('hidden');
                fileNameArea.classList.add('flex');

                uploadBtn.disabled = false;
                uploadBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                uploadBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Kartları Oluştur`;
                uploadStatus.classList.add('hidden');
            }
        });

        // Yükleme Butonu
        uploadBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const file = fileInput.files[0];
            if (!file) return;

            const originalBtnText = `<i class="fa-solid fa-wand-magic-sparkles"></i> Kartları Oluştur`;

            // UI: Yükleniyor durumu
            uploadBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up fa-fade"></i> Yükleniyor...`;
            uploadBtn.disabled = true;
            uploadBtn.classList.add('opacity-75', 'cursor-wait');

            uploadStatus.classList.remove('hidden');
            uploadStatus.className = 'p-3 rounded-lg text-sm bg-blue-50 text-blue-700 border border-blue-200 mt-4 animate-pulse block';
            uploadStatus.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Dosya sunucuya gönderiliyor...`;

            try {
                const formData = new FormData();
                formData.append('pdf_file', file); // Backend'in beklediği key: 'pdf_file'

                // 1. Dosyayı Gönder
                const response = await fetch(`${BACKEND_URL}/pdf/upload-pdf`, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error(`HTTP Hata: ${response.status}`);

                const data = await response.json();
                console.log("Task ID alındı:", data.task_id);

                // UI: AI İşleniyor durumu
                uploadBtn.innerHTML = `<i class="fa-solid fa-brain fa-bounce"></i> AI Kartları Oluşturuyor...`;
                uploadStatus.className = 'p-3 rounded-lg text-sm bg-indigo-50 text-indigo-700 border border-indigo-200 mt-4 block';
                uploadStatus.innerHTML = `<i class="fa-solid fa-microchip"></i> <strong>İşleniyor...</strong> Yapay zeka içeriği analiz ediyor, lütfen bekleyin.`;

                // 2. İşlemi Takip Et (Polling)
                startPolling(data.task_id, originalBtnText, file.name);

            } catch (error) {
                console.error("Upload Hatası:", error);
                handleError(error, originalBtnText, true);
            }
        });

        // Polling Fonksiyonu (Task durumunu sorar)
        function startPolling(taskId, originalBtnText, originalFileName) {
            consecutiveErrors = 0;
            if (pollingInterval) clearInterval(pollingInterval);

            pollingInterval = setInterval(async () => {
                try {
                    const res = await fetch(`${BACKEND_URL}/pdf/task/${taskId}`);

                    if (!res.ok) {
                        if (res.status === 404) throw new Error("Task bulunamadı");
                        else throw new Error("Sunucu yanıt vermiyor");
                    }

                    const result = await res.json();
                    console.log("Durum:", result.status);

                    if (result.status === 'completed') {
                        clearInterval(pollingInterval);
                        showSuccessUI(result.data ? result.data.length : 'Birkaç', originalBtnText);
                    } else if (result.status === 'failed') {
                        clearInterval(pollingInterval);
                        handleError(new Error(result.error || "İşlem başarısız."), originalBtnText, true);
                    }
                    // 'processing' veya 'pending' ise devam et...

                } catch (error) {
                    console.warn("Polling hatası:", error);
                    consecutiveErrors++;
                    if (consecutiveErrors >= MAX_RETRIES) {
                        clearInterval(pollingInterval);
                        handleError(new Error("Bağlantı koptu."), originalBtnText, true);
                    }
                }
            }, 2000); // 2 saniyede bir sor
        }

        // Başarı Ekranı ve Yönlendirme
        function showSuccessUI(count, originalBtnText) {
            uploadBtn.innerHTML = `<i class="fa-solid fa-check"></i> Tamamlandı`;
            uploadBtn.disabled = false;
            uploadBtn.classList.remove('cursor-wait', 'opacity-75');
            fileInput.value = "";
            fileNameArea.classList.add('hidden');

            uploadStatus.className = 'p-4 rounded-lg text-sm bg-green-100 text-green-800 border border-green-200 mt-4 shadow-sm block';
            uploadStatus.innerHTML = `
                <div class="flex flex-col items-center gap-2">
                    <div class="flex items-center gap-3">
                        <i class="fa-solid fa-circle-check text-2xl"></i>
                        <div>
                            <h4 class="font-bold">İşlem Başarılı!</h4>
                            <p>${count} yeni kart hazırlandı.</p>
                        </div>
                    </div>
                    <div class="text-xs font-semibold text-green-700 mt-2">
                        <i class="fa-solid fa-spinner fa-spin"></i> Çalışma sayfasına yönlendiriliyorsunuz...
                    </div>
                </div>
            `;

            // 2 Saniye sonra ana sayfaya at
            setTimeout(() => {
                window.location.href = "index.html";
            }, 2000);
        }

        // Hata Gösterimi
        function handleError(error, originalBtnText, isFatal = false) {
            if (isFatal) {
                uploadBtn.innerHTML = originalBtnText;
                uploadBtn.disabled = false;
                uploadBtn.classList.remove('opacity-75', 'cursor-wait');

                uploadStatus.className = 'p-3 rounded-lg text-sm bg-red-100 text-red-700 border border-red-200 mt-4 block';
                uploadStatus.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> <strong>Hata:</strong> ${error.message}`;
                uploadStatus.classList.remove('hidden');
            }
        }
    }

    // ==================================================
    // 🎨 EKSTRA: FAVICON DÜZELTME (Logoyu yuvarlak yap)
    // ==================================================
    const imagePath = 'mindloop.jpeg'; // Resim yolunun doğru olduğundan emin ol
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
});