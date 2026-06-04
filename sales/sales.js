/* =========================================================
   조태현 트레이너 — OT 세일즈북
   sales.js — vanilla, dependency 0
   ========================================================= */
(function () {
  'use strict';

  var deck = document.getElementById('deck');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.dot'));
  var dotsCount = document.getElementById('dotsCount');
  var btnPdf = document.getElementById('btnPdf');
  var btnPdf2 = document.getElementById('btnPdf2');
  var btnHome = document.getElementById('btnHome');

  if (!deck || slides.length === 0) return;

  var total = slides.length;
  var current = 0;

  // --- 현재 슬라이드 표시 업데이트 ---
  function setActive(i) {
    if (i < 0 || i >= total) return;
    current = i;
    dots.forEach(function (d, di) {
      d.classList.toggle('active', di === i);
    });
    if (dotsCount) {
      dotsCount.textContent = (i + 1) + ' / ' + total;
    }
  }

  // --- 슬라이드 이동 ---
  function goTo(i) {
    if (i < 0 || i >= total) return;
    var target = slides[i];
    if (!target) return;
    // scroll-snap을 깨지 않게 inline:center 명시
    target.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    setActive(i);
  }

  // --- IntersectionObserver로 현재 슬라이드 추적 ---
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      var best = null;
      entries.forEach(function (e) {
        if (e.isIntersecting && (best === null || e.intersectionRatio > best.intersectionRatio)) {
          best = e;
        }
      });
      if (best && best.intersectionRatio >= 0.55) {
        var i = slides.indexOf(best.target);
        if (i !== -1 && i !== current) setActive(i);
      }
    }, { root: deck, threshold: [0.55, 0.75, 0.95] });
    slides.forEach(function (s) { io.observe(s); });
  } else {
    // 폴백: scroll 이벤트
    deck.addEventListener('scroll', function () {
      var w = window.innerWidth || 1;
      var i = Math.round(deck.scrollLeft / w);
      if (i !== current) setActive(i);
    }, { passive: true });
  }

  // --- 인디케이터 클릭 ---
  dots.forEach(function (d, i) {
    d.addEventListener('click', function () { goTo(i); });
  });

  // --- 키보드 화살표 ---
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      if (current < total - 1) { goTo(current + 1); e.preventDefault(); }
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      if (current > 0) { goTo(current - 1); e.preventDefault(); }
    } else if (e.key === 'Home') {
      goTo(0); e.preventDefault();
    } else if (e.key === 'End') {
      goTo(total - 1); e.preventDefault();
    } else if (e.key === ' ') {
      // 스페이스 = 다음
      if (current < total - 1) { goTo(current + 1); e.preventDefault(); }
    }
  });

  // --- PDF 다운로드 (window.print) ---
  function doPrint() {
    try {
      window.print();
    } catch (err) {
      // 실패 시 안내만, console 에러 0개 유지
      alert('PDF 저장을 사용할 수 없습니다. 브라우저의 인쇄 메뉴를 사용해 주세요.');
    }
  }
  if (btnPdf) btnPdf.addEventListener('click', doPrint);
  if (btnPdf2) btnPdf2.addEventListener('click', doPrint);

  // --- 홈 (처음 슬라이드로) ---
  if (btnHome) btnHome.addEventListener('click', function () { goTo(0); });

  // --- 회전(orientation) 시 현재 슬라이드 재정렬 ---
  function realign() {
    var target = slides[current];
    if (!target) return;
    // 부드럽지 않게 즉시 정렬 (회전 직후 jump 방지)
    target.scrollIntoView({ inline: 'center', block: 'nearest' });
  }
  window.addEventListener('orientationchange', function () {
    setTimeout(realign, 150);
  });
  window.addEventListener('resize', function () {
    // 리사이즈 시 갑작스러운 점프 방지 — debounce
    if (realign._t) clearTimeout(realign._t);
    realign._t = setTimeout(realign, 200);
  });

  // --- 초기 상태 ---
  setActive(0);
})();
