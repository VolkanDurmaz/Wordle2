import { words } from './words.js';
import { words_en } from './words-en.js';

const isEnglish = window.location.pathname.includes("wordle-en");

const currentWords = isEnglish ? words_en : words;
const SECRET_WORD = currentWords[Math.floor(Math.random() * currentWords.length)]
    .toLocaleUpperCase(isEnglish ? 'en-US' : 'tr-TR');

let attempts = 0;
let currentGuess = "";
let timerInterval = null;
let timeLeft = 120; // Varsayılan
let timerStarted = false;

const board = document.getElementById("game-board");
const message = document.getElementById("message");

// Board Oluşturma
for (let i = 0; i < 30; i++) {
    let tile = document.createElement("div");
    tile.classList.add("tile");
    tile.setAttribute("id", "tile-" + i);
    board.appendChild(tile);
}

function updateBoard() {
    for (let i = 0; i < 5; i++) {
        let tile = document.getElementById("tile-" + (attempts * 5 + i));
        if (tile) tile.innerText = currentGuess[i] || "";
    }
}

function checkGuess() {
    if (currentGuess.length !== 5) return;

    const isWordValid = isEnglish 
        ? currentWords.includes(currentGuess) 
        : currentWords.includes(currentGuess.toLocaleLowerCase('tr-TR'));

    if (!isWordValid) {
        message.innerText = isEnglish ? "Not in word list!" : "Sözlükte yok!";
        shakeRow(attempts);
        return; 
    }

    const guessToProcess = currentGuess;
    const rowToProcess = attempts; 
    const guessArray = guessToProcess.split("");
    const secretArray = SECRET_WORD.split("");
    const statuses = Array(5).fill("absent");

    guessArray.forEach((letter, i) => {
        if (letter === secretArray[i]) {
            statuses[i] = "correct";
            secretArray[i] = null;
        }
    });
    guessArray.forEach((letter, i) => {
        if (statuses[i] !== "correct") {
            const letterIndex = secretArray.indexOf(letter);
            if (letterIndex !== -1) {
                statuses[i] = "present";
                secretArray[letterIndex] = null;
            }
        }
    });

    attempts++; 
    currentGuess = ""; 
    message.innerText = "";

    statuses.forEach((status, i) => {
        const tile = document.getElementById("tile-" + (rowToProcess * 5 + i));
        setTimeout(() => {
            tile.classList.add("flip");
            setTimeout(() => {
                tile.classList.add(status);
                updateKeyboardColors(guessArray[i], status);
            }, 250); 
        }, i * 150); 
    });

   setTimeout(() => {
        const isWin = guessToProcess === SECRET_WORD;
        const isLoss = rowToProcess === 5 && !isWin;

        if (isWin || isLoss) {
            // Oyun bittiğinde zamanlayıcıyı durdur
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }

            message.innerText = isWin 
                ? (isEnglish ? "Impressive!" : "Tebrikler!") 
                : (isEnglish ? "Game Over! Word: " : "Kaybettin! Kelime: ") + SECRET_WORD;
            
            attempts = 6; 

            setTimeout(() => {
                showWordDefinition(SECRET_WORD);
            }, 1000);
        }
    }, 1000);
}

const trKeys = [
    ["E", "R", "T", "Y", "U", "I", "O", "P", "Ğ", "Ü"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ş", "İ", "ENTER"],
    ["Z", "C", "V", "B", "N", "M", "Ö", "Ç", "BACK"]
];

const enKeys = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "ENTER"],
    ["Z", "X", "C", "V", "B", "N", "M", "BACK"]
];

const keys = isEnglish ? enKeys : trKeys;

function createKeyboard() {
    const keyboard = document.getElementById("keyboard");
    keyboard.innerHTML = ""; 

    keys.forEach(row => {
        const rowDiv = document.createElement("div");
        rowDiv.classList.add("keyboard-row");
        row.forEach(key => {
            const button = document.createElement("button");
            button.innerHTML = (key === "BACK") ? "&#x232B;" : key;
            button.setAttribute("id", "key-" + key);
            button.classList.add("key");
            if (key === "ENTER" || key === "BACK") button.classList.add("key-wide");
            button.addEventListener("click", () => handleKeyPress(key));
            rowDiv.appendChild(button);
        });
        keyboard.appendChild(rowDiv);
    });
}

