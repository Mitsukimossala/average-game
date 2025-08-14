// Générer un ID unique pour chaque joueur
let playerId = 'player_' + Math.floor(Math.random() * 100000);
let score = 0;
let alive = true;

// Référence Firebase
const playersRef = db.ref('players');
const guessesRef = db.ref('guesses');

// Ajouter ce joueur dans la DB
playersRef.child(playerId).set({ score, alive, lastGuess: null });

// Mettre à jour l'affichage local
function updateDisplay() {
  document.getElementById('score').textContent = score;
}

// Soumettre un nombre
function submitGuess() {
  if (!alive) {
    alert('Vous êtes éliminé !');
    return;
  }

  const input = document.getElementById('playerInput');
  const guess = parseInt(input.value);

  if (isNaN(guess) || guess < 0 || guess > 100) {
    alert('Entrez un nombre entre 0 et 100.');
    return;
  }

  // Ajouter le guess dans Firebase
  const newGuessRef = guessesRef.push();
  newGuessRef.set({ playerId, guess });

  // Enregistrer le dernier choix du joueur
  playersRef.child(playerId).update({ lastGuess: guess });

  input.value = '';
  alert('Nombre soumis ! Attendez que la manche soit terminée.');
}

// Terminer la manche et calculer les scores
function endRound() {
  guessesRef.once('value', snapshot => {
    const allGuesses = snapshot.val() ? Object.values(snapshot.val()) : [];
    if (allGuesses.length === 0) {
      alert('Personne n’a joué cette manche !');
      return;
    }

    // Compter les doublons
    const counts = {};
    allGuesses.forEach(g => counts[g.guess] = (counts[g.guess] || 0) + 1);

    // Calculer moyenne × 0.8
    const sum = allGuesses.reduce((a, g) => a + g.guess, 0);
    const target = (sum / allGuesses.length) * 0.8;

    // Déterminer le gagnant
    let closest = null;
    let minDistance = Infinity;

    allGuesses.forEach(g => {
      if (counts[g.guess] > 1) return; // exclure doublons
      const distance = Math.abs(g.guess - target);
      if (distance < minDistance) {
        minDistance = distance;
        closest = g.playerId;
      }
    });

    // Mettre à jour les scores
    allGuesses.forEach(g => {
      playersRef.child(g.playerId).once('value', snap => {
        let p = snap.val();
        if (!p) return;

        if (counts[g.guess] > 1) p.score -= 2; // doublons
        else if (g.playerId === closest) p.score += 1; // gagnant
        else p.score -= 1; // perdant

        if (p.score <= -10) p.alive = false; // élimination

        playersRef.child(g.playerId).set(p);

        if (g.playerId === playerId) {
          score = p.score;
          alive = p.alive;
          updateDisplay();
        }
      });
    });

    // Nettoyer les guesses pour la manche suivante
    guessesRef.remove();

    alert(`Manche terminée ! Moyenne×0.8 = ${target.toFixed(2)}`);
  });
}

// Initial display
updateDisplay();
