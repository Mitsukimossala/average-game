import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let players = [];
let round = 0;

// Vérifier si un prénom est déjà enregistré dans sessionStorage
const storedName = sessionStorage.getItem('playerName');
if (storedName) {
  document.getElementById('playerName').value = storedName;
  document.getElementById('playerName').style.color = '#fff';
}

// Soumettre un nombre
window.submitGuess = function() {
  const nameInput = document.getElementById('playerName');
  const guessInput = document.getElementById('playerGuess');

  let name = nameInput.value.trim();
  let guess = parseInt(guessInput.value);

  if (!name || isNaN(guess) || guess < 0 || guess > 100) {
    alert('Veuillez entrer un nom valide et un nombre entre 0 et 100.');
    return;
  }

  // Enregistrer le prénom dans sessionStorage
  sessionStorage.setItem('playerName', name);
  nameInput.style.color = '#fff';

  // Ajouter ou mettre à jour le joueur
  let existing = players.find(p => p.name === name);
  if (!existing) {
    const newRef = push(ref(db, 'players'));
    const newPlayer = { id: newRef.key, name, guess, score: 10 };
    set(newRef, newPlayer);
    players.push(newPlayer);
  } else {
    existing.guess = guess;
    update(ref(db, 'players/' + existing.id), { guess });
  }

  guessInput.value = '';
  displayPlayers();
}

// Écouter les joueurs en temps réel
const container = document.getElementById('numbersContainer');
onValue(ref(db, 'players'), snapshot => {
  const data = snapshot.val() || {};
  players = Object.values(data);
  displayPlayers();
});

// Terminer la manche
window.endRound = function() {
  if (players.length < 2) { alert('Au moins deux joueurs sont nécessaires.'); return; }

  const sum = players.reduce((acc,p)=>acc+p.guess,0);
  const target = (sum/players.length)*0.8;

  // Compter doublons
  const counts = {};
  players.forEach(p => counts[p.guess] = (counts[p.guess]||0)+1);

  // Déterminer gagnant
  let winner = null;
  let minDiff = Infinity;
  players.forEach(p => {
    if (counts[p.guess] > 1) return;
    const diff = Math.abs(p.guess - target);
    if (diff < minDiff) { minDiff = diff; winner = p; }
  });

  // Mettre à jour scores
  players.forEach(p => {
    if (counts[p.guess] > 1) p.score -= 2;
    else if (p === winner) p.score += 1;
    else p.score -= 1;

    p.isAlive = p.score > -10;
    if (!p.isAlive) remove(ref(db, 'players/' + p.id));
    else update(ref(db, 'players/' + p.id), { score: p.score });
  });

  // Affichage
  displayRoundResults(winner, sum, target);
  round++;
  resetForNextRound();
}

function displayPlayers() {
  container.innerHTML = '';
  players.forEach(p => {
    const div = document.createElement('div');
    div.className = 'player-number';
    div.innerHTML = `<div class="player-name">${p.name}</div>${p.guess} (${p.score})`;
    container.appendChild(div);
  });
}

function displayRoundResults(winner, sum, target) {
  displayPlayers();
  document.getElementById('message').textContent =
    `Somme: ${sum}, Moyenne × 0.8: ${target.toFixed(2)}, Gagnant: ${winner ? winner.name : 'Aucun'}`;
}

function resetForNextRound() {
  players.forEach(p => p.guess = 0);
  document.getElementById('playerGuess').value = '';
}
