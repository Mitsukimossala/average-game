let players = [];
let round = 0;
let playerScore = 10;
let isAlive = true;

// Si un prénom est déjà en session, l'afficher
const nameInput = document.getElementById('playerName');
const storedName = sessionStorage.getItem('playerName');
if (storedName) {
  nameInput.value = storedName;
  nameInput.style.color = '#fff';
}

// Soumettre un joueur
window.submitPlayer = function() {
  let playerName = nameInput.value.trim();
  let playerGuess = parseInt(document.getElementById('playerGuess').value);

  if (!playerName || isNaN(playerGuess) || playerGuess < 0 || playerGuess > 100) {
    alert('Veuillez entrer un nom valide et un nombre entre 0 et 100.');
    return;
  }

  // Stocker le prénom en session
  sessionStorage.setItem('playerName', playerName);
  nameInput.style.color = '#fff';

  // Ajouter ou mettre à jour le joueur dans le tableau local
  let existing = players.find(p => p.name === playerName);
  if (!existing) {
    players.push({ name: playerName, guess: playerGuess, score: playerScore });
  } else {
    existing.guess = playerGuess; // Met à jour le dernier choix
  }

  document.getElementById('playerGuess').value = '';
  updateGameStatus();
}

// Terminer la manche
window.endRound = function() {
  if (players.length < 2) {
    alert('Au moins deux joueurs sont nécessaires pour commencer la manche.');
    return;
  }

  const sum = players.reduce((acc, p) => acc + p.guess, 0);
  const target = (sum / players.length) * 0.8;

  // Compter doublons
  const counts = {};
  players.forEach(p => counts[p.guess] = (counts[p.guess] || 0) + 1);

  // Déterminer le gagnant
  let winner = null;
  let minDiff = Infinity;
  players.forEach(p => {
    if (counts[p.guess] > 1) return; // doublon impossible de gagner
    const diff = Math.abs(p.guess - target);
    if (diff < minDiff) {
      minDiff = diff;
      winner = p;
    }
  });

  // Mettre à jour les scores
  players.forEach(p => {
    if (counts[p.guess] > 1) p.score -= 2;
    else if (p === winner) p.score += 1;
    else p.score -= 1;

    p.isAlive = p.score > -10;
  });

  displayRoundResults(winner, sum, target);
  round++;

  // Préparer la manche suivante (réinitialiser les guesses)
  players.forEach(p => p.guess = 0);
  document.getElementById('playerGuess').value = '';
}

// Afficher résultats de la manche
function displayRoundResults(winner, sum, target) {
  const container = document.getElementById('numbersContainer');
  container.innerHTML = '';

  players.forEach(p => {
    const div = document.createElement('div');
    div.className = 'player-number';
    if (p === winner) div.classList.add('winner');
    div.innerHTML = `<div class="player-name">${p.name}</div>${p.guess} (${p.score})`;
    container.appendChild(div);
  });

  document.getElementById('message').textContent =
    `Somme: ${sum}, Moyenne × 0.8: ${target.toFixed(2)}, Gagnant: ${winner ? winner.name : 'Aucun'}`;

  updateGameStatus();
}

// Mettre à jour le statut du joueur
function updateGameStatus() {
  document.getElementById('score').textContent = `Score: ${playerScore}`;
  document.getElementById('status').textContent = isAlive ? 'Survie: Oui' : 'Éliminé';
}
