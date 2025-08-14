// Import Firebase
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

// Initialisation Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

// Récupérer éléments HTML
const playerNameInput = document.getElementById("playerName");
const playerGuessInput = document.getElementById("playerGuess");
const numbersContainer = document.getElementById("numbersContainer");
const messageDisplay = document.getElementById("message");
const scoreDisplay = document.getElementById("score");
const statusDisplay = document.getElementById("status");

// Créer bouton Nouvelle Partie et l'ajouter sous #game
const gameDiv = document.getElementById("game");
const newGameBtn = document.createElement("button");
newGameBtn.textContent = "Nouvelle Partie";
newGameBtn.style.marginTop = "20px";
gameDiv.appendChild(newGameBtn);

// Variables globales
let currentPlayerId = localStorage.getItem("playerId") || null;
let currentPlayerName = localStorage.getItem("playerName") || null;
let currentPlayerScore = 0;
let currentPlayers = {};

// Si on a un nom sauvegardé, on l'affiche dans l'input
if (currentPlayerName) {
  playerNameInput.value = currentPlayerName;
}

// Fonction pour mettre à jour le score et statut affiché
function updateScoreAndStatus(score) {
  scoreDisplay.textContent = `Score: ${score}`;
  statusDisplay.textContent = score > 0 ? "Survie: Oui" : "Éliminé";
}

// Soumettre un joueur
window.submitPlayer = function () {
  const name = playerNameInput.value.trim();
  const guess = parseInt(playerGuessInput.value);

  if (!name || isNaN(guess) || guess < 0 || guess > 100) {
    alert("Nom ou nombre invalide");
    return;
  }

  // Si pas d'id, on crée un nouvel ID et on sauvegarde localement
  if (!currentPlayerId) {
    currentPlayerId = Date.now().toString();
    localStorage.setItem("playerId", currentPlayerId);
    localStorage.setItem("playerName", name);
    currentPlayerName = name;
  }

  // On ajoute ou met à jour dans Firebase
  set(ref(db, `players/${currentPlayerId}`), {
    name: currentPlayerName,
    guess: guess,
    score: currentPlayerScore > 0 ? currentPlayerScore : 0
  });

  playerGuessInput.value = "";
};

// Écouter joueurs en temps réel
onValue(ref(db, "players"), (snapshot) => {
  currentPlayers = snapshot.val() || {};

  // Mettre à jour l’affichage des joueurs
  numbersContainer.innerHTML = "";
  let foundCurrentPlayer = false;

  Object.entries(currentPlayers).forEach(([id, player]) => {
    const div = document.createElement("div");
    div.className = "player-number";
    if (id === currentPlayerId) div.style.borderColor = "#00ff00"; // Vert pour toi
    if (player.score <= 0) div.style.opacity = "0.3"; // Éliminé visuel
    div.innerHTML = `<div class="player-name">${player.name}</div>${player.guess} (${player.score})`;
    numbersContainer.appendChild(div);

    if (id === currentPlayerId) {
      currentPlayerScore = player.score;
      foundCurrentPlayer = true;
    }
  });

  // Si on ne trouve pas notre joueur dans la liste, score à 0
  if (!foundCurrentPlayer) currentPlayerScore = 0;
  updateScoreAndStatus(currentPlayerScore);
});

// Fin de manche
window.endRound = function () {
  const playerList = Object.entries(currentPlayers).map(([id, p]) => ({ ...p, id }));
  if (playerList.length === 0) {
    alert("Pas de joueur !");
    return;
  }

  const sum = playerList.reduce((a, p) => a + p.guess, 0);
  const target = (sum / playerList.length) * 0.8;

  // Compter doublons
  const counts = {};
  playerList.forEach((p) => (counts[p.guess] = (counts[p.guess] || 0) + 1));

  // Déterminer gagnant
  let winner = null;
  let minDiff = Infinity;
  playerList.forEach((p) => {
    if (counts[p.guess] > 1) return; // doublon, impossible de gagner
    const diff = Math.abs(p.guess - target);
    if (diff < minDiff) {
      minDiff = diff;
      winner = p;
    }
  });

  // Mettre à jour scores
  playerList.forEach((p) => {
    let newScore = p.score;
    if (counts[p.guess] > 1) newScore -= 2;
    else if (p === winner) newScore += 1;
    else newScore -= 1;

    // Vérifier élimination
    if (newScore <= 0) {
      remove(ref(db, "players/" + p.id));
      if (p.id === currentPlayerId) currentPlayerScore = 0;
    } else {
      update(ref(db, "players/" + p.id), { score: newScore });
      if (p.id === currentPlayerId) currentPlayerScore = newScore;
    }
  });

  // Affichage final
  numbersContainer.innerHTML = "";
  playerList.forEach((p) => {
    const div = document.createElement("div");
    div.className = "player-number";
    if (p === winner) div.classList.add("winner");
    div.innerHTML = `<div class="player-name">${p.name}</div>${p.guess} (${p.score})`;
    numbersContainer.appendChild(div);
  });

  messageDisplay.textContent = `Somme: ${sum}, Moyenne × 0.8: ${target.toFixed(
    2
  )}, Gagnant: ${winner ? winner.name : "Aucun"}`;

  updateScoreAndStatus(currentPlayerScore);
};

// Nouvelle partie : supprimer tous les joueurs
newGameBtn.addEventListener("click", async () => {
  if (!confirm("Tu es sûr de vouloir recommencer une nouvelle partie ?")) return;

  try {
    console.log("Suppression des joueurs en cours...");
    await remove(ref(db, "players"));
    console.log("Suppression terminée");

    // Reset localStorage
    localStorage.removeItem("playerId");
    localStorage.removeItem("playerName");

    // Reset variables locales
    currentPlayerId = null;
    currentPlayerName = null;
    currentPlayerScore = 0;

    // Reset UI
    playerNameInput.value = "";
    playerGuessInput.value = "";
    numbersContainer.innerHTML = "";
    messageDisplay.textContent = "";
    updateScoreAndStatus(0);

    alert("Nouvelle partie démarrée !");
  } catch (error) {
    console.error("Erreur lors de la réinitialisation de la partie :", error);
    alert("Erreur lors de la réinitialisation, regarde la console.");
  }
});
