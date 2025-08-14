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
let playerScore = 10;

// SUBMIT NAME → GAME
window.submitName = function() {
  const name = playerNameInput.value.trim();
  if(!name){ alert('Entrez un nom valide'); return; }
  playerName=name;
  playerDisplay.textContent = playerName;

  // Show buttons only for Im
  if(playerName==='Im'){
    endRoundBtn.style.display='inline-block';
    newRoundBtn.style.display='inline-block';
  }

  pageName.classList.remove('active');
  pageGame.classList.add('active');
}

// SUBMIT GUESS
window.submitGuess = function(){
  const guess = parseInt(guessInput.value);
  if(isNaN(guess)||guess<0||guess>100){ alert('Nombre invalide'); return; }

  set(ref(db,'players/'+playerName),{
    name: playerName,
    guess: guess,
    score: playerScore
  });
  guessInput.value='';
}

// LISTEN PLAYERS
onValue(ref(db,'players'), snapshot=>{
  const data = snapshot.val()||{};
  numbersContainer.innerHTML='';
  Object.values(data).forEach(p=>{
    if(p.name && p.guess!==undefined){
      const div=document.createElement('div');
      div.className='player-number';
      div.innerHTML=`<div class="player-name">${p.name}</div>${p.guess} (${p.score})`;
      numbersContainer.appendChild(div);
    }
  });
});

// END ROUND
window.endRound=function(){
  onValue(ref(db,'players'), snapshot=>{
    const data=snapshot.val()||{};
    const arr=Object.values(data);
    if(arr.length<2){ alert('Au moins 2 joueurs'); return; }

    const sum=arr.reduce((a,p)=>a+p.guess,0);
    const target=sum/arr.length*0.8;

    const counts={};
    arr.forEach(p=>counts[p.guess]=(counts[p.guess]||0)+1);

    let winner=null;
    let minDiff=Infinity;
    arr.forEach(p=>{
      if(counts[p.guess]>1) return;
      const diff=Math.abs(p.guess-target);
      if(diff<minDiff){ minDiff=diff; winner=p; }
    });

    arr.forEach(p=>{
      if(counts[p.guess]>1) p.score-=1;
      else if(p!==winner) p.score-=1;
      update(ref(db,'players/'+p.name), {score:p.score});
    });

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
    const data=snapshot.val()||{};
    Object.keys(data).forEach(p=>{
      update(ref(db,'players/'+p),{guess:undefined});
    });
  },{onlyOnce:true});
}

// NEW GAME
window.newGame=function(){
  numbersContainer.innerHTML='';
  messageEl.textContent='';
  guessInput.value='';
  onValue(ref(db,'players'), snapshot=>{
    const data=snapshot.val()||{};
    Object.keys(data).forEach(p=>{
      update(ref(db,'players/'+p), {score:10, guess:undefined});
    });
  },{onlyOnce:true});
}
