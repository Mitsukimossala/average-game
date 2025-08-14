import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
import { getDatabase, ref, set, push, onValue, update } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

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

let playerName = '';
let playerScore = 10;
let isAlive = true;

// Elements
const nameInput = document.getElementById('playerName');
const guessInput = document.getElementById('playerGuess');
const numbersContainer = document.getElementById('numbersContainer');
const messageEl = document.getElementById('message');
const scoreEl = document.getElementById('score');
const statusEl = document.getElementById('status');
const endRoundBtn = document.getElementById('endRoundBtn');
const newRoundBtn = document.getElementById('newRoundBtn');
const playerDisplay = document.getElementById('playerDisplay');

// Soumettre un joueur
window.submitGuess = function() {
  const name = nameInput.value.trim();
  const guess = parseInt(guessInput.value);

  if(!name || isNaN(guess) || guess <0 || guess>100){
    alert("Nom ou nombre invalide");
    return;
  }

  playerName = name;
  displayPlayerName(playerName);

  // Ajouter ou mettre à jour dans Firebase
  const playerRef = ref(db, 'players/' + playerName);
  set(playerRef, {
    name: playerName,
    guess: guess,
    score: playerScore
  });

  // Afficher boutons seulement pour Im
  if(playerName === 'Im'){
    endRoundBtn.style.display='inline-block';
    newRoundBtn.style.display='inline-block';
  } else {
    endRoundBtn.style.display='none';
    newRoundBtn.style.display='none';
  }

  guessInput.value='';
}

// Afficher le nom en haut
function displayPlayerName(name){
  playerDisplay.textContent = name;
}

// Écouter tous les joueurs pour affichage temps réel
onValue(ref(db,'players'), snapshot=>{
  const data = snapshot.val() || {};
  numbersContainer.innerHTML='';
  Object.values(data).forEach(p=>{
    if(p.name && p.guess!==undefined){
      const div = document.createElement('div');
      div.className='player-number';
      div.innerHTML=`<div class="player-name">${p.name}</div>${p.guess} (${p.score})`;
      numbersContainer.appendChild(div);
    }
  });
});

// Terminer la manche
window.endRound = function(){
  onValue(ref(db,'players'), snapshot=>{
    const data = snapshot.val() || {};
    const playersArr = Object.values(data);

    if(playersArr.length<2){ alert('Au moins 2 joueurs nécessaires'); return; }

    const sum = playersArr.reduce((a,p)=>a+p.guess,0);
    const target = (sum/playersArr.length)*0.8;

    const counts = {};
    playersArr.forEach(p=>counts[p.guess]=(counts[p.guess]||0)+1);

    let winner=null;
    let minDiff=Infinity;
    playersArr.forEach(p=>{
      if(counts[p.guess]>1) return;
      const diff=Math.abs(p.guess-target);
      if(diff<minDiff){ minDiff=diff; winner=p; }
    });

    // Mise à jour des scores dans Firebase
    playersArr.forEach(p=>{
      let newScore = p.score;
      if(counts[p.guess]>1) newScore -= 2;
      else if(p===winner) newScore +=0;
      else newScore -=1;

      newScore = Math.min(Math.max(newScore,-10),Infinity); // min -10

      update(ref(db,'players/'+p.name), {score: newScore});
    });

    // Affichage résultats pour tous
    numbersContainer.innerHTML='';
    playersArr.forEach(p=>{
      if(!p.name || p.guess===undefined) return;
      const div = document.createElement('div');
      div.className='player-number';
      div.innerHTML=`<div class="player-name">${p.name}</div>${p.guess} (${p.score})`;
      div.style.backgroundColor = (p===winner)? 'green':'red';
      numbersContainer.appendChild(div);
    });

    messageEl.textContent=`Somme: ${sum}, Moyenne × 0.8: ${target.toFixed(2)}, Gagnant: ${winner?winner.name:'Aucun'}`;
  }, {onlyOnce:true});
}

// Nouvelle Manche
window.newRound = function(){
  numbersContainer.innerHTML='';
  messageEl.textContent='';
  guessInput.value='';
  Object.keys(playersArr).forEach(p=>{
    update(ref(db,'players/'+p), {guess:0});
  });
}

// Nouvelle Partie
window.newGame = function(){
  numbersContainer.innerHTML='';
  messageEl.textContent='';
  guessInput.value='';
  onValue(ref(db,'players'), snapshot=>{
    const data = snapshot.val() || {};
    Object.keys(data).forEach(p=>{
      update(ref(db,'players/'+p), {score:10, guess:0});
    });
  }, {onlyOnce:true});
}
