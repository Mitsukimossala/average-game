// Firebase imports (à garder dans ton index.html en <script type="module">)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue, update, remove } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

// Config Firebase (remplace par la tienne)
const firebaseConfig = {
  apiKey: "AIzaSyCPJfiPuXV_jWD5hM_x7AB2X9gtsX6lBGE",
  authDomain: "average-game-448ac.firebaseapp.com",
  databaseURL: "https://average-game-448ac-default-rtdb.firebaseio.com",
  projectId: "average-game-448ac",
  storageBucket: "average-game-448ac.appspot.com",
  messagingSenderId: "184831556477",
  appId: "1:184831556477:web:1ee0cffc102a50677caa14",
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Récupération éléments DOM
const playerNameInput = document.getElementById("playerName");
const playerGuessInput = document.getElementById("playerGuess");
const submitBtn = document.querySelector("button[onclick='submitPlayer()']");
const endRoundBtn = document.querySelector("button[onclick='endRound()']");
const newGameBtn = document.createElement("button");
newGameBtn.textContent = "Nouvelle Partie";
newGameBtn.style.marginLeft = "10px";
endRoundBtn.parentNode.insertBefore(newGameBtn, endRoundBtn.nextSibling);

const scoreDisplay = document.getElementById("score");
const statusDisplay = document.getElementById("status");
const numbersContainer = document.getElementById("numbersContainer");
const messageDisplay = document.getElementById("message");

// Variables état joueur
let currentPlayerId = localStorage.getItem("playerId") || null;
let currentPlayerName = localStorage.getItem("playerName") || "";
let currentPlayerScore = null; // null = joueur pas encore en base
let currentPlayers = {};

// Fonction pour afficher score & status et gérer activation boutons
function updateScoreAndStatus(score) {
  if (score === null) {
    scoreDisplay.textContent = "Score: -";
    statusDisplay.textContent = "Entrez votre nom et un nombre";
    submitBtn.disabled = false;
    playerGuessInput.disabled = false;
    playerNameInput.disabled = false;
  } else if (score > 0) {
    scoreDisplay.textContent = `Score: ${score}`;
    statusDisplay.textContent = "Survie: Oui";
    submitBtn.disabled = false;
    playerGuessInput.disabled = false;
    playerNameInput.disabled = true; // nom bloqué après inscription
  } else {
    scoreDisplay.textContent = `Score: ${score}`;
    statusDisplay.textContent = "Éliminé";
    submitBtn.disabled = true;
    playerGuessInput.disabled = true;
    playerNameInput.disabled = true;
  }
}

// Affiche erreur temporaire
function showError(msg) {
  messageDisplay.textContent = msg;
  setTimeout(() => {
    if (messageDisplay.textContent === msg) {
      messageDisplay.textContent = "";
    }
  }, 3000);
}

// Soumission joueur
window.submitPlayer = function () {
  const name = playerNameInput.value.trim();
  const guess = parseInt(playerGuessInput.value);

  if (!name) {
    alert("Entrez un nom valide");
    return;
  }
  if (isNaN(guess) || guess < 0 || guess > 100) {
    alert("Entrez un nombre entre 0 et 100");
    return;
  }

  if (!currentPlayerId) {
    // Création nouveau joueur dans Firebase
    const newPlayerRef = push(ref(db, "players"));
    currentPlayerId = newPlayerRef.key;
    currentPlayerName = name;
    localStorage.setItem("playerId", currentPlayerId);
    localStorage.setItem("playerName", currentPlayerName);

    set(newPlayerRef, {
      name: currentPlayerName,
      guess: guess,
      score: 0,
    });
  } else {
    // Mise à jour guess du joueur existant
    update(ref(db, `players/${currentPlayerId}`), {
      guess: guess,
    });
  }

  playerGuessInput.value = "";
  updateScoreAndStatus(currentPlayerScore);
};

// Écoute les joueurs en temps réel
onValue(ref(db, "players"), (snapshot) => {
  currentPlayers = snapshot.val() || {};
  numbersContainer.innerHTML = "";

  let foundCurrentPlayer = false;

  Object.entries(currentPlayers).forEach(([id, player]) => {
    const div = document.createElement("div");
    div.className = "player-number";
    div.innerHTML = `<div class="player-name">${player.name}</div>${player.guess ?? "-"}`;
    numbersContainer.appendChild(div);

    if (id === currentPlayerId) {
      foundCurrentPlayer = true;
      currentPlayerScore = player.score ?? 0;
      updateScoreAndStatus(currentPlayerScore);
    }
  });

  if (!foundCurrentPlayer) {
    currentPlayerScore = null;
    updateScoreAndStatus(null);
  }
});

// Fin de manche
window.endRound = function () {
  if (Object.keys(currentPlayers).length === 0) {
    showError("Aucun joueur connecté.");
    return;
  }

  // Somme et moyenne (avec guesses valides)
  let somme = 0;
  let nbValides = 0;
  Object.values(currentPlayers).forEach((player) => {
    if (typeof player.guess === "number") {
      somme += player.guess;
      nbValides++;
    }
  });

  if (nbValides === 0) {
    showError("Pas de nombres valides cette manche.");
    return;
  }

  const moyenne = (somme / nbValides) * 0.8;

  // Trouver gagnant (plus proche de moyenne)
  let gagnantId = null;
  let plusPetitEcart = Infinity;
  Object.entries(currentPlayers).forEach(([id, player]) => {
    if (typeof player.guess === "number") {
      const ecart = Math.abs(player.guess - moyenne);
      if (ecart < plusPetitEcart) {
        plusPetitEcart = ecart;
        gagnantId = id;
      }
    }
  });

  // Mise à jour scores
  Object.entries(currentPlayers).forEach(([id, player]) => {
    let nouveauScore = player.score ?? 0;

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
  )}, Gagnant: ${gagnantId ? currentPlayers[gagnantId].name : "Aucun"}`;

  // Met à jour affichage joueurs gagnant
  Array.from(numbersContainer.children).forEach((div) => {
    div.classList.remove("winner");
    const nameDiv = div.querySelector(".player-name");
    if (!nameDiv) return;
    if (
      gagnantId &&
      currentPlayers[gagnantId] &&
      nameDiv.textContent === currentPlayers[gagnantId].name
    ) {
      div.classList.add("winner");
    }
  });
};

// Nouvelle partie : reset scores et guesses
newGameBtn.addEventListener("click", () => {
  if (
    confirm(
      "Êtes-vous sûr de vouloir démarrer une nouvelle partie ? Cela réinitialisera tous les scores et nombres."
    )
  ) {
    remove(ref(db, "players"));
    currentPlayerScore = null;
    updateScoreAndStatus(null);
    messageDisplay.textContent = "";
    numbersContainer.innerHTML = "";
    playerGuessInput.value = "";
    playerNameInput.value = currentPlayerName; // garde le nom affiché
  }
});
