<script type="module">
  // Import Firebase app + analytics + database
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
  import { getDatabase, ref, set, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

  // Firebase configuration
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

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  const db = getDatabase(app);

  let currentPlayers = [];

  // Fonction pour soumettre un joueur
  window.submitPlayer = function() {
    const name = document.getElementById('playerName').value.trim();
    const guess = parseInt(document.getElementById('playerGuess').value);
    if (!name || isNaN(guess) || guess < 0 || guess > 100) {
      alert("Nom ou nombre invalide.");
      return;
    }

    const newPlayerRef = push(ref(db, 'players'));
    set(newPlayerRef, { name, guess, score: 10 });

    document.getElementById('playerName').value = '';
    document.getElementById('playerGuess').value = '';
  }

  // Écoute les joueurs en temps réel
  const playersContainer = document.getElementById('numbersContainer');
  onValue(ref(db, 'players'), (snapshot) => {
    const data = snapshot.val() || {};
    currentPlayers = Object.values(data);

    // Mettre à jour l'interface avec les nouveaux joueurs
    playersContainer.innerHTML = '';
    currentPlayers.forEach(p => {
      const div = document.createElement('div');
      div.className = 'player-number';
      div.innerHTML = `<div class="player-name">${p.name}</div>${p.guess}`;
      playersContainer.appendChild(div);
    });
  });

  // Fonction pour terminer la manche
  window.endRound = function() {
    if (currentPlayers.length < 2) {
      alert('Au moins deux joueurs sont nécessaires pour commencer la manche.');
      return;
    }

    const sum = currentPlayers.reduce((acc, player) => acc + player.guess, 0);
    const average = sum / currentPlayers.length;
    const target = average * 0.8;

    // Compter les doublons
    const counts = {};
    currentPlayers.forEach(p => counts[p.guess] = (counts[p.guess] || 0) + 1);

    // Déterminer le gagnant
    let winner = null;
    let minDiff = Infinity;
    currentPlayers.forEach(p => {
      if (counts[p.guess] > 1) return; // Doublon, impossible de gagner
      const diff = Math.abs(p.guess - target);
      if (diff < minDiff) {
        minDiff = diff;
        winner = p;
      }
    });

    // Mettre à jour les scores
    currentPlayers.forEach(p => {
      let newScore = p.score;
      if (counts[p.guess] > 1) newScore -= 2;
      else if (p === winner) newScore += 1;
      else newScore -= 1;

      // Vérifier élimination
      if (newScore <= -10) {
        remove(ref(db, 'players/' + p.id));
      } else {
        update(ref(db, 'players/' + p.id), { score: newScore });
      }
    });

    // Afficher les résultats de la manche
    displayRoundResults(winner, sum, target);
    resetForNextRound();
  }

  // Fonction pour afficher les résultats de la manche
  function displayRoundResults(winner, sum, target) {
    playersContainer.innerHTML = '';
    currentPlayers.forEach(p => {
      const div = document.createElement('div');
      div.className = 'player-number';
      if (p === winner) div.classList.add('winner');
      div.innerHTML = `<div class="player-name">${p.name}</div>${p.guess} (${p.score})`;
      playersContainer.appendChild(div);
    });

    document.getElementById('message').textContent = `Somme: ${sum}, Moyenne × 0.8: ${target.toFixed(2)}, Gagnant: ${winner ? winner.name : 'Aucun'}`;
  }

  // Réinitialiser le jeu pour la prochaine manche
  function resetForNextRound() {
    document.getElementById('playerName').value = '';
    document.getElementById('playerGuess').value = '';
  }

  // Fonction pour démarrer une nouvelle partie
  window.newGame = function() {
    remove(ref(db, 'players'));
    document.getElementById('newGameSection').style.display = 'none';
    document.getElementById('roundResults').style.display = 'none';
    document.getElementById('gameStatus').style.display = 'none';
    document.getElementById('numbersContainer').innerHTML = '';
  }
</script>
