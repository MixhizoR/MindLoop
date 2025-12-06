document.addEventListener('DOMContentLoaded', () => {

    // ==================================================
    // GLOBAL SELECTORS & PAGE CHECK
    // ==================================================
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

        // State Variables
        let studyQueue = [];
        let currentIndex = 0;
        let isFlipped = false;
        let toastTimeout;

        // --- 1. INITIALIZE DATA ---
        function fetchDailyCards() {
            // Check LocalStorage for real user data
            const storedData = localStorage.getItem('studyCards');

            if (storedData) {
                studyQueue = JSON.parse(storedData);
            } else {
                // Production Mode: Start empty if no data exists
                studyQueue = [];
            }

            // Render first card or finish screen
            if (studyQueue.length > 0) {
                loadCard(0);
            } else {
                showFinishMessage();
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

            // Fill Content
            questionEl.textContent = data.question;
            answerEl.textContent = data.answer;
            if (cardCategory) cardCategory.textContent = data.title;
        }

        // --- 3. FLIP INTERACTION ---
        cardContainer.addEventListener('click', () => {
            hideToast(); // Clear existing toasts

            if (!isFlipped) {
                flipCardInner.classList.add('is-flipped');
                actionButtons.classList.remove('invisible', 'opacity-0');
                isFlipped = true;
            }
        });

        // Close toast when clicking outside
        document.body.addEventListener('click', (e) => {
            if (!e.target.closest('button') && !e.target.closest('.flip-card-container')) {
                hideToast();
            }
        });

        function hideToast() {
            const toast = document.getElementById('toastNotification');
            if (toast) {
                toast.classList.add('opacity-0', 'translate-y-10');
            }
        }

        // --- 4. SUBMIT ANSWER (ALGORITHM & TOAST) ---
        window.submitAnswer = function (difficulty) {
            if (!isFlipped) return;

            if (toastTimeout) clearTimeout(toastTimeout);

            const currentCard = studyQueue[currentIndex];
            const nextIndex = currentIndex + 1;

            // --- SM-2 Simplified Algorithm ---
            const now = new Date();
            let nextReviewDate = new Date();
            let userMessage = "";

            if (difficulty === 'EASY') {
                nextReviewDate.setDate(now.getDate() + 3); // +3 Days
                userMessage = "Süper! 3 gün sonraya planlandı.";
            } else if (difficulty === 'MEDIUM') {
                nextReviewDate.setDate(now.getDate() + 1); // +1 Day
                userMessage = "Tamam, yarına planlandı.";
            } else {
                // HARD: Review same day
                userMessage = "Zorlandın mı? Yakında tekrar edelim.";
            }

            const dateStr = nextReviewDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });

            // Show Toast Notification
            const toast = document.getElementById('toastNotification');
            if (toast) {
                const toastText = document.getElementById('toastText');
                toastText.innerHTML = `${userMessage} <span class="text-gray-400 text-xs ml-1">(${dateStr})</span>`;

                // Reset animation
                toast.classList.add('opacity-0', 'translate-y-10');
                setTimeout(() => {
                    toast.classList.remove('opacity-0', 'translate-y-10');
                }, 10);

                // Auto hide after 1.5s
                toastTimeout = setTimeout(() => {
                    hideToast();
                }, 1500);
            }

            // Update Storage
            let allCards = JSON.parse(localStorage.getItem('studyCards')) || [];
            const updatedCards = allCards.map(card => {
                if (card.id === currentCard.id) {
                    return { ...card, nextReviewDate: nextReviewDate.toISOString() };
                }
                return card;
            });
            localStorage.setItem('studyCards', JSON.stringify(updatedCards));

            // Move to Next Card
            if (nextIndex >= studyQueue.length) {
                showFinishMessage();
                return;
            }

            const nextCard = studyQueue[nextIndex];

            // Pre-load next question (invisible side)
            questionEl.textContent = nextCard.question;
            if (cardCategory) cardCategory.textContent = nextCard.title;

            flipCardInner.classList.remove('is-flipped');
            actionButtons.classList.add('invisible', 'opacity-0');
            isFlipped = false;

            // Wait for flip animation
            setTimeout(() => {
                currentIndex++;
                answerEl.textContent = nextCard.answer;
            }, 1000);
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

        // --- 6. FAVICON FIX (Square to Circle) ---
        const imagePath = 'mindloop.jpeg';
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

        // Initialize App
        fetchDailyCards();
    }

    // ==================================================
    // PART 2: UPLOAD PAGE LOGIC (upload.html)
    // ==================================================
    if (isUploadPage) {
        const fileInput = document.getElementById('fileInput');
        const uploadBtn = document.getElementById('uploadBtn');
        const fileNameDisplay = document.getElementById('fileName');
        const fileNameArea = document.getElementById('fileNameArea');
        const uploadStatus = document.getElementById('uploadStatus');

        // File Selection Handler
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

        // Upload Button Handler
        uploadBtn.addEventListener('click', () => {
            const file = fileInput.files[0];
            if (!file) return;

            const originalBtnText = uploadBtn.innerHTML;
            uploadBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Okunuyor...`;
            uploadBtn.disabled = true;

            const reader = new FileReader();

            reader.onload = function (e) {
                try {
                    // Parse JSON
                    const fileContent = e.target.result;
                    const newQuestions = JSON.parse(fileContent);

                    // Validation
                    if (!Array.isArray(newQuestions)) {
                        throw new Error("Dosya formatı hatalı! JSON bir liste ([...]) olmalı.");
                    }

                    // Save to Storage
                    const existingData = JSON.parse(localStorage.getItem('studyCards')) || [];
                    const updatedData = existingData.concat(newQuestions);
                    localStorage.setItem('studyCards', JSON.stringify(updatedData));

                    // Success Feedback
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
                    }, 1000);

                } catch (error) {
                    uploadBtn.innerHTML = originalBtnText;
                    uploadBtn.disabled = false;
                    alert("Hata: " + error.message);
                    console.error("JSON Error:", error);
                }
            };

            reader.readAsText(file);
        });
    }
});