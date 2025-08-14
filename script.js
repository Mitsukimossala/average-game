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

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

// Variables locales
let playerName = '';
let playerScore = 0;
let isAlive = true;

// Elements
const namePage = document.getElementById('namePage');
const gamePage = document.getElementById('gamePage');
const playerDisplay = document.getElementById('playerDisplay');
const numbersContainer = document.getElementById('numbersContainer');
const message = document.getElementById('message');
const scoreDisplay = document.getElementById('score');
const statusDisplay = document.getElementById('status');
const endRoundBtn = document.getElementById('endRoundBtn');

// Valider le nom
window.submitName = function() {
  const input = document.getElementById('playerName');
  const name = input.value.trim();
  if (!name) return alert("Entrez un nom !");
  playerName = name;
  playerScore = 0;
  isAlive = true;
  playerDisplay.textContent = playerName;
  playerDisplay.classList.remove('hidden');

  namePage.classList.add('hidden');
  gamePage.classList.remove('hidden');

  // Afficher bouton "Terminer la Manche" uniquement si le joueur s'appelle "Im"
  endRoundBtn.style.display = playerName === "Im" ? "inline-block" : "none";

  // Ajouter le joueur à Firebase
  const playerRef = push(ref(db, 'players'));
  set(playerRef, { name: playerName, guess: null, score: playerScore, isAlive: isAlive, id: playerRef.key });

  updateGameStatus();
}

// Soumettre un nombre
window.submitGuess = function() {
  const guessInput = document.getElementById('playerGuess');
  let guess = parseInt(guessInput.value);
  if (isNaN(guess) || guess < 0 || guess > 100) return alert("Nombre invalide (0-100)");

  // Mettre à jour le joueur dans Firebase
  onValue(ref(db, 'players'), (snapshot)=>{
    const data = snapshot.val() || {};
    let playerEntry = Object.entries(data).find(([id,p])=>p.name===playerName);
    if(playerEntry){
      const [id,p] = playerEntry;
      update(ref(db, 'players/'+id), { guess: guess });
    }
  }, { onlyOnce: true });

  guessInput.value = '';
}

// Écouter tous les joueurs en temps réel
onValue(ref(db, 'players'), (snapshot)=>{
  const data = snapshot.val() || {};
  numbersContainer.innerHTML = '';
  Object.values(data).forEach(p=>{
    const div = document.createElement('div');
    div.className = 'player-number';
    // Afficher seulement si la manche est terminée
    div.textContent = p.guess !== null ? `${p.name}: ${p.guess} (${p.score})` : `${p.name}: ??? (${p.score})`;
    numbersContainer.appendChild(div);
  });
});

// Terminer la manche (seul "Im")
window.endRound = function() {
  onValue(ref(db, 'players'), (snapshot)=>{
    const data = snapshot.val() || {};
    const players = Object.values(data);

    if(players.length === 0) return alert("Aucun joueur !");
    const sum = players.reduce((acc,p)=>acc+(p.guess||0),0);
    const target = (sum/players.length)*0.8;

    const counts = {};
    players.forEach(p => counts[p.guess] = (counts[p.guess]||0)+1);

    let winner = null;
    let minDiff = Infinity;
    players.forEach(p=>{
      if(counts[p.guess]>1) return;
      const diff = Math.abs(p.guess-target);
      if(diff<minDiff){ minDiff=diff; winner=p; }
    });

    // Mettre à jour les scores (0 max, -10 min)
    Object.values(data).forEach(p=>{
      let newScore = p.score;
      if(p===winner) newScore = newScore; // Gagnant : aucun point
      else newScore -=1; // Perdant : -1
      if(newScore<-10) newScore=-10;
      if(newScore>0) newScore=0;
      update(ref(db,'players/'+p.id), { score: newScore });
    });

    // Affichage final
    numbersContainer.innerHTML='';
    Object.values(data).forEach(p=>{
      const div = document.createElement('div');
      div.className='player-number';
      if(winner && winner.name===p.name) div.classList.add('winner');
      div.innerHTML=`<div class="player-name">${p.name}</div>${p.guess} (${p.score})`;
      numbersContainer.appendChild(div);
    });

    message.textContent=winner?`Somme: ${sum}, Moyenne ×0.8: ${target.toFixed(2)}, Gagnant: ${winner.name}`:'';
  }, { onlyOnce:true });
}

// Nouvelle Partie
window.newGame = function() {
  onValue(ref(db, 'players'), (snapshot)=>{
    const data = snapshot.val() || {};
    Object.values(data).forEach(p=> remove(ref(db,'players/'+p.id)));
  }, { onlyOnce:true });

  numbersContainer.innerHTML='';
  message.textContent='';
  playerScore=0;
  isAlive=true;
  updateGameStatus();
}

// Mise à jour du statut
function updateGameStatus(){
  scoreDisplay.textContent=`Score: ${playerScore}`;
  statusDisplay.textContent=isAlive?'Survie: Oui':'Éliminé';
}
