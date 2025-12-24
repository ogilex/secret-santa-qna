import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAiBBu-Ccy6QkzxwzJoBKKDCURYDxLzv_0",
    authDomain: "secret-santa-anon.firebaseapp.com",
    projectId: "secret-santa-anon",
    storageBucket: "secret-santa-anon.firebasestorage.app",
    messagingSenderId: "871525202672",
    appId: "1:871525202672:web:52f92a02cd5582c37d2035",
    measurementId: "G-ZLRPQ1TBMX"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const questionInput = document.getElementById("questionInput");
const postQuestionBtn = document.getElementById("postQuestion");
const questionsList = document.getElementById("questionsList");

const qRef = collection(db, "questions");
const qQuery = query(qRef, orderBy("timestamp", "desc"));

postQuestionBtn.addEventListener("click", async () => {
  const text = questionInput.value.trim();
  if (!text) return;
  await addDoc(qRef, {
    text,
    timestamp: new Date(),
    replies: []
  });
  questionInput.value = "";
});

onSnapshot(qQuery, (snapshot) => {
  questionsList.innerHTML = "";
  snapshot.forEach((docSnap) => {
    const qData = docSnap.data();
    const qId = docSnap.id;
    const qEl = document.createElement("div");
    qEl.className = "question";
    qEl.textContent = qData.text;

    const repliesEl = document.createElement("div");
    repliesEl.className = "replies";
    repliesEl.style.display = "none";

    const showReplies = () => {
      if (repliesEl.style.display === "none") {
        repliesEl.style.display = "block";
        qEl.style.cursor = "default";
      } else {
        repliesEl.style.display = "none";
        qEl.style.cursor = "pointer";
        return;
      }

      repliesEl.innerHTML = "";

      if (qData.replies && qData.replies.length > 0) {
        qData.replies.forEach(r => {
          const rEl = document.createElement("div");
          rEl.className = "reply";
          rEl.textContent = r.text;
          repliesEl.appendChild(rEl);
        });
      }

      const replyBox = document.createElement("div");
      replyBox.className = "reply-input";

      const replyInput = document.createElement("textarea");
      replyInput.rows = 1;
      replyInput.placeholder = "Write an anonymous reply...";

      const replyBtn = document.createElement("button");
      replyBtn.textContent = "Send";

      replyBtn.addEventListener("click", async () => {
        event.stopPropagation();
        const replyText = replyInput.value.trim();
        if (!replyText) return;
        const qDocRef = doc(db, "questions", qId);
        await updateDoc(qDocRef, {
          replies: arrayUnion({ text: replyText })
        });
        replyInput.value = "";
      });

      replyInput.addEventListener("click", (event) => {
        event.stopPropagation();
    });
      replyBox.append(replyInput, replyBtn);
      repliesEl.appendChild(replyBox);
    };

    qEl.addEventListener("click", showReplies);
    qEl.appendChild(repliesEl);
    questionsList.appendChild(qEl);
  });
});
