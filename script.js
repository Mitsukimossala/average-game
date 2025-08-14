let players = [];
let round = 0;
let playerId = Date.now();
let playerName = '';
let playerGuess = 0;
let playerScore = 10;
let isAlive = true;

function submitGuess() {
  playerName = document.getElementById('playerName').value;
  playerGuess = parseInt(document.getElementById('playerGuess').value);

  if (!playerName || isNaN(playerGuess) || playerGuess < 0 || playerGuess > 100) {
    alert('Veuillez entrer un nom valide et un nombre entre 0 et 100.');
    return;
  }

  players.push({ id: playerId, name: playerName, guess: playerGuess });
  updateGameStatus();
}

function endRound() {
  if (players.length < 2) {
    alert('Au moins deux joueurs sont nécessaires pour commencer la manche.');
    return;
  }

  let sum = players.reduce((acc, player) => acc + player.guess, 0);
  let average = sum / players.length;
  let target = average * 0.8;

  let closestPlayer = null;
  let minDiff = Infinity;

  players.forEach(player => {
    let diff = Math.abs(player.guess - target);
    if (diff < minDiff) {
      minDiff = diff;
      closestPlayer = player;
    }
  });

  closestPlayer.score = Math.min(10, closestPlayer.score + 1);
  players.forEach(player => {
    if (player !== closestPlayer) {
      player.score = Math.max(0, player.score - 1);
    }
  });

  displayRoundResults(closestPlayer, sum, target);
  round++;
  resetForNextRound();
}

function displayRoundResults(winner, sum, target) {
  let numbersContainer = document.getElementById('numbersContainer');
  numbersContainer.innerHTML = '';

  players.forEach(player => {
    let playerDiv = document.createElement('div');
    playerDiv.classList.add('player-number');
    if (player === winner) playerDiv.classList.add('winner');
    playerDiv.textContent = `${player.name}\n${player.guess}`;
    numbersContainer.appendChild(playerDiv);
  });

  let message = document.getElementById('message');
  message.textContent = `Somme: ${sum}, Moyenne × 0.8: ${target.toFixed(2)}, Gagnant: ${winner.name}`;
}

function updateGameStatus() {
  document.getElementById('score').textContent = `Score: ${playerScore}`;
  document.getElementById('status').textContent = isAlive ? 'Survie: Oui' : 'Éliminé';
}

function resetForNextRound() {
  players = [];
  document.getElementById('playerName').value = '';
  document.getElementById('playerGuess').value = '';
}
