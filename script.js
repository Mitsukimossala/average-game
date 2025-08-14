import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
import { getDatabase, ref, set, push, onValue, update } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

// --- Firebase config ---
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

// --- VARIABLES ---
let playerName = '';
let playerScore = 0;
let isAlive = true;
let playerRef = null;

// --- PAGE SWITCH ---
window.startGame = function() {
  const input = document.getElementById('playerNameInput');
  playerName = input.value.trim();
  if (!playerName) return alert('Entrez un nom valide');

  document.getElementById('pageName').style.display = 'none';
  document.getElementById('pageGame').style.display = 'block';
  document.getElementById('playerNameDisplay').textContent = playerName;

  playerRef = push(ref(db, 'players'));
  set(playerRef, { name: playerName, guess: null, score: playerScore, isAlive });

  if (playerName === 'Im') {
    document.getElementById('endRoundBtn').style.display = 'inline-block';
    document.getElementById('newRoundBtn').style.display = 'inline-block';
  }

  listenPlayers();
}

// --- SOUMETTRE UN NOMBRE ---
window.submitGuess = function() {
  const guessInput = document.getElementById('playerGuess');
  let guess = parseInt(guessInput.value);
  if (isNaN(guess) || guess < 0 || guess > 100) return alert('Nombre invalide');

  update(playerRef, { guess }); // juste update, pas d'affichage
  guessInput.value = '';
}

// --- ECOUTE JOUEURS ---
function listenPlayers() {
  onValue(ref(db, 'players'), snapshot => {
    const data = snapshot.val() || {};
    const container = document.getElementById('numbersContainer');
    container.innerHTML = '';

    // On n'affiche pas les ronds avant la fin de manche
    for (const key in data) {
      const p = data[key];
      if (p.guess === null || p.name === null) continue; // pas afficher si undefined/null
    }
  });
}

// --- TERMINER LA MANCHE ---
window.endRound = function() {
  const playersRef = ref(db, 'players');
  onValue(playersRef, snapshot => {
    const data = snapshot.val() || {};
    let validPlayers = Object.entries(data)
      .filter(([k, p]) => p.guess !== null && p.name !== null)
      .map(([k, p]) => ({ key: k, ...p }));

    if (validPlayers.length < 1) return;

    const sum = validPlayers.reduce((acc, p) => acc + p.guess, 0);
    const target = (sum / validPlayers.length) * 0.8;

    let minDiff = Infinity;
    let winner = null;
    validPlayers.forEach(p => {
      const diff = Math.abs(p.guess - target);
      if (diff < minDiff) { minDiff = diff; winner = p; }
    });

    validPlayers.forEach(p => {
      let newScore = p.score;
      if (p.key !== winner.key) newScore -= 1; // perdants -1
      if (newScore <= -10) p.isAlive = false;
      update(ref(db, 'players/' + p.key), { score: newScore, isAlive: p.isAlive });
    });

    const container = document.getElementById('numbersContainer');
    container.innerHTML = '';
    validPlayers.forEach(p => {
      const div = document.createElement('div');
      div.className = 'player-number';
      div.classList.add(p.key === winner.key ? 'winner' : 'loser');
      div.innerHTML = `<div class="player-name">${p.name}</div>${p.guess} (${p.score})`;
      container.appendChild(div);
    });

    document.getElementById('message').textContent =
      `Somme: ${sum}, Moyenne × 0.8: ${target.toFixed(2)}, Gagnant: ${winner.name}`;

    const me = validPlayers.find(p => p.name === playerName);
    document.getElementById('score').textContent = `Score: ${me.score}`;
    document.getElementById('status').textContent = me.isAlive ? 'Survie: Oui' : 'Survie: Éliminé';
  }, { onlyOnce: true });
}

// --- NOUVELLE MANCHE ---
window.newRound = function() {
  document.getElementById('numbersContainer').innerHTML = '';
  document.getElementById('message').textContent = '';
  document.getElementById('playerGuess').value = '';

  const playersRef = ref(db, 'players');
  onValue(playersRef, snapshot => {
    const data = snapshot.val() || {};
    for (const key in data) {
      update(ref(db, 'players/' + key), { guess: null }); // reset guess
    }
  }, { onlyOnce: true });
}
