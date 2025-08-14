import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
import { getDatabase, ref, set, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

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

let playersContainer = document.getElementById('numbersContainer');
let message = document.getElementById('message');
let playerScore = 0;
let isAlive = true;

// Contrôle des boutons
const newRoundBtn = document.getElementById('newRoundBtn');
const newGameBtn = document.getElementById('newGameBtn');
const endRoundBtn = document.getElementById('endRoundBtn');

function updateButtonAccess() {
  const name = document.getElementById('playerName').value.trim();
  if(name === "Im") {
    newRoundBtn.style.display = 'inline-block';
    newGameBtn.style.display = 'inline-block';
    endRoundBtn.style.display = 'inline-block';
  } else {
    newRoundBtn.style.display = 'none';
    newGameBtn.style.display = 'none';
    endRoundBtn.style.display = 'none';
  }
  document.getElementById('displayName').textContent = name;
}

// Soumettre un nombre
window.submitGuess = function(){
  const nameInput = document.getElementById('playerName');
  const guessInput = document.getElementById('playerGuess');
  const name = nameInput.value.trim();
  const guess = parseInt(guessInput.value);

  if(!name || isNaN(guess) || guess < 0 || guess > 100) return alert('Nom ou nombre invalide');

  updateButtonAccess();

  const newPlayerRef = push(ref(db,'players'));
  set(newPlayerRef, { name, guess, score: playerScore, id: newPlayerRef.key });

  guessInput.value = '';
}

// Terminer la manche
window.endRound = function(){
  onValue(ref(db,'players'), snapshot=>{
    const data = snapshot.val() || {};
    const playerList = Object.values(data);
    if(playerList.length === 0) return alert('Pas de joueur !');

    const sum = playerList.reduce((a,p)=>a+p.guess,0);
    const target = sum / playerList.length * 0.8;

    const counts = {};
    playerList.forEach(p=>counts[p.guess]=(counts[p.guess]||0)+1);

    let winner = null;
    let minDiff = Infinity;
    playerList.forEach(p=>{
      if(counts[p.guess]>1) return;
      const diff = Math.abs(p.guess - target);
      if(diff<minDiff){ minDiff=diff; winner=p; }
    });

    playerList.forEach(p=>{
      if(p !== winner) p.score = Math.max(-10,p.score-1); // perdants -1
      update(ref(db,'players/'+p.id),{score:p.score});
    });

    playersContainer.innerHTML='';
    playerList.forEach(p=>{
      const div = document.createElement('div');
      div.className='player-number';
      div.innerHTML=`<div class="player-name">${p.name}</div>${p.guess} (${p.score})`;
      if(p===winner) div.style.backgroundColor = 'green';
      else div.style.backgroundColor = 'red';
      playersContainer.appendChild(div);
    });

    message.textContent = `Somme: ${sum}, Moyenne × 0.8: ${target.toFixed(2)}, Gagnant: ${winner ? winner.name : 'Aucun'}`;
  }, {onlyOnce:true});
}

// Nouvelle manche
window.newRound = function(){
  onValue(ref(db,'players'), snapshot=>{
    const data = snapshot.val() || {};
    Object.values(data).forEach(p=>{
      update(ref(db,'players/'+p.id),{guess:0});
    });
  }, {onlyOnce:true});
  playersContainer.innerHTML='';
  message.textContent='';
}

// Nouvelle partie
window.newGame = function(){
  onValue(ref(db,'players'), snapshot=>{
    const data = snapshot.val() || {};
    Object.values(data).forEach(p=>{
      remove(ref(db,'players/'+p.id));
    });
  }, {onlyOnce:true});
  playersContainer.innerHTML='';
  message.textContent='';
  playerScore = 0;
  isAlive = true;
  document.getElementById('score').textContent=`Score: ${playerScore}`;
  document.getElementById('status').textContent=isAlive?'Survie: Oui':'Éliminé';
}
