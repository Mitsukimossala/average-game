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

// Init Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

// DOM Elements
const nameInput = document.getElementById('playerName');
const changeNameBtn = document.getElementById('changeNameBtn');
const guessInput = document.getElementById('playerGuess');
const submitBtn = document.querySelector('#playerInputSection button');
const numbersContainer = document.getElementById('numbersContainer');
const messageEl = document.getElementById('message');

// Player variables
let playerName = localStorage.getItem('playerName') || '';
let playerRef = null;

// Si le joueur a déjà un nom
if(playerName){
  nameInput.value = playerName;
  nameInput.readOnly = true;
}

// Changer de nom
changeNameBtn.addEventListener('click', () => {
  nameInput.readOnly = false;
  nameInput.value = '';
  localStorage.removeItem('playerName');
  playerName = '';
  if(playerRef){
    remove(playerRef);
    playerRef = null;
  }
});

// Soumettre le guess
submitBtn.addEventListener('click', () => {
  const guess = parseInt(guessInput.value);

  // Vérifier le nom
  if(!playerName){
    const name = nameInput.value.trim();
    if(!name) return alert('Veuillez entrer un nom');
    playerName = name;
    localStorage.setItem('playerName', playerName);
    nameInput.readOnly = true;
  }

  if(isNaN(guess) || guess < 0 || guess > 100){
    return alert("Veuillez entrer un nombre entre 0 et 100");
  }

  // Envoyer guess à Firebase
  if(!playerRef){
    playerRef = push(ref(db, 'players'));
    set(playerRef, { name: playerName, guess, score: 10 });
  } else {
    update(playerRef, { guess });
  }

  guessInput.value = '';
});

// Écouter tous les joueurs
let currentPlayers = {};
onValue(ref(db, 'players'), snapshot => {
  const data = snapshot.val() || {};
  currentPlayers = data;

  numbersContainer.innerHTML = '';
  Object.values(data).forEach(p => {
    const div = document.createElement('div');
    div.className = 'player-number';
    div.innerHTML = `<div class="player-name">${p.name}</div>${p.guess} (${p.score})`;
    numbersContainer.appendChild(div);
  });
});

// Terminer la manche
window.endRound = function(){
  const playerList = Object.entries(currentPlayers).map(([id,p]) => ({...p, id}));
  if(playerList.length < 2){ alert('Au moins deux joueurs nécessaires'); return; }

  const sum = playerList.reduce((a,p) => a + p.guess, 0);
  const target = sum / playerList.length * 0.8;

  // Compter doublons
  const counts = {};
  playerList.forEach(p => counts[p.guess] = (counts[p.guess]||0)+1);

  // Déterminer gagnant
  let winner = null;
  let minDiff = Infinity;
  playerList.forEach(p => {
    if(counts[p.guess] > 1) return; // doublon, impossible de gagner
    const diff = Math.abs(p.guess - target);
    if(diff < minDiff){ minDiff = diff; winner = p; }
  });

  // Mettre à jour scores
  playerList.forEach(p => {
    let newScore = p.score;
    if(counts[p.guess] > 1) newScore -= 2;
    else if(p === winner) newScore += 1;
    else newScore -= 1;

    // Vérifier élimination
    if(newScore <= -10){
      remove(ref(db, 'players/' + p.id));
    } else {
      update(ref(db, 'players/' + p.id), { score: newScore });
    }
  });

  // Affichage final
  numbersContainer.innerHTML = '';
  playerList.forEach(p => {
    const div = document.createElement('div');
    div.className = 'player-number';
    if(p === winner) div.classList.add('winner');
    div.innerHTML = `<div class="player-name">${p.name}</div>${p.guess} (${p.score})`;
    numbersContainer.appendChild(div);
  });

  messageEl.textContent = `Somme: ${sum}, Moyenne × 0.8: ${target.toFixed(2)}, Gagnant: ${winner ? winner.name : 'Aucun'}`;
}
