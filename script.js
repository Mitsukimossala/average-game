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

// --- VARIABLES ---
let players = [];
let playerScore = 0;
let isAlive = true;
let playerName = '';

// --- PAGE SWITCH ---
function startGame() {
  const input = document.getElementById('playerNameInput');
  playerName = input.value.trim();
  if(!playerName) return alert('Entrez un nom valide');
  
  document.getElementById('pageName').style.display = 'none';
  document.getElementById('pageGame').style.display = 'block';
  document.getElementById('playerNameDisplay').textContent = playerName;

  // Afficher les boutons seulement si le joueur s'appelle Im
  if(playerName === 'Im'){
    document.getElementById('endRoundBtn').style.display = 'inline-block';
    document.getElementById('newRoundBtn').style.display = 'inline-block';
  }
}

// --- SOUMETTRE UN NOMBRE ---
function submitGuess() {
  const guessInput = document.getElementById('playerGuess');
  let guess = parseInt(guessInput.value);
  if(isNaN(guess) || guess < 0 || guess > 100) return alert('Nombre invalide');

  // Ajouter ou mettre à jour le joueur
  let existing = players.find(p => p.name === playerName);
  if(!existing){
    players.push({name: playerName, guess, score: playerScore, isAlive});
  } else {
    existing.guess = guess;
  }
  guessInput.value = '';
}

// --- TERMINER LA MANCHE ---
function endRound() {
  const validPlayers = players.filter(p => p.guess !== undefined);
  if(validPlayers.length < 1) return alert('Pas de nombre à traiter');

  const sum = validPlayers.reduce((a,p) => a+p.guess, 0);
  const target = sum / validPlayers.length * 0.8;

  // Trouver le plus proche
  let minDiff = Infinity;
  let winner = null;
  validPlayers.forEach(p => {
    const diff = Math.abs(p.guess - target);
    if(diff < minDiff){
      minDiff = diff;
      winner = p;
    }
  });

  // Mettre à jour les scores
  validPlayers.forEach(p => {
    if(p === winner) p.score = p.score; // aucun point si gagne
    else p.score -= 1; // -1 si perd
    if(p.score <= -10) p.isAlive = false;
  });

  // Affichage des ronds
  displayRoundResults(winner, sum, target);
}

// --- NOUVELLE MANCHE ---
function newRound() {
  document.getElementById('numbersContainer').innerHTML = '';
  document.getElementById('message').textContent = '';
  players.forEach(p => p.guess = undefined);
  document.getElementById('playerGuess').value = '';
}

// --- AFFICHAGE DES RONDS ---
function displayRoundResults(winner, sum, target){
  const container = document.getElementById('numbersContainer');
  container.innerHTML = '';

  players.forEach(p => {
    if(p.guess === undefined) return; // ne pas afficher undefined
    const div = document.createElement('div');
    div.className = 'player-number';
    if
