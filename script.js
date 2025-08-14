import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
import { getDatabase, ref, set, update, onValue } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

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

// Elements
const pageName = document.getElementById('pageName');
const pageGame = document.getElementById('pageGame');
const playerNameInput = document.getElementById('playerNameInput');
const playerDisplay = document.getElementById('playerDisplay');
const guessInput = document.getElementById('playerGuess');
const numbersContainer = document.getElementById('numbersContainer');
const messageEl = document.getElementById('message');
const scoreEl = document.getElementById('score');
const statusEl = document.getElementById('status');
const endRoundBtn = document.getElementById('endRoundBtn');
const newRoundBtn = document.getElementById('newRoundBtn');
const newGameBtn = document.getElementById('newGameBtn');

let playerName = '';
let playerScore = 0;

// SUBMIT NAME → GAME
window.submitName = function() {
  const name = playerNameInput.value.trim();
  if(!name){ alert('Entrez un nom valide'); return; }
  playerName = name;
  playerDisplay.textContent = playerName;

  // Show buttons only for Im
  if(playerName==='Im'){
    endRoundBtn.style.display='inline-block';
    newRoundBtn.style.display='inline-block';
  }

  pageName.classList.remove('active');
  pageGame.classList.add('active');

  // Initialize player in Firebase if doesn't exist
  set(ref(db,'players/'+playerName),{
    name: playerName,
    guess: undefined,
    score: 0,
    alive: true
  });
  updateStatus();
}

// SUBMIT GUESS
window.submitGuess = function(){
  const guess = parseInt(guessInput.value);
  if(isNaN(guess)||guess<0||guess>100){ alert('Nombre invalide'); return; }

  update(ref(db,'players/'+playerName),{
    guess: guess
  });
  guessInput.value='';
}

// LISTEN PLAYERS
onValue(ref(db,'players'), snapshot=>{
  const data = snapshot.val()||{};
  updateStatus();
});

// UPDATE STATUS
function updateStatus(){
  const playerRef = ref(db,'players/'+playerName);
  onValue(playerRef, snapshot=>{
    const p = snapshot.val();
    if(!p) return;
    playerScore = p.score;
    scoreEl.textContent = `Score: ${playerScore}`;
    statusEl.textContent = (playerScore <= -10)? 'Éliminé' : 'Survie: Oui';
  });
}

// END ROUND
window.endRound = function(){
  onValue(ref(db,'players'), snapshot=>{
    const data = snapshot.val()||{};
    const arr = Object.values(data);

    if(arr.length<2){ alert('Au moins 2 joueurs'); return; }

    const sum = arr.reduce((a,p)=>a+(p.guess||0),0);
    const target = sum/arr.length*0.8;

    const counts={};
    arr.forEach(p=>{
      if(p.guess!==undefined) counts[p.guess] = (counts[p.guess]||0)+1;
    });

    let winner = null;
    let minDiff = Infinity;
    arr.forEach(p=>{
      if(p.guess===undefined) return;
      if(counts[p.guess]>1) return;
      const diff=Math.abs(p.guess-target);
      if(diff<minDiff){ minDiff=diff; winner=p; }
    });

    // Update scores
    arr.forEach(p=>{
      let newScore = p.score;
      if(p.guess===undefined) return;
      if(p===winner) newScore +=0; // gagner = 0
      else newScore -=1; // perdre = -1
      if(newScore<=-10) p.alive=false;
      update(ref(db,'players/'+p.name),{score:newScore, alive:p.alive});
    });

    // DISPLAY NUMBERS
    numbersContainer.innerHTML='';
    arr.forEach(p=>{
      if(!p.name||p.guess===undefined) return;
      const div=document.createElement('div');
      div.className='player-number';
      div.innerHTML=`<div class="player-name">${p.name}</div>${p.guess} (${p.score})`;
      div.style.backgroundColor=(p===winner)?'green':'red';
      numbersContainer.appendChild(div);
    });

    messageEl.textContent=`Somme: ${sum}, Moyenne ×0.8: ${target.toFixed(2)}, Gagnant: ${winner?winner.name:'Aucun'}`;
  },{onlyOnce:true});
}

// NEW ROUND
window.newRound=function(){
  numbersContainer.innerHTML='';
  messageEl.textContent='';
  guessInput.value='';
  onValue(ref(db,'players'), snapshot=>{
    const data = snapshot.val()||{};
    Object.keys(data).forEach(p=>{
      update(ref(db,'players/'+p), {guess:undefined});
    });
  },{onlyOnce:true});
}

// NEW GAME
window.newGame=function(){
  numbersContainer.innerHTML='';
  messageEl.textContent='';
  guessInput.value='';
  onValue(ref(db,'players'), snapshot=>{
    const data = snapshot.val()||{};
    Object.keys(data).forEach(p=>{
      update(ref(db,'players/'+p), {guess:undefined, score:0, alive:true});
    });
  },{onlyOnce:true});
}
