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
        displayMessage('Dosya başarıyla yüklendi ve işlenmek üzere gönderildi. 3 saniye içinde ana sayfaya yönlendiriliyorsunuz.', 'success');
        // Başarılı yükleme sonrası ana sayfaya yönlendirme
        setTimeout(() => window.location.href = 'index.html', 3000);
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
        messageBox.classList.remove('hidden', 'bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800', 'bg-blue-100', 'text-blue-800', 'bg-yellow-100', 'text-yellow-800');

        let bgColor, textColor;
        switch (type) {
            case 'success':
                bgColor = 'bg-green-100';
                textColor = 'text-green-800';
                break;
            case 'error':
                bgColor = 'bg-red-100';
                textColor = 'text-red-800';
                break;
            case 'info':
                bgColor = 'bg-blue-100';
                textColor = 'text-blue-800';
                break;
            case 'warning':
                bgColor = 'bg-yellow-100';
                textColor = 'text-yellow-800';
                break;
            default:
                bgColor = 'bg-blue-100';
                textColor = 'text-blue-800';
                break;
        }
        messageBox.classList.add(bgColor, textColor, 'p-3', 'rounded-lg', 'text-center', 'mt-4');
    }
}

/**
 * Sahte kart verilerini döndürür. Backend entegrasyonu için geçicidir.
 * @returns {object[]} Sahte kart dizisi
 */
function getMockCards() {
    return [
        { id: 'c1', title: 'Unutma Eğrisi Temelleri', question: 'Hermann Ebbinghaus\'un Unutma Eğrisi neyi tanımlar?', answer: 'Yeni öğrenilen bilgilerin zaman içinde nasıl unutulduğunu gösteren bir grafiktir. Tekrar edilmezse bilginin hızla kaybolduğunu öne sürer.' },
        { id: 'c2', title: 'Spaced Repetition', question: 'Aralıklı Tekrar (Spaced Repetition) sisteminin temel amacı nedir?', answer: 'Öğrenilen bilgilerin unutulmaya yaklaştığı kritik anlarda, bilgiyi tekrar ederek hafızadaki kalıcılığını maksimize etmektir. Ebbinghaus\'un eğrisine karşı geliştirilmiştir.' },
        { id: 'c3', title: 'Kurumsal Eğitim', question: 'Kurumsal e-öğrenmede uzun süreli hafızaya almanın zor olmasının nedeni nedir?', answer: 'Genellikle bilgilerin tek seferde, yoğun bir şekilde verilmesi ve kişiselleştirilmiş tekrar mekanizmalarının bulunmamasıdır.' }
    ];
}


/**
 * Kartın derecelendirilmesini backend'e gönderir.
 * @param {string} rating - Derecelendirme ('easy' veya 'hard')
 */
async function sendReview(rating) {
    if (appState.currentCard) {
        // Backend'e kartın derecelendirildiği bilgisini gönder
        displayMessage(`${rating === 'easy' ? 'Kolay' : 'Zor'} olarak işaretlendi. Yeni kart yükleniyor...`, 'info');
        
        await fetchData(`/api/review/${appState.currentCard.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating: rating }) 
        });

        // Butonları sıfırla
        resetCardState();
        // Bir sonraki kartı yükle
        loadNextCard();
    }
}

/**
 * Kart durumunu (butonları) başlangıç haline getirir.
 */
function resetCardState() {
    document.getElementById('markEasy').classList.add('hidden'); // Easy butonu artık cevap görününce gösterilecek
    document.getElementById('markHard').classList.add('hidden');
    document.getElementById('showAnswer').classList.remove('hidden');
}

/**
 * Backend'den ilk öğrenme kartını çekme fonksiyonu
 * (Şimdilik Sahte Veri kullanıyor)
 */
async function loadNextCard() {
    displayMessage('Sıradaki kart yükleniyor...', 'info');
    
    // --- Mock Data Kullanımı ---
    // Backend entegrasyonunu test etmek için bu satırı kullanın:
    // const card = await fetchData('/api/next-card'); 
    
    // Geçici olarak sahte veri kullanıyoruz:
    const mockCards = getMockCards();
    const currentCardIndex = (appState.currentCard ? mockCards.findIndex(c => c.id === appState.currentCard.id) : -1);
    const nextCard = mockCards[(currentCardIndex + 1) % mockCards.length];
    
    if (nextCard) {
        appState.currentCard = nextCard;
        renderCard(nextCard);
        displayMessage(`Kart "${nextCard.title}" yüklendi.`, 'success');
        resetCardState(); // Butonları her kart yüklemede sıfırla
    } else {
        document.getElementById('cardContent').innerHTML = 'Görüntülenecek kart yok. Lütfen içerik yükleyin.';
        displayMessage('Öğrenme kartı bulunamadı. İçerik yükleme sayfasını ziyaret edin.', 'warning');
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

    // Cevap butonuna tıklama mantığı
    const showAnswerButton = document.getElementById('showAnswer');
    if (showAnswerButton) {
        showAnswerButton.addEventListener('click', () => {
            if (appState.currentCard) {
                // Cevabı gösterme
                document.getElementById('cardContent').innerHTML = `
                    <p class="text-lg font-medium mb-3">${appState.currentCard.question || 'Soru metni yüklenemedi.'}</p>
                    <div class="mt-4 p-4 border-l-4 border-indigo-400 bg-indigo-50 shadow-inner">
                        <strong class="text-indigo-700">Cevap:</strong> ${appState.currentCard.answer || 'Cevap bulunamadı.'}
                    </div>
                `;
                // Derecelendirme butonlarını göster
                document.getElementById('markEasy').classList.remove('hidden');
                document.getElementById('markHard').classList.remove('hidden');
                showAnswerButton.classList.add('hidden');
            }
        });
    }

    // Kolaydı butonuna tıklama mantığı (Spaced Repetition algoritması için backend'e bildirim)
    const markEasyButton = document.getElementById('markEasy');
    if (markEasyButton) {
        markEasyButton.addEventListener('click', () => sendReview('easy'));
        // Kolay butonu başlangıçta gizli olmalı
        markEasyButton.classList.add('hidden');
    }

    // Zordu/Unuttum butonuna tıklama mantığı (Spaced Repetition algoritması için backend'e bildirim)
    const markHardButton = document.getElementById('markHard');
    if (markHardButton) {
        markHardButton.addEventListener('click', () => sendReview('hard'));
        // Zor butonu başlangıçta gizli olmalı
        markHardButton.classList.add('hidden');
    }
    
    // Sayfa yüklendiğinde ilk kartı çek
    loadNextCard();
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