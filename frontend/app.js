// Örnek kart verisi (normalde backend'den gelir)
let cards = [
    { id: 1, question: "HTML nedir?", answer: "Bir işaretleme dilidir." },
    { id: 2, question: "CSS ne işe yarar?", answer: "Web sayfalarını stillendirir." }
];

let currentIndex = 0;
let showingAnswer = false;

// Elementler
const titleEl = document.getElementById("cardTitle");
const contentEl = document.getElementById("cardContent");
const showAnswerBtn = document.getElementById("showAnswer");
const markEasyBtn = document.getElementById("markEasy");
const markHardBtn = document.getElementById("markHard");
const messageBox = document.getElementById("messageBox");

// İlk kartı yükle
renderCard();

function renderCard() {
    if (currentIndex >= cards.length) {
        showFinishedScreen();
        return;
    }

    const card = cards[currentIndex];

    titleEl.innerText = card.question;
    contentEl.innerHTML = `<p>Cevabı görmek için butona tıklayın.</p>`;

    showingAnswer = false;
    showAnswerBtn.classList.remove("hidden");
    markEasyBtn.classList.add("hidden");
    markHardBtn.classList.add("hidden");
}

showAnswerBtn.addEventListener("click", () => {
    const card = cards[currentIndex];

    contentEl.innerHTML = `<p class='font-semibold text-gray-800'>${card.answer}</p>`;

    showAnswerBtn.classList.add("hidden");
    markEasyBtn.classList.remove("hidden");
    markHardBtn.classList.remove("hidden");
});

markEasyBtn.addEventListener("click", () => submitRating("easy"));
markHardBtn.addEventListener("click", () => submitRating("hard"));

async function submitRating(rating) {
    const card = cards[currentIndex];

    try {
        const response = await fetch("/api/submit-answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                card_id: card.id,
                rating: rating
            })
        });

        if (!response.ok) {
            showMessage("Bir hata oluştu!", "red");
            return;
        }

        showMessage("Cevap kaydedildi!", "green");

        currentIndex++;
        setTimeout(() => renderCard(), 500);

    } catch (err) {
        showMessage("Sunucuya ulaşılamadı.", "red");
    }
}

function showMessage(msg, color) {
    messageBox.innerText = msg;
    messageBox.className = `p-3 rounded-lg text-center mt-4 text-white bg-${color}-500`;
    messageBox.classList.remove("hidden");

    setTimeout(() => {
        messageBox.classList.add("hidden");
    }, 1500);
}

function showFinishedScreen() {
    titleEl.innerText = "🎉 Tebrikler!";
    contentEl.innerHTML = "<p>Tüm kartları tamamladınız.</p>";

    showAnswerBtn.classList.add("hidden");
    markEasyBtn.classList.add("hidden");
    markHardBtn.classList.add("hidden");
}
