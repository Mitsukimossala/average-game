import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
import { getDatabase, ref, set, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

// Firebase config
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
const analytics = getAnalytics(app);
const db = getDatabase(app);

let players = [];
let playerScore = 10;
let isAlive = true;

// Récupération des éléments
const nameInput = document.getElementById('playerName');
const guessInput = document.getElementById('playerGuess');
const numbersContainer = document.getElementById('numbersContainer');
const messageEl = document.getElementById('message');
const scoreEl = document.getElementById('score');
const statusEl = document.getElementById('status');
const endRoundBtn = document.getElementById('endRoundBtn'); // bouton Terminer la Manche
const newRoundBtn = document.getElementById('newRoundBtn'); // bouton Nouvelle Manche

// Soumettre un nombre
window.submitGuess = function() {
  let name = nameInput.value.trim();
  let guess = parseInt(guessInput.value);

  if (!name || isNaN(guess) || guess < 0 || guess > 100) {
    alert('Nom ou nombre invalide.');
    return;
  }

  // Ajouter ou mettre à jour le joueur
  let existing = players.find(p => p.name === name);
  if (!existing) {
    players.push({ name, guess, score: playerScore });
  } else {
    existing.guess = guess;
  }

  // Afficher boutons seulement si nom = Im
  if(name === 'Im') {
    endRoundBtn.style.display = 'inline-block';
    newRoundBtn.style.display = 'inline-block';
  } else {
    endRoundBtn.style.display = 'none';
    newRoundBtn.style.display = 'none';
  }

  guessInput.value = '';
  updateGameStatus();
}

// Terminer la manche
window.endRound = function() {
  if(players.length < 2) { alert('Au moins 2 joueurs nécessaires'); return; }

  const sum = players.reduce((acc, p)=>acc+p.guess, 0);
  const target = (sum/players.length) * 0.8;

  // Compter doublons
  const counts = {};
  players.forEach(p => counts[p.guess] = (counts[p.guess]||0)+1);

  // Déterminer gagnant
  let winner = null;
  let minDiff = Infinity;
  players.forEach(p => {
    if(counts[p.guess] > 1) return;
    const diff = Math.abs(p.guess - target);
    if(diff < minDiff) { minDiff = diff; winner = p; }
  });

  // Mettre à jour scores
  players.forEach(p=>{
    if(counts[p.guess]>1) p.score -= 2;
    else if(p===winner) p.score += 0; // gagne aucun point
    else p.score -= 1;
    p.isAlive = p.score > -10;
  });

  // Affichage final (ronds)
  numbersContainer.innerHTML = '';
  players.forEach(p=>{
    if(!p.name || p.guess === undefined || p.guess === null) return;
    const div = document.createElement('div');
    div.className = 'player-number';
    div.innerHTML = `<div class="player-name">${p.name}</div>${p.guess} (${p.score})`;
    if(p === winner) div.style.backgroundColor = 'green';
    else div.style.backgroundColor = 'red';
    numbersContainer.appendChild(div);
  });

  messageEl.textContent = `Somme: ${sum}, Moyenne × 0.8: ${target.toFixed(2)}, Gagnant: ${winner ? winner.name : 'Aucun'}`;
  updateGameStatus();
}

// Nouvelle Manche
window.newRound = function() {
  players.forEach(p => p.guess = 0);
  numbersContainer.innerHTML = '';
  messageEl.textContent = '';
  guessInput.value = '';
}

// Nouvelle Partie
window.newGame = function() {
  players.forEach(p => {
    p.score = 10;
    p.isAlive = true;
    p.guess = 0;
  });
  numbersContainer.innerHTML = '';
  messageEl.textContent = '';
  updateGameStatus();
}

// Mise à jour du statut
function updateGameStatus() {
  scoreEl.textContent = `Score: ${playerScore}`;
  statusEl.textContent = isAlive ? 'Survie: Oui' : 'Éliminé';
}
