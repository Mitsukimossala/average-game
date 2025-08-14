let players = [];
let round = 0;
let playerScore = 10;
let isAlive = true;

// Vérifier si un prénom est déjà enregistré dans sessionStorage
const storedName = sessionStorage.getItem('playerName');
if (storedName) {
  document.getElementById('playerName').value = storedName;
  document.getElementById('playerName').style.color = '#fff';
}

// Soumettre un nombre
function submitGuess() {
  const nameInput = document.getElementById('playerName');
  const guessInput = document.getElementById('playerGuess');

  let name = nameInput.value.trim();
  let guess = parseInt(guessInput.value);

  if (!name || isNaN(guess) || guess < 0 || guess > 100) {
    alert('Veuillez entrer un nom valide et un nombre entre 0 et 100.');
    return;
  }

  // Enregistrer le prénom dans sessionStorage
  sessionStorage.setItem('playerName', name);
  nameInput.style.color = '#fff';

  // Ajouter ou mettre à jour le joueur
  let existing = players.find(p => p.name === name);
  if (!existing) {
    players.push({ name, guess, score: playerScore });
  } else {
    existing.guess = guess; // Met à jour le dernier choix
  }

  guessInput.value = '';
  updateGameStatus();
}

// Terminer la manche
function endRound() {
  if (players.length < 2) {
    alert('Au moins deux joueurs sont nécessaires pour commencer la manche.');
    return;
  }

  const sum = players.reduce((acc, p) => acc + p.guess, 0);
  const target = (sum / players.length) * 0.8;

  // Compter doublons
  const counts = {};
  players.forEach(p => counts[p.guess] = (counts[p.guess] || 0) + 1);

  // Déterminer gagnant
  let winner = null;
  let minDiff = Infinity;
  players.forEach(p => {
    if (counts[p.guess] > 1) return; // doublon impossible
    const diff = Math.abs(p.guess - target);
    if (diff < minDiff) {
      minDiff = diff;
      winner = p;
    }
  });

  // Mettre à jour scores et vérifier élimination
  players.forEach(p => {
    if (counts[p.guess] > 1) p.score -= 2;
    else if (p === winner) p.score += 1;
    else p.score -= 1;

    p.isAlive = p.score > -10;
  });

  displayRoundResults(winner, sum, target);
  round++;
  resetForNextRound();
}

// Affichage des résultats de la manche
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

// Mise à jour du statut du joueur
function updateGameStatus() {
  document.getElementById('score').textContent = `Score: ${playerScore}`;
  document.getElementById('status').textContent = isAlive ? 'Survie: Oui' : 'Éliminé';
}

// Réinitialiser pour la manche suivante
function resetForNextRound() {
  players.forEach(p => p.guess = 0); // on garde les joueurs mais reset leur choix
  document.getElementById('playerGuess').value = '';
  document.getElementById('numbersContainer').innerHTML = '';
  document.getElementById('message').textContent = '';
}
