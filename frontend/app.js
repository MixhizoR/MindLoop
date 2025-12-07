document.addEventListener('DOMContentLoaded', () => {

    // ==================================================
    // GLOBAL SELECTORS & PAGE CHECK
    // ==================================================
    // NOT: Backend'e istek atarken port numarasının doğru olduğundan emin olun (Örn: 8000)
    const BACKEND_URL = 'http://127.0.0.1:8000';

    const isStudyPage = document.getElementById('cardContainer');
    const isUploadPage = document.getElementById('uploadBtn');

    // ==================================================
    // PART 1: STUDY PAGE LOGIC (index.html)
    // ==================================================
    if (isStudyPage) {
        // DOM Elements
        const cardContainer = document.getElementById('cardContainer');
        const flipCardInner = document.getElementById('flipCardInner');
        const actionButtons = document.getElementById('actionButtons');
        const messageBox = document.getElementById('messageBox');

        // Content Elements
        const questionEl = document.getElementById('cardQuestion');
        const answerEl = document.getElementById('cardAnswer');
        const cardCategory = document.getElementById('cardCategory');
        const toastNotification = document.getElementById('toastNotification');
        const toastText = document.getElementById('toastText');

        // State Variables
        let studyQueue = [];
        let currentIndex = 0;
        let isFlipped = false;
        let toastTimeout;

        // --- TOAST ve Hata Fonksiyonları ---
        function hideToast() {
            if (toastNotification) {
                toastNotification.classList.add('opacity-0', 'translate-y-10');
            }
        }

        document.body.addEventListener('click', (e) => {
            if (!e.target.closest('button') && !e.target.closest('.flip-card-container')) {
                hideToast();
            }
        });

        // --- 1. INITIALIZE DATA (BACKEND BAĞLANTISI) ---
        async function fetchDailyCards() {
            try {
                console.log("⏳ Backend'e bağlanılıyor: /api/study-daily");
                questionEl.textContent = "Kartlar Yükleniyor..."; // Yükleme durumunu göster

                // API Sözleşmesine göre GET isteği: /api/study-daily
                const response = await fetch(`${BACKEND_URL}/api/study-daily`);

                if (!response.ok) {
                    throw new Error(`HTTP hatası! Durum: ${response.status}`);
                }

                // Gelen JSON verisini al
                const data = await response.json();

                // Backend Response formatına göre: data.data'yı alıyoruz
                studyQueue = data.data || [];

                console.log("✅ Backend'den gelen kart listesi:", studyQueue);

                // Kartları başlat veya bitiş ekranını göster
                if (studyQueue.length > 0) {
                    loadCard(0);
                } else {
                    console.log("Bugün çalışılacak kart yok veya liste boş.");
                    showFinishMessage();
                }

            } catch (error) {
                console.error("❌ Kartlar çekilemedi:", error);

                // Hata durumunda kullanıcıya bilgi ver
                if (questionEl) questionEl.textContent = "Bağlantı Hatası!";
                if (answerEl) answerEl.textContent = `Backend açık mı? (${BACKEND_URL})`;
            }
        }

        // --- 2. RENDER CARD ---
        function loadCard(index) {
            if (index >= studyQueue.length) {
                showFinishMessage();
                return;
            }

            const data = studyQueue[index];

            // Reset Card State
            flipCardInner.classList.remove('is-flipped');
            isFlipped = false;
            actionButtons.classList.add('invisible', 'opacity-0');

            // Fill Content (Backend formatına göre: 'front' ve 'back' olmalı)
            // NOT: Sizin kodunuzda 'question' ve 'answer' kullanılmış. API'deki 'front'/'back' ile eşleştiriyoruz.
            questionEl.textContent = data.front; // API'den gelen 'front'
            answerEl.textContent = data.back;   // API'den gelen 'back'

            // Konu için 'source_file' kullanılabilir, eğer API'de bu alan varsa
            if (cardCategory) cardCategory.textContent = data.source_file ? data.source_file.replace('.pdf', '') : 'Genel';
        }

        // --- 3. FLIP INTERACTION ---
        cardContainer.addEventListener('click', () => {
            hideToast(); // Clear existing toasts

            if (studyQueue.length > 0 && !isFlipped) {
                flipCardInner.classList.add('is-flipped');

                // Butonları görünür yapmadan önce flip animasyonunun bitmesini bekleyelim
                setTimeout(() => {
                    actionButtons.classList.remove('invisible', 'opacity-0');
                }, 300);

                isFlipped = true;
            }
        });

        // --- 4. SUBMIT ANSWER (API İLE İLERLEME KAYDI) ---
        window.submitAnswer = async function (difficulty) {
            if (!isFlipped) return;

            if (toastTimeout) clearTimeout(toastTimeout);

            const currentCard = studyQueue[currentIndex];
            const nextIndex = currentIndex + 1;

            // --- API İsteği: /api/submit-answer ---
            try {
                const response = await fetch(`${BACKEND_URL}/api/submit-answer`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        card_id: currentCard.id,
                        rating: difficulty.toLowerCase() // API sadece "easy", "medium", "hard" kabul ediyor.
                    })
                });

                if (!response.ok) {
                    throw new Error(`API Hatası! Durum: ${response.status}`);
                }

                const result = await response.json();

                // --- Başarılı Cevap Durumu ---

                // Toast Mesajı hazırlama
                let userMessage = "";
                if (difficulty === 'EASY') userMessage = "Süper! Çok iyi hatırladın.";
                else if (difficulty === 'MEDIUM') userMessage = "Tamam, tekrar yakında yapılacak.";
                else userMessage = "Zorlandın mı? Tekrar etmelisin.";

                const dateStr = new Date(result.next_review).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });

                // Show Toast Notification
                toastText.innerHTML = `${userMessage} <span class="text-gray-400 text-xs ml-1">(Yeni tarih: ${dateStr})</span>`;

                // Reset animation and show
                toastNotification.classList.add('opacity-0', 'translate-y-10');
                setTimeout(() => {
                    toastNotification.classList.remove('opacity-0', 'translate-y-10');
                }, 10);

                // Auto hide after 3s
                toastTimeout = setTimeout(() => {
                    hideToast();
                }, 3000);

            } catch (error) {
                console.error("❌ Cevap gönderilemedi:", error);

                // Hata Toast'u göster
                toastText.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-red-400"></i> Hata: Cevap kaydedilemedi.`;
                toastNotification.classList.remove('opacity-0', 'translate-y-10');
                toastTimeout = setTimeout(() => { hideToast(); }, 5000);
            }

            // --- Sonraki Karta Geçiş ---

            // Sonraki kart yoksa bitir
            if (nextIndex >= studyQueue.length) {
                setTimeout(showFinishMessage, 1500); // Toast'un görünmesi için kısa bir gecikme
                return;
            }

            // Kartı çevirme durumunu sıfırla
            flipCardInner.classList.remove('is-flipped');
            actionButtons.classList.add('invisible', 'opacity-0');
            isFlipped = false;

            // Yeni kartı yükle (animasyon bittikten sonra)
            setTimeout(() => {
                currentIndex++;
                loadCard(currentIndex);
            }, 800); // Flip animasyon süresine yakın bir gecikme
        };

        // --- 5. FINISH SCREEN ---
        function showFinishMessage() {
            document.getElementById('cardContainer').classList.add('hidden');
            actionButtons.classList.add('hidden');
            messageBox.classList.remove('hidden');
            hideToast();
        }

        // Button Event Listeners
        document.getElementById('markEasy').addEventListener('click', (e) => { e.stopPropagation(); window.submitAnswer('EASY'); });
        document.getElementById('markMedium').addEventListener('click', (e) => { e.stopPropagation(); window.submitAnswer('MEDIUM'); });
        document.getElementById('markHard').addEventListener('click', (e) => { e.stopPropagation(); window.submitAnswer('HARD'); });

        // --- 6. FAVICON FIX ---
        // Bu bölüm API etkileşimini etkilemediği için orijinal haliyle bırakılmıştır.
        const imagePath = 'mindloop.jpeg';
        const link = document.querySelector("link[rel~='icon']");
        if (link) {
            // ... Orijinal Favicon Kodu ...
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


        // Initialize App
        fetchDailyCards();
    }

    // ==================================================
    // PART 2: UPLOAD PAGE LOGIC (upload.html)
    // ==================================================
    if (isUploadPage) {
        // NOT: Yükleme mantığınız şu anda dosyanın içeriğini okuyup
        // yerel depolamaya (localStorage) kaydetmektedir.
        // API Sözleşmenize göre burası 'POST /api/upload' endpoint'ine
        // bir PDF dosyası göndermelidir.

        const fileInput = document.getElementById('fileInput');
        const uploadBtn = document.getElementById('uploadBtn');
        const fileNameDisplay = document.getElementById('fileName');
        const fileNameArea = document.getElementById('fileNameArea');
        const uploadStatus = document.getElementById('uploadStatus');

        // --- Yükleme (Upload) İşlevi API'ye Uyumlu Hale Getirildi ---
        async function handleUpload(file) {
            const originalBtnText = uploadBtn.innerHTML;
            uploadBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> İşleniyor...`;
            uploadBtn.disabled = true;

            const formData = new FormData();
            formData.append('file', file); // API Contract'e göre key: 'file'

            try {
                // API Sözleşmesine göre POST isteği: /api/upload
                const response = await fetch(`${BACKEND_URL}/api/upload`, {
                    method: 'POST',
                    body: formData // Form Data otomatik olarak Content-Type: multipart/form-data ayarlar
                });

                const result = await response.json();

                if (!response.ok || result.status !== 'success') {
                    // Backend'den gelen hata mesajını kullan
                    throw new Error(result.message || "Dosya yüklenirken bir hata oluştu.");
                }

                // Success Feedback
                setTimeout(() => {
                    uploadBtn.innerHTML = originalBtnText;
                    uploadBtn.disabled = false;

                    uploadStatus.classList.remove('hidden');
                    uploadStatus.classList.add('bg-green-100', 'text-green-700', 'border', 'border-green-200');
                    uploadStatus.innerHTML = `<i class="fa-solid fa-circle-check"></i> <strong>Harika!</strong> ${result.card_count} yeni kart oluşturuldu ve kaydedildi.`;

                    // Formu sıfırla
                    fileInput.value = "";
                    fileNameArea.classList.add('hidden');
                    uploadBtn.disabled = true;
                    uploadBtn.classList.add('opacity-50');
                }, 1000);

            } catch (error) {
                console.error("❌ Yükleme hatası:", error);

                uploadBtn.innerHTML = originalBtnText;
                uploadBtn.disabled = false;

                uploadStatus.classList.remove('hidden');
                uploadStatus.classList.add('bg-red-100', 'text-red-700', 'border', 'border-red-200');
                uploadStatus.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Hata: ${error.message}`;
            }
        }

        // File Selection Handler (Aynı kaldı)
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

        // Upload Button Handler (handleUpload fonksiyonunu çağırır)
        uploadBtn.addEventListener('click', () => {
            const file = fileInput.files[0];
            if (!file) return;

            // Eski localStorage/FileReader mantığı yerine API isteği kullanılıyor
            handleUpload(file);
        });
    }
});