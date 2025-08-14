let players = [];
let playerId = Date.now();
let playerName = '';
let playerScore = 0;
let isAlive = true;

const scoreElem = document.getElementById('score');
const statusElem = document.getElementById('status');
const numbersContainer = document.getElementById('numbersContainer');
const messageElem = document.getElementById('message');

function updateGameStatus() {
  scoreElem.textContent = `Score: ${playerScore}`;
  statusElem.textContent = isAlive ? 'En attente' : 'Éliminé';

  // Activation des boutons selon l’état
  document.querySelector('button[onclick="submitPlayer()"]').disabled = !isAlive;
  document.querySelector('button[onclick="endRound()"]').disabled = !isAlive;
}

function submitPlayer() {
  const nameInput = document.getElementById('playerName');
  const guessInput = document.getElementById('playerGuess');
  const name = nameInput.value.trim();
  const guess = parseInt(guessInput.value);

  if (!name || isNaN(guess) || guess < 0 || guess > 100) {
    alert('Veuillez entrer un nom valide et un nombre entre 0 et 100.');
    return;
  }

  playerName = name;
  playerScore = 0;
  isAlive = true;

  players = [{ id: playerId, name: playerName, guess, score: playerScore }];
  displayPlayers();
  updateGameStatus();

  // Garde le nom dans le champ, vide le nombre
  nameInput.value = playerName;
  guessInput.value = '';
}

function endRound() {
  if (players.length === 0) {
    alert('Aucun joueur pour cette manche.');
    return;
  }

  let sum = players.reduce((acc, p) => acc + p.guess, 0);
  let average = sum / players.length;
  let target = average * 0.8;

  let counts = {};
  players.forEach(p => counts[p.guess] = (counts[p.guess] || 0) + 1);

  let winner = null;
  let minDiff = Infinity;

  players.forEach(p => {
    if (counts[p.guess] > 1) return; // doublon éliminé
    let diff = Math.abs(p.guess - target);
    if (diff < minDiff) {
      minDiff = diff;
      winner = p;
    }
  });

  players.forEach(p => {
    if (counts[p.guess] > 1) {
      p.score -= 2;
    } else if (p === winner) {
      p.score += 1;
    } else {
      p.score -= 1;
    }
  });

  let currentPlayer = players.find(p => p.name === playerName);
  if (currentPlayer) {
    playerScore = currentPlayer.score;
    if (playerScore <= -10) {
      isAlive = false;
    }
  }

  displayPlayers();

  messageElem.textContent = `Somme: ${sum}, Moyenne × 0.8: ${target.toFixed(2)}, Gagnant: ${winner ? winner.name : 'Aucun'}`;

  updateGameStatus();

  if (!isAlive) {
    createNewGameButton();
  }
}

function displayPlayers() {
  numbersContainer.innerHTML = '';
  players.forEach(p => {
    const div = document.createElement('div');
    div.className = 'player-number';
    if (p.name === playerName && isAlive) div.classList.add('winner');
    div.textContent = `${p.name}\n${p.guess} (${p.score})`;
    numbersContainer.appendChild(div);
  });
}

function createNewGameButton() {
  if (!document.getElementById('newGameBtn')) {
    const btn = document.createElement('button');
    btn.id = 'newGameBtn';
    btn.textContent = 'Nouvelle Partie';
    btn.onclick = newGame;
    document.getElementById('roundResults').appendChild(btn);

    document.querySelector('button[onclick="submitPlayer()"]').disabled = true;
    document.querySelector('button[onclick="endRound()"]').disabled = true;
  }
}

function newGame() {
  players = [];
  playerScore = 0;
  isAlive = true;
  playerId = Date.now();
  messageElem.textContent = '';
  numbersContainer.innerHTML = '';
  document.getElementById('playerGuess').value = '';
  document.getElementById('newGameBtn').remove();
  updateGameStatus();
}

// Initialisation au chargement
updateGameStatus();
