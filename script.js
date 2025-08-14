import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, update } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";

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

// Init Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

// --- Variables ---
let playerName = '';
let playerRef = null;
let players = {};

// --- Nom ---
window.setPlayerName = function() {
  const input = document.getElementById('playerNameInput');
  const name = input.value.trim();
  if(!name) { alert("Entrez un nom"); return; }
  playerName = name;
  document.getElementById('playerNameDisplay').textContent = name;
  document.getElementById('namePage').style.display = 'none';
  document.getElementById('gamePage').style.display = 'block';
  initPlayerInDB();
};

// --- Initialiser joueur ---
function initPlayerInDB() {
  playerRef = push(ref(db, 'players'));
  set(playerRef, { name: playerName, guess: 0, score: 0 });
}

// --- Soumettre nombre ---
window.submitGuess = function() {
  const guessInput = document.getElementById('playerGuess');
  let guess = parseInt(guessInput.value);
  if(isNaN(guess) || guess<0 || guess>100){ alert("0-100"); return; }
  update(playerRef,{guess});
  guessInput.value = '';
};

// --- Ecouter joueurs ---
const playersContainer = document.getElementById('numbersContainer');
onValue(ref(db,'players'), snapshot => {
  players = snapshot.val() || {};
  playersContainer.innerHTML = '';
  Object.values(players).forEach(p=>{
    const div=document.createElement('div');
    div.className='player-number';
    div.innerHTML=`<div class="player-name">${p.name}</div>${p.guess} (${p.score})`;
    playersContainer.appendChild(div);
  });
});

// --- Terminer manche ---
window.endRound = function() {
  const playerList = Object.entries(players).map(([id,p])=>({...p,id}));
  if(playerList.length<2){ alert("2 joueurs min"); return; }

  const sum = playerList.reduce((a,p)=>a+p.guess,0);
  const target = sum/playerList.length*0.8;

  const counts = {};
  playerList.forEach(p=>counts[p.guess]=(counts[p.guess]||0)+1);

  let winner=null, minDiff=Infinity;
  playerList.forEach(p=>{
    if(counts[p.guess]>1) return;
    const diff=Math.abs(p.guess-target);
    if(diff<minDiff){ minDiff=diff; winner=p; }
  });

  playerList.forEach(p=>{
    let newScore=p.score;
    if(counts[p.guess]>1) newScore=Math.max(-10,newScore-1);
    else if(p===winner) newScore=Math.min(0,newScore); // gagnant aucun point
    else newScore=Math.max(-10,newScore-1);            // perdant -1
    update(ref(db,'players/'+p.id),{score:newScore});
  });

  document.getElementById('message').textContent =
    `Somme: ${sum}, Moyenne ×0.8: ${target.toFixed(2)}, Gagnant: ${winner?winner.name:'Aucun'}`;
};

// --- Nouvelle Manche ---
window.newRound = function() {
  Object.values(players).forEach(p=>update(ref(db,'players/'+p.id),{guess:0}));
  document.getElementById('message').textContent='';
};

// --- Nouvelle Partie ---
window.newGame = function() {
  Object.values(players).forEach(p=>update(ref(db,'players/'+p.id),{guess:0,score:0}));
  document.getElementById('message').textContent='';
};