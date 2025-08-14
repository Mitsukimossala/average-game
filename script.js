let players = [];
let playerScore = 10;
let isAlive = true;

// Sélection du DOM
const namePage = document.getElementById('namePage');
const gamePage = document.getElementById('gamePage');
const playerNameInput = document.getElementById('playerNameInput');
const playerNameDisplay = document.getElementById('playerNameDisplay');

let playerName = '';

// Valider le nom et passer à la page de jeu
window.submitName = function() {
  const name = playerNameInput.value.trim();
  if (!name) { alert('Veuillez entrer un nom'); return; }

  playerName = name;
  playerNameDisplay.textContent = playerName;

  namePage.classList.add('hidden');
  gamePage.classList.remove('hidden');
}

// Soumettre un nombre
window.submitGuess = function() {
  const guessInput = document.getElementById('playerGuess');
  const guess = parseInt(guessInput.value);

  if (isNaN(guess) || guess < 0 || guess > 100) {
    alert('Veuillez entrer un nombre entre 0 et 100.');
    return;
  }

  let existing = players.find(p => p.name === playerName);
  if (!existing) {
    players.push({ name: playerName, guess, score: playerScore });
  } else {
    existing.guess = guess;
  }

  guessInput.value = '';
  updateGameStatus();
}

// Affichage du score (pour l'instant uniquement du joueur local)
function updateGameStatus() {
  document.getElementById('score').textContent = `Score: ${playerScore}`;
  document.getElementById('status').textContent = isAlive ? 'Survie: Oui' : 'Éliminé';
}

// Terminer la manche (logique simple pour l'instant)
window.endRound = function() {
  if (players.length < 1) { alert('Aucun joueur pour cette manche.'); return; }

  const sum = players.reduce((acc, p) => acc + p.guess, 0);
  const target = (sum / players.length) * 0.8;

  let minDiff = Infinity;
  let winner = null;
  players.forEach(p => {
    const diff = Math.abs(p.guess - target);
    if (diff < minDiff) { minDiff = diff; winner = p; }
  });

  players.forEach(p => {
    if (p === winner) p.score += 1;
    else p.score -= 1;
  });

  // Affichage
  const container = document.getElementById('numbersContainer');
  container.innerHTML = '';
  players.forEach(p => {
    const div = document.createElement('div');
    div.className = 'player-number';
    if (p === winner) div.classList.add('winner');
    div.textContent = `${p.name}\n${p.guess} (${p.score})`;
    container.appendChild(div);
  });

  document.getElementById('message').textContent =
    `Somme: ${sum}, Moyenne × 0.8: ${target.toFixed(2)}, Gagnant: ${winner.name}`;

  // Reset pour manche suivante
  players.forEach(p => p.guess = 0);
  document.getElementById('playerGuess').value = '';
}
