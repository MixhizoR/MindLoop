// Genel Uygulama Durumu
const appState = {
    currentCard: null,
    isReady: false,
    backendBaseUrl: 'http://localhost:3000' // Backend adresinizi buradan güncelleyin
};

/**
 * Backend ile güvenli bir şekilde veri alışverişi yapar.
 * @param {string} endpoint - API uç noktası (örn: '/api/next-card')
 * @param {object} options - Fetch API ayarları (method, body, headers vb.)
 * @returns {Promise<Object | null>} API'den dönen veri veya hata durumunda null
 */
async function fetchData(endpoint, options = {}) {
    const apiUrl = `${appState.backendBaseUrl}${endpoint}`;
    try {
        const response = await fetch(apiUrl, options);
        if (!response.ok) {
            // Hata detayını backend'den almaya çalış
            const errorText = await response.text();
            throw new Error(`HTTP Hata! Durum: ${response.status}. Detay: ${errorText.substring(0, 100)}...`);
        }
        return response.json();
    } catch (error) {
        console.error('Veri çekme/gönderme hatası:', error.message);
        displayMessage(`İşlem Başarısız: ${error.message}`, 'error');
        return null;
    }
}

/**
 * Dosya yükleme formunun gönderilmesini ele alır.
 * Yükleme ekranı (upload.html) için mantık.
 */
async function handleFileUpload(event) {
    event.preventDefault(); // Varsayılan formu gönderme davranışını engelle
    displayMessage('Yükleniyor...', 'info');

    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        displayMessage('Lütfen bir dosya seçin.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('contentFile', file);
    // İhtiyaca göre diğer veriler (örn: kullanıcı ID'si) eklenebilir.
    // formData.append('userId', '...');

    const uploadUrl = '/api/upload'; // Backend yükleme uç noktasını güncelleyin

    const result = await fetchData(uploadUrl, {
        method: 'POST',
        body: formData,
        // FormData kullandığımız için 'Content-Type' başlığını tarayıcı kendisi ayarlar.
    });

    if (result) {
        displayMessage('Dosya başarıyla yüklendi ve işlenmek üzere gönderildi.', 'success');
        // Başarılı yükleme sonrası ana sayfaya yönlendirme yapılabilir.
        // setTimeout(() => window.location.href = 'index.html', 2000);
    } else {
        // Hata mesajı zaten fetchData içinde gösterildi.
    }
}

/**
 * Kullanıcı arayüzüne mesaj gösterir.
 * @param {string} message - Gösterilecek mesaj metni
 * @param {string} type - 'success', 'error' veya 'info'
 */
function displayMessage(message, type = 'info') {
    const messageBox = document.getElementById('messageBox');
    if (messageBox) {
        messageBox.textContent = message;
        messageBox.classList.remove('hidden', 'bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800', 'bg-blue-100', 'text-blue-800');

        switch (type) {
            case 'success':
                messageBox.classList.add('bg-green-100', 'text-green-800');
                break;
            case 'error':
                messageBox.classList.add('bg-red-100', 'text-red-800');
                break;
            case 'info':
            default:
                messageBox.classList.add('bg-blue-100', 'text-blue-800');
                break;
        }
        // Tailwind sınıflarını tekrar ekleyelim
        messageBox.classList.add('p-3', 'rounded-lg', 'text-center', 'mt-4');
    }
}

/**
 * Ana çalışma ekranını (index.html) başlatır.
 */
function initMainScreen() {
    console.log("Ana Ekran Başlatılıyor...");

    // Yükleme sayfasına yönlendirme butonuna event listener ekleme
    const uploadButton = document.getElementById('goToUpload');
    if (uploadButton) {
        uploadButton.addEventListener('click', () => {
            window.location.href = 'upload.html';
        });
    }

    // Örnek: Backend'den ilk öğrenme kartını çekme fonksiyonu
    async function loadNextCard() {
        displayMessage('Sıradaki kart yükleniyor...', 'info');
        const card = await fetchData('/api/next-card'); // Backend uç noktanızı güncelleyin
        if (card) {
            appState.currentCard = card;
            renderCard(card);
            displayMessage('Hazır.', 'info');
        } else {
            document.getElementById('cardContent').innerHTML = 'Görüntülenecek kart yok. Lütfen içerik yükleyin.';
            displayMessage('Öğrenme kartı bulunamadı.', 'info');
        }
    }

    // Sayfa yüklendiğinde ilk kartı çek
    loadNextCard();

    // Örnek: Cevap butonuna tıklama mantığı
    const showAnswerButton = document.getElementById('showAnswer');
    if (showAnswerButton) {
        showAnswerButton.addEventListener('click', () => {
            // Cevabı gösterme mantığı
            document.getElementById('cardContent').innerHTML = `<strong>Cevap:</strong> ${appState.currentCard.answer || 'Cevap bulunamadı.'}`;
            document.getElementById('markHard').classList.remove('hidden');
            showAnswerButton.classList.add('hidden');
        });
    }

    // Örnek: Kolaydı butonuna tıklama mantığı (Spaced Repetition algoritması için backend'e bildirim)
    const markEasyButton = document.getElementById('markEasy');
    if (markEasyButton) {
        markEasyButton.addEventListener('click', async () => {
            if (appState.currentCard) {
                // Backend'e kartın kolay olduğu bilgisini gönder
                await fetchData(`/api/review/${appState.currentCard.id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rating: 'easy' }) // 'easy', 'hard' gibi
                });
                // Bir sonraki kartı yükle
                loadNextCard();
                // Butonları sıfırla
                document.getElementById('markHard').classList.add('hidden');
                document.getElementById('showAnswer').classList.remove('hidden');
            }
        });
    }
}

/**
 * Kart verisini UI'a render eder.
 * @param {object} card - Kart verisi (id, title, question vb. içermeli)
 */
function renderCard(card) {
    document.getElementById('cardTitle').textContent = card.title || 'Yeni Öğrenme Konusu';
    document.getElementById('cardContent').innerHTML = `
        <p class="text-lg font-medium mb-3">${card.question || 'Soru metni yüklenemedi.'}</p>
        <!-- Cevap başlangıçta gizli olmalı -->
    `;
    // Diğer UI güncellemeleri
}


/**
 * Uygulama başladığında çalışacak ana fonksiyon.
 * Hangi sayfanın yüklendiğini kontrol eder ve ilgili başlatma fonksiyonunu çağırır.
 */
function main() {
    // Mevcut sayfa yolunu kontrol et
    const path = window.location.pathname;

    if (path.endsWith('upload.html')) {
        initUploadScreen();
    } else {
        // index.html veya diğer sayfalar
        initMainScreen();
    }
    appState.isReady = true;
}

/**
 * Yükleme ekranı mantığını (upload.html) başlatır.
 */
function initUploadScreen() {
    console.log("Yükleme Ekranı Başlatılıyor...");
    const form = document.getElementById('uploadForm');
    if (form) {
        form.addEventListener('submit', handleFileUpload);
    }
}

// Sayfa yüklendiğinde ana fonksiyonu çağır
window.addEventListener('load', main);