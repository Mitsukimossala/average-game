import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, update, remove } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

// Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCPJfiPuXV_jWD5hM_x7AB2X9gtsX6lBGE",
  authDomain: "average-game-448ac.firebaseapp.com",
  databaseURL: "https://average-game-448ac-default-rtdb.firebaseio.com",
  projectId: "average-game-448ac",
  storageBucket: "average-game-448ac.appspot.com",
  messagingSenderId: "184831556477",
  appId: "1:184831556477:web:1ee0cffc102a50677caa14",
  measurementId: "G-N4LQ1KH5W0"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let playerName = '';
let playerScore = 10;
let players = {}; // stocke tous les joueurs en temps réel

// ELEMENTS
const namePage = document.getElementById('namePage');
const gamePage = document.getElementById('gamePage');
const playerNameDisplay = document.getElementById('playerNameDisplay');
const numbersContainer = document.getElementById('numbersContainer');
const message = document.getElementById('message');

// SUBMIT NAME
window.submitName = function() {
  const input = document.getElementById('playerNameInput');
  const name = input.value.trim();
  if (!name) return alert("Entrez un nom !");
  playerName = name;
  playerNameDisplay.textContent = name;
  namePage.classList.remove('active');
  gamePage.classList.add('active');

  // Ajouter joueur dans Firebase si n'existe pas
  const playerRef = ref(db, 'players/' + playerName);
  set(playerRef, { guess: 0, score: playerScore });
};

// Écouter tous les joueurs en temps réel
onValue(ref(db, 'players'), (snapshot) => {
  players = snapshot.val() || {};
  displayPlayers();
});

// SOUMETTRE UN NOMBRE
window.submitGuess = function() {
  const guessInput = document.getElementById('playerGuess');
  const guess = parseInt(guessInput.value);
  if (isNaN(guess) || guess < 0 || guess > 100) return alert("Choisissez un nombre entre 0 et 100");

  update(ref(db, 'players/' + playerName), { guess });
  guessInput.value = '';
};

// TERMINER LA MANCHE
window.endRound = function() {
  const playerList = Object.entries(players).map(([name, p]) => ({ name, ...p }));
  if (playerList.length < 2) return alert("Au moins 2 joueurs requis");

  const sum = playerList.reduce((acc, p) => acc + p.guess, 0);
  const target = (sum / playerList.length) * 0.8;

  const counts = {};
  playerList.forEach(p => counts[p.guess] = (counts[p.guess]||0)+1);

  let winner = null;
  let minDiff = Infinity;
  playerList.forEach(p => {
    if (counts[p.guess] > 1) return;
    const diff = Math.abs(p.guess - target);
    if (diff < minDiff) { minDiff = diff; winner = p; }
  });

  // Mettre à jour les scores
  playerList.forEach(p => {
    let newScore = p.score;
    if (counts[p.guess] > 1) newScore -= 2;
    else if (p === winner) newScore += 1;
    else newScore -= 1;

    if (newScore <= -10) remove(ref(db, 'players/' + p.name));
    else update(ref(db, 'players/' + p.name), { score: newScore, guess: 0 });
  });

  message.textContent = `Somme: ${sum}, Moyenne ×0.8: ${target.toFixed(2)}, Gagnant: ${winner ? winner.name : 'Aucun'}`;
};

// AFFICHER TOUS LES JOUEURS
function displayPlayers() {
  numbersContainer.innerHTML = '';
  Object.entries(players).forEach(([name, p]) => {
    const div = document.createElement('div');
    div.className = 'player-number';
    div.innerHTML = `<div class="player-name">${name}</div>${p.guess} (${p.score})`;
    numbersContainer.appendChild(div);
  });
}