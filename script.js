// =================== CONFIG ===================
// Générer un ID unique pour chaque joueur
let playerId = 'player_' + Math.floor(Math.random() * 100000);
let score = 0;
let alive = true;
let playerName = "";

// Références Firebase
const playersRef = db.ref('players');
const guessesRef = db.ref('guesses');

// =================== INITIALISATION ===================
function initPlayer() {
  playerName = document.getElementById('playerName').value.trim();
  if (!playerName) playerName = "Joueur" + Math.floor(Math.random()*100);
  playersRef.child(playerId).set({ score, alive, lastGuess: null, name: playerName });
  updateDisplay();
}
document.getElementById('playerName').addEventListener('change', initPlayer);

// =================== SOUMISSION ===================
function submitGuess() {
  if (!alive) {
    alert('Vous êtes éliminé !');
    return;
  }

  if (!playerName) initPlayer();

  const input = document.getElementById('playerInput');
  const guess = parseInt(input.value);

  if (isNaN(guess) || guess < 0 || guess > 100) {
    alert('Entrez un nombre entre 0 et 100.');
    return;
  }

  const newGuessRef = guessesRef.push();
  newGuessRef.set({ playerId, guess, name: playerName });

  playersRef.child(playerId).update({ lastGuess: guess });

  input.value = '';
  alert('Nombre soumis ! Attendez la fin de la manche.');
}

// =================== AFFICHAGE ===================
function updateDisplay() {
  document.getElementById('score').textContent = score;
  document.getElementById('status').textContent = alive ? "" : "ÉLIMINÉ";
}

// =================== TERMINER LA MANCHE ===================
function endRound() {
  guessesRef.once('value', snapshot => {
    const allGuesses = snapshot.val() ? Object.values(snapshot.val()) : [];
    if (allGuesses.length === 0) {
      alert('Personne n’a joué cette manche !');
      return;
    }

    const counts = {};
    allGuesses.forEach(g => counts[g.guess] = (counts[g.guess] || 0) + 1);

    const sum = allGuesses.reduce((a, g) => a + g.guess, 0);
    const target = (sum / allGuesses.length) * 0.8;

    // Déterminer le gagnant
    let closest = null;
    let minDistance = Infinity;
    allGuesses.forEach(g => {
      if (counts[g.guess] > 1) return;
      const distance = Math.abs(g.guess - target);
      if (distance < minDistance) {
        minDistance = distance;
        closest = g.playerId;
      }
    });

    // =================== AFFICHAGE VISUEL ===================
    const container = document.getElementById('numbersContainer');
    container.innerHTML = ""; // vider avant
    allGuesses.forEach(g => {
      const div = document.createElement('div');
      div.classList.add('player-number', 'animation');
      if (g.playerId === closest) div.classList.add('winner');
      div.innerHTML = `<div class="player-name">${g.name}</div>${g.guess}`;
      container.appendChild(div);
    });

    // Animation simple
    setTimeout(() => {
      const message = document.getElementById('message');
      message.textContent = `Somme des nombres = ${sum}, Moyenne × 0.8 = ${target.toFixed(2)}, Gagnant: ${
        allGuesses.find(g => g.playerId === closest)?.name || "Aucun"
      }`;
    }, 1000);

    // =================== MISE À JOUR DES SCORES ===================
    allGuesses.forEach(g => {
      playersRef.child(g.playerId).once('value', snap => {
        let p = snap.val();
        if (!p) return;

        if (counts[g.guess] > 1) p.score -= 2;
        else if (g.playerId === closest) p.score += 1;
        else p.score -= 1;

        if (p.score <= -10) p.alive = false;

        playersRef.child(g.playerId).set(p);

        if (g.playerId === playerId) {
          score = p.score;
          alive = p.alive;
          updateDisplay();
        }
      });
    });

    // Nettoyer les guesses pour la manche suivante
    setTimeout(() => guessesRef.remove(), 2000);
  });
}

// =================== INITIAL DISPLAY ===================
updateDisplay();
