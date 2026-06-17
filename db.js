
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";


import { getFirestore, collection, doc, setDoc, getDocs, query, orderBy, where, limit } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCbnE1TVaLf6c_g5t-6yuib8fPlBJwNeSM",
  authDomain: "catch-the-d.firebaseapp.com",
  projectId: "catch-the-d",
  storageBucket: "catch-the-d.firebasestorage.app",
  messagingSenderId: "843289678599",
  appId: "1:843289678599:web:dd4f8c07613e457f52aba2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.saveGameResult = async function (uniqueId, playerName, elapsedMs, superCoins, score) {
  try {
    const playersRef = collection(db, "players");
    const existingSnapshot = await getDocs(playersRef);
    const newId = existingSnapshot.size + 1;
    await setDoc(doc(playersRef, String(newId)), {
      newId: newId,
      uniqueId: uniqueId,
      name: playerName,
      elapsedMs: elapsedMs,
      superCoins: superCoins,
      score: score
    });
    console.log("Game result saved - ID:", uniqueId, "Name:", playerName, "ms:", elapsedMs, "superCoins:", superCoins, "score:", score);
  } catch (err) {
    console.error("Game result save error:", err);
  }
};

window.getTop10Players = async function () {
  try {
    const playersRef = collection(db, "players");
    // yogesh code: order by score desc, then elapsedMs asc for tiebreaker
    const q = query(playersRef, orderBy("score", "desc"), orderBy("elapsedMs", "asc"), limit(10));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data());
  } catch (err) {
    console.error("Leaderboard fetch error:", err);
    return [];
  }
};


window.getPlayers = async function () {
  try {
    const playersRef = collection(db, "players");
    //   const rankScore = score * 100000 - elapsedMs;
    //   const q = query(playersRef, orderBy("rankScore", "desc"), limit(10));
    // const q = query(playersRef, where("score", "==", 8), orderBy("elapsedMs", "asc"), limit(10));
    //   const q = query(playersRef, orderBy("score", "desc"), orderBy("elapsedMs", "asc"), limit(10));
    const snapshot = await getDocs(playersRef);
    return snapshot.docs.map(d => d.data());
  } catch (err) {
    console.error("Leaderboard fetch error:", err);
    return [];
  }
};
const tbody = document.getElementById('leaderboardBody2');

window.getPlayers().then(function (players) {
  if (tbody) tbody.innerHTML = '';

  if (players.length === 0) {
    if (tbody) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="5" style="padding: 30px; color: #a0c4e8; font-size: 16px;">No completed games yet. Be the first!</td>';
      tbody.appendChild(row);
    }
  } else {
    players.forEach(function (entry, index) {
      const rank = index + 1;
      const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
      const rankIcon = rank === 1 ? '&#129351;' : rank === 2 ? '&#129352;' : rank === 3 ? '&#129353;' : rank;

      const row = document.createElement('tr');
      row.innerHTML =
        '<td class="' + rankClass + '">' + rankIcon + '</td>' +
        '<td><strong>' + entry.name + '</strong></td>' +
        '<td><strong>' + entry.uniqueId + '</strong></td>' +
        '<td class="super-coins-cell">' + entry.superCoins + '</td>' +
        '<td>' + (entry.elapsedMs / 1000).toFixed(2) + 's</td>' +
        '<td class="score-cell">' + entry.score + '</td>';

      if (tbody) tbody.appendChild(row);
    });
  }
});

