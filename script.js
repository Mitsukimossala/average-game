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

let playersContainer = document.getElementById('numbersContainer');
let message = document.getElementById('message');
let playerScore = 0;
let isAlive = true;

// Soumettre un nombre
window.submitGuess = function(){
  const nameInput = document.getElementById('playerName');
  const guessInput = document.getElementById('playerGuess');
  const name = nameInput.value.trim();
  const guess = parseInt(guessInput.value);

  if(!name || isNaN(guess) || guess < 0 || guess > 100) return alert('Nom ou nombre invalide');

  // Ajouter ou mettre à jour le joueur sur Firebase
  const newPlayerRef = push(ref(db,'players'));
  set(newPlayerRef, { name, guess, score: playerScore, id: newPlayerRef.key });

  guessInput.value = '';
}

// Afficher les résultats seulement à la fin de la manche
window.endRound = function(){
  onValue(ref(db,'players'), snapshot=>{
    const data = snapshot.val() || {};
    const playerList = Object.values(data);
    if(playerList.length === 0) return alert('Pas de joueur !');

    const sum = playerList.reduce((a,p)=>a+p.guess,0);
    const target = sum / playerList.length * 0.8;

    // Compter doublons
    const counts = {};
    playerList.forEach(p=>counts[p.guess]=(counts[p.guess]||0)+1);

    // Déterminer gagnant
    let winner = null;
    let minDiff = Infinity;
    playerList.forEach(p=>{
      if(counts[p.guess]>1) return;
      const diff = Math.abs(p.guess - target);
      if(diff<minDiff){ minDiff=diff; winner=p; }
    });

    // Mettre à jour scores
    playerList.forEach(p=>{
      let newScore = p.score;
      if(p !== winner) newScore = Math.max(-10,newScore-1); // perdant -1
      // gagnant +0
      update(ref(db,'players/'+p.id),{score:newScore});
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

    message.textContent = `Somme: ${sum}, Moyenne × 0.8: ${target.toFixed(2)}, Gagnant: ${winner ? winner.name : 'Aucun'}`;
  }, {onlyOnce:true});
}

// Nouvelle manche : efface seulement les nombres mais garde score
window.newRound = function(){
  // Réinitialiser guesses
  onValue(ref(db,'players'), snapshot=>{
    const data = snapshot.val() || {};
    Object.values(data).forEach(p=>{
      update(ref(db,'players/'+p.id),{guess:0});
    });
  },{onlyOnce:true});

  playersContainer.innerHTML='';
  message.textContent='';
}

// Nouvelle partie : supprime tout (ronds + noms + Firebase), score remis à 0
window.newGame = function(){
  onValue(ref(db,'players'), snapshot=>{
    const data = snapshot.val() || {};
    Object.values(data).forEach(p=>{
      remove(ref(db,'players/'+p.id));
    });
  },{onlyOnce:true});

  playersContainer.innerHTML='';
  message.textContent='';
  playerScore = 0;
  isAlive = true;
  document.getElementById('score').textContent=`Score: ${playerScore}`;
  document.getElementById('status').textContent=isAlive?'Survie: Oui':'Éliminé';
}
