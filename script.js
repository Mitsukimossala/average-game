// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
import {
  getDatabase,
  ref,
  set,
  push,
  onValue,
  remove,
  update,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

// Config Firebase (à remplacer si besoin)
const firebaseConfig = {
  apiKey: "AIzaSyCPJfiPuXV_jWD5hM_x7AB2X9gtsX6lBGE",
  authDomain: "average-game-448ac.firebaseapp.com",
  databaseURL: "https://average-game-448ac-default-rtdb.firebaseio.com",
  projectId: "average-game-448ac",
  storageBucket: "average-game-448ac.appspot.com",
  messagingSenderId: "184831556477",
  appId: "1:184831556477:web:1ee0cffc102a50677caa14",
  measurementId: "G-N4LQ1KH5W0",
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

// Récupération éléments DOM
const playerNameInput = document.getElementById("playerName");
const playerGuessInput = document.getElementById("playerGuess");
const submitBtn = document.getElementById("submitBtn");
const endRoundBtn = document.getElementById("endRoundBtn");
const newGameBtn = document.getElementById("newGameBtn");
const numbersContainer = document.getElementById("numbersContainer");
const messageDisplay = document.getElementById("message");
const scoreDisplay = document.getElementById("score");
const statusDisplay = document.getElementById("status");
const errorMessage = document.getElementById("errorMessage");

// Variables globales joueur
let currentPlayerId = localStorage.getItem("playerId") || null;
let currentPlayerName = localStorage.getItem("playerName") || null;
let currentPlayerScore = 0;
let currentPlayers = {};

// Initialisation UI si nom stocké
if (currentPlayerName) {
  playerNameInput.value = currentPlayerName;
  playerNameInput.disabled = true; // on bloque la modification du nom pour éviter incohérence
}

// Afficher message d’erreur stylé
function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.style.display = "block";
  setTimeout(() => {
    errorMessage.style.display = "none";
  }, 3000);
}

// Met à jour le score et statut affiché
function updateScoreAndStatus(score) {
  scoreDisplay.textContent = `Score: ${score}`;
  statusDisplay.textContent = score > 0 ? "Survie: Oui" : "Éliminé";
  if (score <= 0) {
    submitBtn.disabled = true;
    playerGuessInput.disabled = true;
  } else {
    submitBtn.disabled = false;
    playerGuessInput.disabled = false;
  }
}

// Soumettre un joueur / nouvelle mise à jour guess
submitBtn.addEventListener("click", () => {
  const name = playerNameInput.value.trim();
  const guess = parseInt(playerGuessInput.value);

  if (!name) {
    showError("Le nom ne peut pas être vide !");
    return;
  }
  if (isNaN(guess) || guess < 0 || guess > 100) {
    showError("Veuillez saisir un nombre entre 0 et 100.");
    return;
  }

  // Créer id si besoin
  if (!currentPlayerId) {
    currentPlayerId = Date.now().toString();
    currentPlayerName = name;
    localStorage.setItem("playerId", currentPlayerId);
    localStorage.setItem("playerName", currentPlayerName);
    playerNameInput.disabled = true;
  }

  // Enregistrer dans Firebase
  set(ref(db, `players/${currentPlayerId}`), {
    name: currentPlayerName,
    guess,
    score: currentPlayerScore > 0 ? currentPlayerScore : 0,
  });

  playerGuessInput.value = "";
});

// Écoute temps réel des joueurs
onValue(ref(db, "players"), (snapshot) => {
  currentPlayers = snapshot.val() || {};

  numbersContainer.innerHTML = "";
  let foundCurrentPlayer = false;

  Object.entries(currentPlayers).forEach(([id, player]) => {
    const div = document.createElement("div");
    div.className = "player-number";

    if (id === currentPlayerId) div.style.borderColor = "#00ff00";
    if (player.score <= 0) div.classList.add("eliminated");

    div.innerHTML = `<div class="player-name">${player.name}</div>${player.guess} (${player.score})`;
    numbersContainer.appendChild(div);

    if (id === currentPlayerId) {
      foundCurrentPlayer = true;
      currentPlayerScore = player.score;
      updateScoreAndStatus(player.score);
    }
  });

  // Si joueur non trouvé, remettre état
  if (!foundCurrentPlayer) {
    currentPlayerScore = 0;
    updateScoreAndStatus(0);
  }
});

// Fin de manche -> calcul moyenne, mise à jour scores, etc.
endRoundBtn.addEventListener("click", () => {
  if (Object.keys(currentPlayers).length === 0) {
    showError("Aucun joueur connecté.");
    return;
  }

  // Calcul somme et moyenne
  let somme = 0;
  let nbValides = 0;
  for (const player of Object.values(currentPlayers)) {
    if (typeof player.guess === "number") {
      somme += player.guess;
      nbValides++;
    }
  }
  if (nbValides === 0) {
    showError("Pas de nombres valides pour cette manche.");
    return;
  }

  const moyenne = (somme / nbValides) * 0.8;

  // Trouver gagnant (le plus proche de moyenne)
  let gagnantId = null;
  let plusPetitEcart = Infinity;
  for (const [id, player] of Object.entries(currentPlayers)) {
    if (typeof player.guess === "number") {
      const ecart = Math.abs(player.guess - moyenne);
      if (ecart < plusPetitEcart) {
        plusPetitEcart = ecart;
        gagnantId = id;
      }
    }
  }

  // Mise à jour des scores
  Object.entries(currentPlayers).forEach(([id, player]) => {
    let nouveauScore = player.score || 10;

    if (id === gagnantId) {
      nouveauScore += 10;
    } else {
      nouveauScore -= 10;
    }
    if (nouveauScore < 0) nouveauScore = 0;

    update(ref(db, `players/${id}`), { score: nouveauScore });
  });

  // Affichage résultats
  messageDisplay.textContent = `Somme: ${somme}, Moyenne × 0.8: ${moyenne.toFixed(
    2
  )}, Gagnant: ${
    gagnantId ? currentPlayers[gagnantId].name : "Aucun"
  }`;

  // Marquer gagnant visuellement
  Array.from(numbersContainer.children).forEach((div) => {
    div.classList.remove("winner");
    const nameDiv = div.querySelector(".player-name");
    if (!nameDiv) return;
    const playerNameText = nameDiv.textContent;
    if (
      gagnantId &&
      currentPlayers[gagnantId] &&
      playerNameText === currentPlayers[gagnantId].name
    ) {
      div.classList.add("winner");
    }
  });
});

// Nouvelle partie = reset des données pour tous
newGameBtn.addEventListener("click", () => {
  if (
    confirm(
      "Êtes-vous sûr de vouloir démarrer une nouvelle partie ? Cela réinitialisera tous les scores et nombres."
    )
  ) {
    remove(ref(db, "players"));
    currentPlayerScore = 0;
    updateScoreAndStatus(0);
    messageDisplay.textContent = "";
    numbersContainer.innerHTML = "";
    playerGuessInput.value = "";
  }
});

