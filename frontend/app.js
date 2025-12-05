document.addEventListener('DOMContentLoaded', () => {

    // ==================================================
    // 1. SAYFA KONTROLÜ (Hangi sayfadayız?)
    // ==================================================
    const isStudyPage = document.getElementById('cardContainer');
    const isUploadPage = document.getElementById('uploadBtn');

    // ==================================================
    // 2. ÇALIŞMA ALANI MANTIĞI (Sadece index.html'de çalışır)
    // ==================================================
    if (isStudyPage) {
        const cardContainer = document.getElementById('cardContainer');
        const flipCardInner = document.getElementById('flipCardInner');
        const actionButtons = document.getElementById('actionButtons');
        const messageBox = document.getElementById('messageBox');

        // İçerik alanları
        const questionEl = document.getElementById('cardQuestion');
        const answerEl = document.getElementById('cardAnswer');
        const cardCategory = document.getElementById('cardCategory'); // Kategori etiketi için

        let studyQueue = [];
        let currentIndex = 0;
        let isFlipped = false;

        // --- SİMÜLE EDİLMİŞ API İSTEĞİ (/api/study-daily) ---
        function fetchDailyCards() {
            console.log("API İsteği: GET /api/study-daily");

            // Backend simülasyonu
            const mockResponse = [
                { id: 101, title: "Tarih", question: "İstanbul kaç yılında fethedildi?", answer: "1453" },
                { id: 102, title: "Yazılım", question: "HTML'in açılımı nedir?", answer: "HyperText Markup Language" },
                { id: 103, title: "Coğrafya", question: "Türkiye'nin en yüksek dağı?", answer: "Ağrı Dağı" }
            ];

            studyQueue = mockResponse;

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

            // Kartı düzelt
            flipCardInner.classList.remove('is-flipped');
            isFlipped = false;

            // Butonları gizle
            actionButtons.classList.add('invisible', 'opacity-0');

            // İçerikleri doldur
            questionEl.textContent = data.question;
            answerEl.textContent = data.answer;
            if (cardCategory) cardCategory.textContent = data.title; // Eğer kategori etiketi varsa güncelle
        }

        // --- KART DÖNDÜRME ---
        cardContainer.addEventListener('click', () => {
            if (!isFlipped) {
                flipCardInner.classList.add('is-flipped'); // CSS: .is-flipped
                actionButtons.classList.remove('invisible', 'opacity-0');
                isFlipped = true;
            }
        });

        // --- CEVAP GÖNDERME (DÜZELTİLMİŞ VERSİYON) ---
        window.submitAnswer = function (difficulty) {
            if (!isFlipped) return;

            // 1. Sonraki kartın sırasını belirle
            const nextIndex = currentIndex + 1;

            // Eğer sorular bittiyse animasyonu beklemeden bitir
            if (nextIndex >= studyQueue.length) {
                showFinishMessage();
                return;
            }

            // Sonraki kartın verisini al
            const nextCard = studyQueue[nextIndex];

            // 2. KRİTİK HAMLE: Kart hala terste dururken (Cevap yüzü görünürken),
            // GİZLİ OLAN Ön Yüze (Soru kısmına) yeni soruyu hemen yazıyoruz.
            // Böylece kart dönerken eski soruyu değil, yeni soruyu görerek dönecek.
            questionEl.textContent = nextCard.question;
            if (cardCategory) cardCategory.textContent = nextCard.title;

            // 3. Şimdi Dönüşü Başlat (Cevap -> Soru)
            flipCardInner.classList.remove('is-flipped');
            actionButtons.classList.add('invisible', 'opacity-0');
            isFlipped = false;

            // 4. Animasyon bittikten sonra (1000ms), arka planda cevabı güncelle
            setTimeout(() => {
                currentIndex++; // Artık resmen yeni karta geçtik
                // Soru zaten günceldi, şimdi arka yüzdeki (gizli) cevabı güncelle
                answerEl.textContent = nextCard.answer;
            }, 1000);
        };
        // --- BİTİŞ EKRANI ---
        function showFinishMessage() {
            document.getElementById('cardContainer').classList.add('hidden');
            actionButtons.classList.add('hidden');
            messageBox.classList.remove('hidden');
        }

        // --- BUTON DİNLEYİCİLERİ ---
        document.getElementById('markEasy').addEventListener('click', (e) => { e.stopPropagation(); window.submitAnswer('EASY'); });
        document.getElementById('markMedium').addEventListener('click', (e) => { e.stopPropagation(); window.submitAnswer('MEDIUM'); });
        document.getElementById('markHard').addEventListener('click', (e) => { e.stopPropagation(); window.submitAnswer('HARD'); });

        // Başlat
        fetchDailyCards();
    }

    // ==================================================
    // 3. UPLOAD ALANI MANTIĞI (Sadece upload.html'de çalışır)
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

            // Loading State
            const originalBtnText = uploadBtn.innerHTML;
            uploadBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Yükleniyor...`;
            uploadBtn.disabled = true;

            // Simüle Edilmiş API Yüklemesi (2 Saniye)
            setTimeout(() => {
                // Başarılı
                uploadBtn.innerHTML = originalBtnText;
                uploadBtn.disabled = false;

                // Mesaj Göster
                uploadStatus.classList.remove('hidden');
                uploadStatus.classList.add('bg-green-100', 'text-green-700', 'border', 'border-green-200');
                uploadStatus.innerHTML = `<i class="fa-solid fa-circle-check"></i> <strong>Başarılı!</strong> "${file.name}" yüklendi ve 5 yeni kart oluşturuldu.`;

                // Formu Sıfırla
                fileInput.value = "";
                fileNameArea.classList.add('hidden');
                uploadBtn.disabled = true;
                uploadBtn.classList.add('opacity-50');

                console.log("Dosya Yüklendi:", file.name);
            }, 2000);
        });
    }

});
// ==================================================
// 4. FAVICON (SEKME İKONU) YUVARLAMA SİHİRBAZI 🧙‍♂️
// ==================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Senin kare resminin yolu (Buraya dosya adını doğru yaz)
    const imagePath = 'mindLoop.jpeg';

    const link = document.querySelector("link[rel~='icon']");
    if (!link) return;

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = imagePath;

    img.onload = () => {
        // Çizim işlemleri (Yuvarlak Kesme)
        ctx.beginPath();
        ctx.arc(32, 32, 32, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip(); // Alanı daireye hapset
        ctx.drawImage(img, 0, 0, 64, 64);

        // Yeni oluşturulan yuvarlak resmi ikona ata
        link.href = canvas.toDataURL();
    };
});