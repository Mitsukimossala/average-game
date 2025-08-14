import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
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
const analytics = getAnalytics(app);
const db = getDatabase(app);

let players = [];
let playerName = '';
let playerScore = 0;

// Écoute Firebase
const playersContainer = document.getElementById('numbersContainer');
onValue(ref(db, 'players'), (snapshot) => {
  const data = snapshot.val() || {};
  players = Object.values(data);
  displayPlayers();
});

// Soumettre un nombre
window.submitGuess = function() {
  const nameInput = document.getElementById('playerName');
  const guessInput = document.getElementById('playerGuess');
  const name = nameInput.value.trim();
  const guess = parseInt(guessInput.value);

  if (!name || isNaN(guess) || guess < 0 || guess > 100) return alert("Nom ou nombre invalide");

  playerName = name;

  // Ajoute ou met à jour dans Firebase
  const playerRef = ref(db, 'players/' + playerName);
  set(playerRef, { name: playerName, guess: guess, score: playerScore });

  nameInput.style.display = 'none';
  document.getElementById('playerDisplay').textContent = playerName;
  guessInput.value = '';
};

// Affichage
function displayPlayers() {
  playersContainer.innerHTML = '';
  players.forEach(p => {
    const div = document.createElement('div');
    div.className = 'player-number';
    if (p.score > 0) p.score = 0;
    if (p.score < -10) p.score = -10;
    div.innerHTML = `<div class="player-name">${p.name}</div>${p.guess} (${p.score})`;
    playersContainer.appendChild(div);
  });
}

// Terminer la manche
window.endRound = function() {
  if (players.length < 2) return alert("Au moins 2 joueurs requis");

  const sum = players.reduce((a,p) => a + p.guess, 0);
  const target = (sum / players.length) * 0.8;

  // Comptage doublons
  const counts = {};
  players.forEach(p => counts[p.guess] = (counts[p.guess]||0)+1);

  // Gagnant
  let winner = null;
  let minDiff = Infinity;
  players.forEach(p => {
    if (counts[p.guess] > 1) return;
    const diff = Math.abs(p.guess - target);
    if (diff < minDiff) { minDiff = diff; winner = p; }
  });

  // Mettre à jour score
  players.forEach(p => {
    let newScore = p.score;
    if (p === winner) newScore += 0; // gagne rien
    else newScore -= 1; // perd 1 si pas gagnant ou doublon
    if (newScore > 0) newScore = 0;
    if (newScore < -10) newScore = -10;
    update(ref(db, 'players/' + p.name), { score: newScore });
  });

  displayPlayers();
  document.getElementById('message').textContent = `Somme: ${sum}, Moyenne × 0.8: ${target.toFixed(2)}, Gagnant: ${winner ? winner.name : 'Aucun'}`;
};

// Nouvelle Manche
window.newRound = function() {
  players.forEach(p => update(ref(db, 'players/' + p.name), { guess: 0 }));
  displayPlayers();
  document.getElementById('message').textContent = '';
};

// Nouvelle Partie
window.newGame = function() {
  players.forEach(p => remove(ref(db, 'players/' + p.name)));
  players = [];
  document.getElementById('message').textContent = '';
  document.getElementById('playerName').style.display = 'block';
  document.getElementById('playerDisplay').textContent = '';
};