document.addEventListener("keydown", (e) => {
    if (attempts >= 6) return;
    let key = e.key.toLocaleUpperCase(isEnglish ? 'en-US' : 'tr-TR');
    if (key === "BACKSPACE") key = "BACK";
    handleKeyPress(key);
});

function handleKeyPress(key) {
    if (attempts >= 6) return;
    
    // Süre Infinity değilse ve henüz başlamadıysa başlat
    if (!timerStarted && timeLeft !== Infinity) {
        startTimer();
    }

    if (key === "ENTER") {
        if (currentGuess.length === 5) checkGuess();
    } else if (key === "BACK") {
        currentGuess = currentGuess.slice(0, -1);
        updateBoard();
    } else if (currentGuess.length < 5 && key.length === 1) {
        const pattern = isEnglish ? /^[A-Z]$/ : /^[A-ZÇĞİÖŞÜ]$/;
        if (pattern.test(key)) {
            currentGuess += key;
            updateBoard();
        }
    }
}

function updateKeyboardColors(letter, status) {
    const keyElement = document.getElementById("key-" + letter);
    if (!keyElement) return;
    if (keyElement.classList.contains("correct")) return;
    if (keyElement.classList.contains("present") && status === "absent") return;

    keyElement.classList.remove("present", "absent");
    keyElement.classList.add(status);
}

function shakeRow(rowNumber) {
    for (let i = 0; i < 5; i++) {
        const tile = document.getElementById("tile-" + (rowNumber * 5 + i));
        if (tile) {
            tile.classList.add("shake");
            setTimeout(() => tile.classList.remove("shake"), 500);
        }
    }
}

// Dil Değiştirme
const langBtn = document.getElementById("lang-btn");
if (langBtn) {
    langBtn.addEventListener("click", () => {
        if (isEnglish) {
            window.location.href = "../index.html";
        } else {
            window.location.href = "wordle-en/index.html";
        }
    });
}

createKeyboard();

// Modal ve Tanım Fonksiyonu
async function showWordDefinition(word) {
    const modal = document.getElementById("word-info-modal");
    const modalWord = document.getElementById("modal-word");
    const modalMeaning = document.getElementById("modal-meaning");
    
    modalWord.innerText = word;
    modal.classList.add("show");

    if (isEnglish) {
        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
            const data = await response.json();
            if (data[0] && data[0].meanings[0]) {
                modalMeaning.innerText = data[0].meanings[0].definitions[0].definition;
            }
        } catch (error) {
            modalMeaning.innerText = "Definition not found.";
        }
    } else {
        modalMeaning.innerText = "Kelimenin anlamını TDK üzerinden inceleyebilirsiniz.";
        document.getElementById("modal-action").innerHTML = `
            <a href="https://sozluk.gov.tr/?ara=${word.toLocaleLowerCase('tr-TR')}" 
               target="_blank" class="key-wide" style="display:inline-block; padding:10px; text-decoration:none; background:#565758; color:white; border-radius:4px;">
               TDK'da Gör
            </a>`;
    }
}

document.getElementById("close-modal").onclick = () => {
    document.getElementById("word-info-modal").classList.remove("show");
};

// --- ZAMANLAYICI FONKSİYONLARI ---

function changeTimerMode() {
    if (timerStarted) {
        alert("Oyun sırasında mod değiştiremezsiniz!");
        return;
    }
    const select = document.getElementById("timer-select");
    const seconds = parseInt(select.value);
    
    if (seconds === 0) {
        document.getElementById("timer-display").innerText = "∞";
        timeLeft = Infinity;
    } else {
        timeLeft = seconds;
        updateTimerDisplay();
    }
}

function updateTimerDisplay() {
    if (timeLeft === Infinity) return;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById("timer-display").innerText = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (timeLeft === Infinity || timerInterval) return;
    
    timerStarted = true;
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 10) {
            document.getElementById("timer-display").classList.add("timer-urgent");
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            endGameByTime();
        }
    }, 1000);
}

function endGameByTime() {
    if (attempts >= 6) return;
    attempts = 6;
    message.innerText = isEnglish ? "Time's up!" : "Süre bitti!";
    showWordDefinition(SECRET_WORD);
}

// Olay Dinleyicisini Bağla
const timerSelectElement = document.getElementById("timer-select");
if (timerSelectElement) {
    timerSelectElement.addEventListener("change", changeTimerMode);
}