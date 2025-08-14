// ===== Config Firebase =====
const firebaseConfig = {
  apiKey: "TON_API_KEY",
  authDomain: "TON_DOMAINE.firebaseapp.com",
  databaseURL: "https://TON_PROJET.firebaseio.com",
  projectId: "TON_ID",
  storageBucket: "TON_BUCKET.appspot.com",
  messagingSenderId: "TON_SENDER_ID",
  appId: "TON_APP_ID"
};
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ===== Variables =====
let playerName = "";
let playerScore = 0;
let numbers = [];
const MAX_SCORE = 0;
const MIN_SCORE = -10;

// ===== DOM =====
const welcomeScreen = document.getElementById("welcome");
const gameScreen = document.getElementById("game");
const playerNameInput = document.getElementById("playerNameInput");
const playerNameDisplay = document.getElementById("playerNameDisplay");
const playerScoreDisplay = document.getElementById("playerScore");
const numbersDisplay = document.getElementById("numbers");
const guessInput = document.getElementById("guessInput");
const resultDisplay = document.getElementById("result");

// ===== Démarrer =====
document.getElementById("startGame").addEventListener("click", () => {
  playerName = playerNameInput.value.trim();
  if (!playerName) {
    alert("Entrez un nom !");
    return;
  }
  playerNameDisplay.textContent = playerName;
  welcomeScreen.style.display = "none";
  gameScreen.style.display = "block";
  startNewRound();
});

// ===== Nouvelle manche =====
document.getElementById("newRound").addEventListener("click", () => {
  startNewRound();
});

// ===== Nouvelle partie =====
document.getElementById("newGame").addEventListener("click", () => {
  playerScore = 0;
  updateScore();
  startNewRound();
});

// ===== Jouer =====
document.getElementById("submitGuess").addEventListener("click", () => {
  const guess = parseFloat(guessInput.value);
  if (isNaN(guess)) {
    alert("Entrez un nombre !");
    return;
  }
  const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  if (Math.abs(guess - avg) < 0.01) {
    resultDisplay.textContent = "Bravo !";
    // Victoire => pas de points
  } else {
    resultDisplay.textContent = `Perdu ! Moyenne : ${avg.toFixed(2)}`;
    playerScore--;
  }
  if (playerScore > MAX_SCORE) playerScore = MAX_SCORE;
  if (playerScore < MIN_SCORE) playerScore = MIN_SCORE;
  updateScore();
  guessInput.value = "";
});

function startNewRound() {
  numbers = Array.from({ length: 5 }, () => Math.floor(Math.random() * 10) + 1);
  numbersDisplay.textContent = "Nombres : " + numbers.join(", ");
  resultDisplay.textContent = "";
  guessInput.value = "";
}

function updateScore() {
  playerScoreDisplay.textContent = playerScore;
}