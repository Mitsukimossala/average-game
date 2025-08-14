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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

let currentPlayerId = localStorage.getItem('playerId');
let currentPlayerName = localStorage.getItem('playerName');
let currentPlayerScore = 0;

// Pré-remplir le nom si stocké
window.addEventListener('DOMContentLoaded', () => {
  if (currentPlayerName) {
    document.getElementById('playerName').value = currentPlayerName;
  }
  if (currentPlayerId) {
    // Récupérer le score du joueur actuel dans Firebase pour l'afficher
    onValue(ref(db, `players/${currentPlayerId}`), (snapshot) => {
      const playerData = snapshot.val();
      if (playerData) {
        currentPlayerScore = playerData.score || 0;
        document.getElementById('score').textContent = `Score: ${currentPlayerScore}`;
        document.getElementById('status').textContent = playerData.score > -10 ? "Survie: Oui" : "Éliminé";
      } else {
        // Joueur non trouvé (supprimé ?)
        document.getElementById('score').textContent = "Score: 0";
        document.getElementById('status').textContent = "Survie: Oui";
      }
    });
  } else {
    document.getElementById('score').textContent = "Score: 0";
    document.getElementById('status').textContent = "Survie: Oui";
  }
});

// Soumettre un joueur
window.submitPlayer = function () {
  const name = document.getElementById('playerName').value.trim();
  const guess = parseInt(document.getElementById('playerGuess').value);

  if (!name || isNaN(guess) || guess < 0 || guess > 100) {
    alert("Nom ou nombre invalide");
    return;
  }

  // Sauvegarder le nom en localStorage pour pré-remplir plus tard
  localStorage.setItem('playerName', name);

  if (!currentPlayerId) {
    // Nouveau joueur => créer dans Firebase
    const newPlayerRef = push(ref(db, 'players'));
    set(newPlayerRef, { name, guess, score: 0 }).then(() => {
      currentPlayerId = newPlayerRef.key;
      localStorage.setItem('playerId', currentPlayerId);
      currentPlayerScore = 0;
      document.getElementById('score').textContent = `Score: ${currentPlayerScore}`;
      document.getElementById('status').textContent = "Survie: Oui";
    });
  } else {
    // Joueur déjà existant => mettre à jour guess
    update(ref(db, `players/${currentPlayerId}`), { guess });
  }

  // Nettoyer l'input guess, garder le nom pour la prochaine fois
  document.getElementById('playerGuess').value = '';
};

// Écouter les joueurs en temps réel
const playersContainer = document.getElementById('numbersContainer');
let currentPlayers = {};
onValue(ref(db, 'players'), (snapshot) => {
  const data = snapshot.val() || {};
  currentPlayers = data;
  playersContainer.innerHTML = '';

  Object.entries(data).forEach(([id, p]) => {
    const div = document.createElement('div');
    div.className = 'player-number';
    if (id === currentPlayerId) div.style.borderColor = '#00ffff'; // mettre en évidence ton joueur

    div.innerHTML = `<div class="player-name">${p.name}</div>${p.guess} (${p.score})`;
    if (p.score <= -10) div.classList.add('eliminated');
    playersContainer.appendChild(div);
  });
});

// Terminer la manche
window.endRound = function () {
  const playerList = Object.entries(currentPlayers).map(([id, p]) => ({ ...p, id }));

  if (playerList.length === 0) {
    alert('Pas de joueur !');
    return;
  }

  const sum = playerList.reduce((a, p) => a + (p.guess || 0), 0);
  const target = (sum / playerList.length) * 0.8;

  const counts = {};
  playerList.forEach(p => counts[p.guess] = (counts[p.guess] || 0) + 1);

  let winner = null;
  let minDiff = Infinity;
  playerList.forEach(p => {
    if (counts[p.guess] > 1) return;
    const diff = Math.abs(p.guess - target);
    if (diff < minDiff) {
      minDiff = diff;
      winner = p;
    }
  });

  playerList.forEach(p => {
    let newScore = p.score || 0;
    if (counts[p.guess] > 1) newScore -= 2;
    else if (winner && p.id === winner.id) newScore += 1;
    else newScore -= 1;

    if (newScore <= -10) {
      remove(ref(db, 'players/' + p.id));
      if (p.id === currentPlayerId) {
        document.getElementById('status').textContent = "Éliminé";
      }
    } else {
      update(ref(db, 'players/' + p.id), { score: newScore });
      if (p.id === currentPlayerId) {
        currentPlayerScore = newScore;
        document.getElementById('score').textContent = `Score: ${newScore}`;
        document.getElementById('status').textContent = "Survie: Oui";
      }
    }
  });

  playersContainer.innerHTML = '';
  playerList.forEach(p => {
    const div = document.createElement('div');
    div.className = 'player-number';
    if (winner && p.id === winner.id) div.classList.add('winner');
    div.innerHTML = `<div class="player-name">${p.name}</div>${p.guess} (${p.score})`;
    playersContainer.appendChild(div);
  });

  document.getElementById('message').textContent = `Somme: ${sum}, Moyenne × 0.8: ${target.toFixed(2)}, Gagnant: ${winner ? winner.name : 'Aucun'}`;
};

// Nouvelle partie
window.newGame = async function () {
  if (!confirm("Tu es sûr de vouloir recommencer une nouvelle partie ?")) return;

  try {
    await remove(ref(db, 'players'));

    localStorage.removeItem("playerId");
    localStorage.removeItem("playerName");
    currentPlayerId = null;
    currentPlayerName = null;
    currentPlayerScore = 0;

    document.getElementById('score').textContent = "Score: 0";
    document.getElementById('status').textContent = "Survie: Oui";
    document.getElementById('message').textContent = "";
    document.getElementById('numbersContainer').innerHTML = "";
    document.getElementById('playerName').value = "";
    document.getElementById('playerGuess').value = "";

    alert("Nouvelle partie démarrée !");
  } catch (error) {
    console.error("Erreur lors de la réinitialisation de la partie :", error);
    alert("Erreur lors de la réinitialisation, regarde la console.");
  }
};
