// Firebase 연결 (index.html, admin.html 공용)
  const firebaseConfig = {
    apiKey: "AIzaSyDxGaXLMyYnkTrZuqIvYQ3Dj3XUViTXtvA",
    authDomain: "trainer-portfolio.firebaseapp.com",
    projectId: "trainer-portfolio",
    storageBucket: "trainer-portfolio.firebasestorage.app",
    messagingSenderId: "584601873058",
    appId: "1:584601873058:web:943bf76d21b343235105fb"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const auth = firebase.auth();
