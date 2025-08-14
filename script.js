import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
import { getDatabase, ref, set, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

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

// Initialisation
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

// DOM
const playersContainer = document.getElementById('numbersContainer');
let currentPlayers = {};

// Soumission joueur
window.submitPlayer = function () {
  const name = document.getElementById('playerName').value.trim();
  const guess = parseInt(document.getElementById('playerGuess').value);
  if (!name || isNaN(guess) || guess < 0 || guess > 100) {
    return alert("Nom ou nombre invalide");
  }

  const newPlayerRef = push(ref(db, 'players'));
  set(newPlayerRef, { name, guess, score: 10 });

  document.getElementById('playerName').value = '';
  document.getElementById('playerGuess').value = '';
};

// Écoute en temps réel
onValue(ref(db, 'players'), (snapshot) => {
  const data = snapshot.val() || {};
  currentPlayers = data;
  playersContainer.innerHTML = '';
  Object.values(data).forEach(p => {
    const div = document.createElement('div');
    div.className = 'player-number';
    div.innerHTML = `<div class="player-name">${p.name}</div>${p.guess}`;
    playersContainer.appendChild(div);
  });
});

// Fin de manche
window.endRound = function () {
  const playerList = Object.entries(currentPlayers).map(([id, p]) => ({ ...p, id }));
  if (playerList.length === 0) return alert('Pas de joueur !');

  const sum = playerList.reduce((a, p) => a + p.guess, 0);
  const target = (sum / playerList.length) * 0.8;

  const counts = {};
  playerList.forEach(p => counts[p.guess] = (counts[p.guess] || 0) + 1);

  let winner = null;
  let minDiff = Infinity;
  playerList.forEach(p => {
    if (counts[p.guess] > 1) return;
    const diff = Math.abs(p.guess - target);
    if (diff < minDiff) {
      minDiff = diff;
      winner = p;
    }
  });

  playerList.forEach(p => {
    let newScore = p.score;
    if (counts[p.guess] > 1) newScore -= 2;
    else if (p === winner) newScore += 1;
    else newScore -= 1;

    if (newScore <= -10) {
      remove(ref(db, 'players/' + p.id));
    } else {
      update(ref(db, 'players/' + p.id), { score: newScore });
    }
  });

  // Affichage
  playersContainer.innerHTML = '';
  playerList.forEach(p => {
    const div = document.createElement('div');
    div.className = 'player-number';
    if (p === winner) div.classList.add('winner');
    div.innerHTML = `<div class="player-name">${p.name}</div>${p.guess} (${p.score})`;
    playersContainer.appendChild(div);
  });

  document.getElementById('message').textContent = `Somme: ${sum}, Moyenne × 0.8: ${target.toFixed(2)}, Gagnant: ${winner ? winner.name : 'Aucun'}`;
};
