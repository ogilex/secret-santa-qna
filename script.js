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

// Firebase config
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

// DOM elements
const questionInput = document.getElementById("questionInput");
const postQuestionBtn = document.getElementById("postQuestion");
const questionsList = document.getElementById("questionsList");

// Firestore references
const qRef = collection(db, "questions");
const qQuery = query(qRef, orderBy("timestamp", "desc"));

// Track expanded questions
const expandedQuestions = new Set();

// Post new question
postQuestionBtn.addEventListener("click", async () => {
  const text = questionInput.value.trim();
  if (!text) return;

  // Add unique ID to allow duplicate text
  await addDoc(qRef, {
    text,
    timestamp: new Date(),
    uid: Date.now() + Math.random(),
    replies: []
  });
  questionInput.value = "";
});

// Real-time updates
onSnapshot(qQuery, (snapshot) => {
  snapshot.forEach((docSnap) => {
    const qData = docSnap.data();
    const qId = docSnap.id;
    const existingQEl = document.getElementById(`question-${qId}`);

    if (existingQEl) {
      // Only update replies
      const repliesEl = existingQEl.querySelector(".replies");
      repliesEl.innerHTML = "";

      if (qData.replies && qData.replies.length > 0) {
        qData.replies.forEach(r => {
          const rEl = document.createElement("div");
          rEl.className = "reply";
          rEl.textContent = r.text;

          // Stop clicks inside replies from collapsing
          rEl.addEventListener("click", (event) => {
            event.stopPropagation();
          });

          repliesEl.appendChild(rEl);
        });
      }

      // Add reply input
      const replyBox = document.createElement("div");
      replyBox.className = "reply-input";

      const replyInput = document.createElement("textarea");
      replyInput.rows = 1;
      replyInput.placeholder = "Write an anonymous reply...";

      const replyBtn = document.createElement("button");
      replyBtn.textContent = "Send";

      replyBtn.addEventListener("click", async (event) => {
        event.stopPropagation();
        const replyText = replyInput.value.trim();
        if (!replyText) return;
        const qDocRef = doc(db, "questions", qId);
        await updateDoc(qDocRef, {
          replies: arrayUnion({ 
            text: replyText, 
            uid: Date.now() + Math.random() // unique ID for duplicate text
          })
        });
        replyInput.value = "";
      });

      replyInput.addEventListener("click", (event) => {
        event.stopPropagation();
      });

      replyBox.append(replyInput, replyBtn);
      repliesEl.appendChild(replyBox);

    } else {
      // Create new question
      const qEl = document.createElement("div");
      qEl.className = "question";
      qEl.id = `question-${qId}`;
      qEl.textContent = qData.text;

      const repliesEl = document.createElement("div");
      repliesEl.className = "replies";

      // Restore expanded state
      if (expandedQuestions.has(qId)) {
        repliesEl.style.display = "block";
        qEl.style.cursor = "default";
      } else {
        repliesEl.style.display = "none";
        qEl.style.cursor = "pointer";
      }

      const showReplies = () => {
        if (repliesEl.style.display === "none") {
          repliesEl.style.display = "block";
          qEl.style.cursor = "default";
          expandedQuestions.add(qId);
        } else {
          repliesEl.style.display = "none";
          qEl.style.cursor = "pointer";
          expandedQuestions.delete(qId);
        }

        repliesEl.innerHTML = "";

        if (qData.replies && qData.replies.length > 0) {
          qData.replies.forEach(r => {
            const rEl = document.createElement("div");
            rEl.className = "reply";
            rEl.textContent = r.text;

            // Prevent collapse on click
            rEl.addEventListener("click", (event) => {
              event.stopPropagation();
            });

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

        replyBtn.addEventListener("click", async (event) => {
          event.stopPropagation();
          const replyText = replyInput.value.trim();
          if (!replyText) return;
          const qDocRef = doc(db, "questions", qId);
          await updateDoc(qDocRef, {
            replies: arrayUnion({ 
              text: replyText, 
              uid: Date.now() + Math.random() // unique ID
            })
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
    }
  });
});

