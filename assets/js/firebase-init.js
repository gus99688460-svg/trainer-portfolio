// Firebase 연결 (index.html, admin.html 공용)
// firebase가 로드되지 않아도 사이트 본문은 정상 표시되도록 방어 처리
var firebaseConfig = {
  apiKey: "AIzaSyDxGaXLMyYnkTrZuqIvYQ3Dj3XUViTXtvA",
  authDomain: "trainer-portfolio.firebaseapp.com",
  projectId: "trainer-portfolio",
  storageBucket: "trainer-portfolio.firebasestorage.app",
  messagingSenderId: "584601873058",
  appId: "1:584601873058:web:943bf76d21b343235105fb"
};

var db = null;
var auth = null;
try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  auth = firebase.auth();
} catch (e) {
  console.error('Firebase 초기화 실패:', e);
}
