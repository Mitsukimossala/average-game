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

// Variables
let playerRef = null;
const submitBtn = document.getElementById('submitBtn');
const endRoundBtn = document.getElementById('endRoundBtn');
const playersContainer = document.getElementById('numbersContainer');
const message = document.getElementById('message');
const nameInput = document.getElementById('playerName');
const guessInput = document.getElementById('playerGuess');

// Vérifier si le nom est déjà dans localStorage
let playerName = localStorage.getItem('playerName');
if(playerName){
  nameInput.value = playerName;
  nameInput.readOnly = true;
}

// Soumettre un joueur
submitBtn.addEventListener('click', () => {
  let name = nameInput.value.trim();
  const guess = parseInt(guessInput.value);

  if(!name || isNaN(guess) || guess < 0 || guess > 100) return alert("Nom ou nombre invalide");

  // Enregistrer le nom dans localStorage si c'est la première fois
  if(!playerName){
    playerName = name;
    localStorage.setItem('playerName', playerName);
    nameInput.readOnly = true;
  }

  if(!playerRef){
    playerRef = push(ref(db,'players'));
    set(playerRef, { name: playerName, guess, score: 10 });
  } else {
    update(playerRef, { guess });
  }

  guessInput.value = '';
});

// Écoute joueurs temps réel
let currentPlayers = {};
onValue(ref(db,'players'), snapshot => {
  const data = snapshot.val() || {};
  currentPlayers = data;
  playersContainer.innerHTML = '';
  Object.values(data).forEach(p => {
    const div = document.createElement('div');
    div.className = 'player-number';
    div.innerHTML = `<div class="player-name">${p.name}</div>${p.guess} (${p.score})`;
    playersContainer.appendChild(div);
  });
});

// Fin de manche
endRoundBtn.addEventListener('click', () => {
  const playerList = Object.entries(currentPlayers).map(([id,p]) => ({...p, id}));
  if(playerList.length < 2){ alert('Au moins deux joueurs nécessaires'); return; }

  // Clear résultat
  message.textContent = '';
  playersContainer.innerHTML = '';

  const sum = playerList.reduce((acc,p)=>acc+p.guess,0);
  const target = sum/playerList.length*0.8;

  // Doublons
  const counts = {};
  playerList.forEach(p => counts[p.guess] = (counts[p.guess]||0)+1);

  // Trouver gagnant
  let winner = null;
  let minDiff = Infinity;
  playerList.forEach(p=>{
    if(counts[p.guess]>1) return;
    const diff = Math.abs(p.guess-target);
    if(diff<minDiff){ minDiff=diff; winner=p; }
  });

  // Animation suspense
  let i=0;
  const interval = setInterval(()=>{
    if(i>=playerList.length){ clearInterval(interval); showWinner(); return; }
    const p = playerList[i];
    const div = document.createElement('div');
    div.className='player-number';
    div.innerHTML=`<div class="player-name">${p.name}</div>${p.guess}`;
    playersContainer.appendChild(div);
    i++;
  }, 300);

  function showWinner(){
    // Update scores
    playerList.forEach(p=>{
      let newScore = p.score;
      if(counts[p.guess]>1) newScore-=2;
      else if(p===winner) newScore+=1;
      else newScore-=1;

      if(newScore<=-10){
        remove(ref(db,'players/'+p.id));
      } else {
        update(ref(db,'players/'+p.id),{score:newScore});
      }
    });

    // Affichage final
    playersContainer.innerHTML='';
    playerList.forEach(p=>{
      const div = document.createElement('div');
      div.className='player-number';
      if(p===winner) div.classList.add('winner');
      div.innerHTML=`<div class="player-name">${p.name}</div>${p.guess} (${p.score})`;
      playersContainer.appendChild(div);
    });

    message.textContent=`Somme: ${sum}, Moyenne ×0.8: ${target.toFixed(2)}, Gagnant: ${winner?winner.name:'Aucun'}`;
  }
});
