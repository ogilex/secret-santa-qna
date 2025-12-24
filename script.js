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

const expandedQuestions = new Set();

const qRef = collection(db, "questions");
const qQuery = query(qRef, orderBy("timestamp", "desc"));

questionInput.addEventListener("keydown", async (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    postQuestionBtn.click();
  }
});

postQuestionBtn.addEventListener("click", async () => {
  const text = questionInput.value.trim();
  if (!text) return;

  questionInput.value = "";

  await addDoc(qRef, {
    text,
    timestamp: new Date(),
    uid: Date.now() + Math.random(),
    replies: []
  });
});

function updateQuestionDOM(qSnap) {
  const qData = qSnap.data();
  const qId = qSnap.id;

  let qEl = document.getElementById(`question-${qId}`);
  if (!qEl) {
    qEl = document.createElement("div");
    qEl.className = "question";
    qEl.id = `question-${qId}`;

    const qTextEl = document.createElement("div");
    qTextEl.className = "question-text";
    qTextEl.textContent = qData.text;
    qEl.appendChild(qTextEl);

    const repliesList = document.createElement("div");
    repliesList.className = "replies-list";
    qEl.appendChild(repliesList);

    const replyBox = document.createElement("div");
    replyBox.className = "reply-input";
    const replyInput = document.createElement("textarea");
    replyInput.rows = 1;
    replyInput.placeholder = "Write an anonymous reply...";
    const replyBtn = document.createElement("button");
    replyBtn.textContent = "Send";

    replyBtn.addEventListener("click", async e => {
      e.stopPropagation();
      const replyText = replyInput.value.trim();
      if (!replyText) return;

      const rEl = document.createElement("div");
      rEl.className = "reply";
      rEl.textContent = replyText;
      repliesList.appendChild(rEl);

      replyInput.value = "";

      const qDocRef = doc(db, "questions", qId);
      await updateDoc(qDocRef, {
        replies: arrayUnion({ text: replyText, uid: Date.now() + Math.random() })
      });
    });

    replyInput.addEventListener("keydown", async (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        replyBtn.click();
      }
    });

    replyInput.addEventListener("click", e => e.stopPropagation());

    replyBox.append(replyInput, replyBtn);
    qEl.appendChild(replyBox);

    qTextEl.addEventListener("click", () => {
      if (repliesList.style.display === "none") {
        repliesList.style.display = "block";
        expandedQuestions.add(qId);
      } else {
        repliesList.style.display = "none";
        expandedQuestions.delete(qId);
      }
    });

    questionsList.prepend(qEl);
  }

  const repliesList = qEl.querySelector(".replies-list");
  repliesList.innerHTML = "";
  if (qData.replies && qData.replies.length > 0) {
    qData.replies.forEach(r => {
      const rEl = document.createElement("div");
      rEl.className = "reply";
      rEl.textContent = r.text;
      rEl.addEventListener("click", e => e.stopPropagation());
      repliesList.appendChild(rEl);
    });
  }

  if (expandedQuestions.has(qId)) {
    repliesList.style.display = "block";
  } else {
    repliesList.style.display = "none";
  }
}

onSnapshot(qQuery, snapshot => {
  const docs = snapshot.docs.slice().reverse();
  docs.forEach(docSnap => updateQuestionDOM(docSnap));
});