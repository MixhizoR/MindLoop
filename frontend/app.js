document.addEventListener('DOMContentLoaded', () => {

    const API_BASE_URL = "http://127.0.0.1:8000";
    console.log("App Başlatıldı. API:", API_BASE_URL);

    const isStudyPage = document.getElementById('cardContainer');
    const isUploadPage = document.getElementById('uploadBtn');

    // ==================================================
    // 1. ÇALIŞMA SAYFASI (Flashcard Mantığı)
    // ==================================================
    if (isStudyPage) {
        // ... (Bu kısım aynı, çalışıyor) ...
        const cardContainer = document.getElementById('cardContainer');
        const flipCardInner = document.getElementById('flipCardInner');
        const actionButtons = document.getElementById('actionButtons');
        const messageBox = document.getElementById('messageBox');
        const questionEl = document.getElementById('cardQuestion');
        const answerEl = document.getElementById('cardAnswer');
        const cardCategory = document.getElementById('cardCategory');
        let studyQueue = [];
        let currentIndex = 0;
        let isFlipped = false;
        let toastTimeout;

        function fetchDailyCards() {
            try { studyQueue = JSON.parse(localStorage.getItem('studyCards')) || []; }
            catch { studyQueue = []; }
            if (studyQueue.length > 0) loadCard(0); else showFinishMessage();
        }

        function loadCard(index) {
            if (index >= studyQueue.length) { showFinishMessage(); return; }
            const data = studyQueue[index];
            flipCardInner.classList.remove('is-flipped'); isFlipped = false;
            actionButtons.classList.add('invisible', 'opacity-0');
            questionEl.textContent = data.question || data.front || "Soru Yok";
            answerEl.textContent = data.answer || data.back || "Cevap Yok";
            if (cardCategory) cardCategory.textContent = data.title || "Genel";
        }

        cardContainer.addEventListener('click', () => {
            const t = document.getElementById('toastNotification'); if (t) t.classList.add('opacity-0', 'translate-y-10');
            if (!isFlipped) { flipCardInner.classList.add('is-flipped'); actionButtons.classList.remove('invisible', 'opacity-0'); isFlipped = true; }
        });

        window.submitAnswer = function (difficulty) {
            if (!isFlipped) return;
            if (toastTimeout) clearTimeout(toastTimeout);
            const currentCard = studyQueue[currentIndex];
            const nextIndex = currentIndex + 1;
            const now = new Date();
            let nextReviewDate = new Date();
            if (difficulty === 'EASY') nextReviewDate.setDate(now.getDate() + 3);
            else if (difficulty === 'MEDIUM') nextReviewDate.setDate(now.getDate() + 1);

            const allCards = JSON.parse(localStorage.getItem('studyCards')) || [];
            const updatedCards = allCards.map(c => {
                if ((c.id && c.id === currentCard.id) || (c.question === currentCard.question)) {
                    return { ...c, nextReviewDate: nextReviewDate.toISOString() };
                } return c;
            });
            localStorage.setItem('studyCards', JSON.stringify(updatedCards));

            if (nextIndex >= studyQueue.length) { showFinishMessage(); return; }
            const nextCard = studyQueue[nextIndex];
            questionEl.textContent = nextCard.question || nextCard.front;
            if (cardCategory) cardCategory.textContent = nextCard.title || "Genel";
            flipCardInner.classList.remove('is-flipped'); actionButtons.classList.add('invisible', 'opacity-0'); isFlipped = false;
            setTimeout(() => { currentIndex++; answerEl.textContent = nextCard.answer || nextCard.back; }, 600);
        };

        function showFinishMessage() {
            document.getElementById('cardContainer').classList.add('hidden');
            actionButtons.classList.add('hidden');
            messageBox.classList.remove('hidden');
        }

        document.getElementById('markEasy').addEventListener('click', (e) => { e.stopPropagation(); window.submitAnswer('EASY'); });
        document.getElementById('markMedium').addEventListener('click', (e) => { e.stopPropagation(); window.submitAnswer('MEDIUM'); });
        document.getElementById('markHard').addEventListener('click', (e) => { e.stopPropagation(); window.submitAnswer('HARD'); });
        fetchDailyCards();
    }

    // ==================================================
    // 2. YÜKLEME SAYFASI (GÜNCELLENDİ)
    // ==================================================
    if (isUploadPage) {
        console.log("Upload sayfası aktif.");
        const fileInput = document.getElementById('fileInput');
        const uploadBtn = document.getElementById('uploadBtn');
        const fileNameDisplay = document.getElementById('fileName');
        const fileNameArea = document.getElementById('fileNameArea');
        const uploadStatus = document.getElementById('uploadStatus');

        let pollingInterval = null;
        let consecutiveErrors = 0;
        const MAX_RETRIES = 3;

        // Dosya Seçimi
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

        // --- BUTON TIKLAMA ---
        uploadBtn.addEventListener('click', async (e) => {
            console.log("Butona tıklandı.");
            e.preventDefault();

            const file = fileInput.files[0];
            if (!file) return;

            const originalBtnText = `<i class="fa-solid fa-wand-magic-sparkles"></i> Kartları Oluştur`;

            // UI: Yükleniyor...
            uploadBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up fa-fade"></i> Yükleniyor...`;
            uploadBtn.disabled = true;
            uploadBtn.classList.add('opacity-75', 'cursor-wait');

            uploadStatus.classList.remove('hidden');
            uploadStatus.className = 'p-3 rounded-lg text-sm bg-blue-50 text-blue-700 border border-blue-200 mt-4 animate-pulse block';
            uploadStatus.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Dosya sunucuya gönderiliyor...`;

            try {
                const formData = new FormData();
                formData.append('pdf_file', file);

                console.log("Fetch isteği gönderiliyor...");

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 60000);

                const response = await fetch(`${API_BASE_URL}/pdf/upload-pdf`, {
                    method: 'POST',
                    body: formData,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                console.log("Fetch yanıtı geldi. Status:", response.status);

                if (!response.ok) {
                    throw new Error(`HTTP Hata Kodu: ${response.status}`);
                }

                console.log("DataGetiriliyor:");
                const data = await response.json();
                console.log("Gelen Data:", data);

                // --- Dosya Yüklendi (Yeşil) ---
                uploadStatus.className = 'p-3 rounded-lg text-sm bg-green-100 text-green-700 border border-green-200 mt-4 block';
                uploadStatus.innerHTML = `<i class="fa-solid fa-circle-check"></i> <strong>Dosya Yüklendi!</strong><br><span class="text-xs">İçerik analiz ediliyor...</span>`;

                await new Promise(resolve => setTimeout(resolve, 1500));

                // --- AI İşleniyor (Mor) ---
                uploadBtn.innerHTML = `<i class="fa-solid fa-brain fa-bounce"></i> AI Kartları Oluşturuyor...`;
                uploadStatus.className = 'p-3 rounded-lg text-sm bg-indigo-50 text-indigo-700 border border-indigo-200 mt-4 block';
                uploadStatus.innerHTML = `<i class="fa-solid fa-microchip"></i> <strong>İşleniyor...</strong> Yapay zeka içeriği analiz ediyor, lütfen bekleyin.`;

                startPolling(data.task_id, originalBtnText, file.name);

            } catch (error) {
                console.error("Yükleme sırasında hata:", error);
                handleError(error, originalBtnText, true);
            }
        });

        // --- POLLING ---
        function startPolling(taskId, originalBtnText, originalFileName) {
            console.log("Polling başlatıldı:", taskId);
            consecutiveErrors = 0;
            if (pollingInterval) clearInterval(pollingInterval);

            pollingInterval = setInterval(async () => {
                try {
                    const res = await fetch(`${API_BASE_URL}/pdf/task/${taskId}`);

                    if (!res.ok) {
                        if (res.status === 404) throw new Error("Task bulunamadı");
                        else throw new Error("Sunucu yanıt vermiyor");
                    }

                    const result = await res.json();
                    console.log("Polling Durumu:", result.status);
                    consecutiveErrors = 0;

                    if (result.status === 'completed') {
                        clearInterval(pollingInterval);

                        const newCards = result.data.map((item, index) => ({
                            id: Date.now() + index,
                            question: item.front,
                            answer: item.back,
                            title: originalFileName,
                            nextReviewDate: new Date().toISOString()
                        }));

                        saveToLocalStorage(newCards);
                        showSuccessUI(newCards.length, originalBtnText);

                    } else if (result.status === 'failed') {
                        clearInterval(pollingInterval);
                        handleError(new Error(result.error), originalBtnText, true);
                    }

                } catch (error) {
                    console.warn("Polling hatası:", error);
                    consecutiveErrors++;
                    if (consecutiveErrors >= MAX_RETRIES) {
                        clearInterval(pollingInterval);
                        handleError(new Error("Bağlantı koptu."), originalBtnText, true);
                    }
                }
            }, 2000);
        }

        function saveToLocalStorage(newCards) {
            const existingData = JSON.parse(localStorage.getItem('studyCards')) || [];
            localStorage.setItem('studyCards', JSON.stringify(existingData.concat(newCards)));
        }

        function showSuccessUI(count, originalBtnText) {
            // Buton ve Input temizliği
            uploadBtn.innerHTML = `<i class="fa-solid fa-check"></i> Tamamlandı`;
            uploadBtn.disabled = false;
            uploadBtn.classList.remove('cursor-wait', 'opacity-75');
            fileInput.value = "";
            fileNameArea.classList.add('hidden');

            // Yeşil Başarı Mesajı
            uploadStatus.className = 'p-4 rounded-lg text-sm bg-green-100 text-green-800 border border-green-200 mt-4 shadow-sm block';
            uploadStatus.innerHTML = `
                <div class="flex flex-col items-center gap-2">
                    <div class="flex items-center gap-3">
                        <i class="fa-solid fa-circle-check text-2xl"></i>
                        <div>
                            <h4 class="font-bold">İşlem Başarılı!</h4>
                            <p>${count} yeni kart eklendi.</p>
                        </div>
                    </div>
                    <div class="text-xs font-semibold text-green-700 mt-2">
                        <i class="fa-solid fa-spinner fa-spin"></i> Ana sayfaya yönlendiriliyorsunuz...
                    </div>
                </div>
            `;

            // --- YÖNLENDİRME KODU BURADA ---
            // Kullanıcının "Başarılı" mesajını görmesi için 2 saniye bekleyip sayfayı değiştiriyoruz.
            setTimeout(() => {
                window.location.href = "index.html";
            }, 2000);
        }

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
});