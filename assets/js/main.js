async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(path + ' load failed');
  return res.json();
}

function escapeHTML(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function parseGoals(s) {
  return s ? s.split(/[+,]/).map(x => x.trim()).filter(Boolean) : [];
}

const reviewState = { all: [], filters: { gender: null, age: null, goal: null }, sortMode: 'latest' };

function renderHero(p) {
  document.getElementById('hero').innerHTML = `
    <img src="${escapeHTML(p.profileImage)}" alt="${escapeHTML(p.name)}" onerror="this.style.display='none'" />
    <h1>${escapeHTML(p.name)}</h1>
    <div class="title">${escapeHTML(p.title)}</div>
    <div class="tagline">${escapeHTML(p.tagline)}</div>
  `;
}

function renderAbout(p) {
  const certs = (p.certifications || []).map(c => `<li>${escapeHTML(c)}</li>`).join('');
  const career = (p.career || []).map(c => `<li>${escapeHTML(c.period)} — ${escapeHTML(c.place)}</li>`).join('');

  const compsByYear = {};
  (p.competitions || []).forEach(comp => {
    const year = comp.slice(0, 4);
    const rest = comp.slice(5);
    if (!compsByYear[year]) compsByYear[year] = [];
    compsByYear[year].push(rest);
  });
  const yearsAsc = Object.keys(compsByYear).sort((a, b) => a.localeCompare(b));
  const compsHtml = yearsAsc.map(y => `
    <div class="comp-year">
      <h4>${escapeHTML(y)}</h4>
      <ul>${compsByYear[y].map(c => `<li>${escapeHTML(c)}</li>`).join('')}</ul>
    </div>
  `).join('');

  const competitionImage = p.competitionImage ? `
    <figure class="competition-image">
      <img src="${escapeHTML(p.competitionImage)}" alt="시합 사진" loading="lazy" data-zoom="1" onerror="this.parentElement.style.display='none'" />
    </figure>
  ` : '';

  document.getElementById('about').innerHTML = `
    <h2>소개</h2>
    <p>${escapeHTML(p.bio)}</p>
    ${competitionImage}
    ${compsHtml ? `<div class="competitions"><h3>대회 수상</h3>${compsHtml}</div>` : ''}
    <div class="certs"><h3>경력</h3><ul>${career}</ul></div>
    <div class="certs"><h3>자격증</h3><ul>${certs}</ul></div>
  `;
}

function renderProcess(data) {
  const intro = data.intro ? `<p class="process-intro">${escapeHTML(data.intro)}</p>` : '';
  const steps = (data.steps || []).map(s => {
    const images = (s.images || []).length
      ? `<div class="process-step-images">${s.images.map(img =>
          `<img src="${escapeHTML(img)}" alt="${escapeHTML(s.title)}" loading="lazy" data-zoom="1" onerror="this.style.display='none'" />`
        ).join('')}</div>`
      : '';
    return `
      <div class="process-step">
        <div class="process-step-header">
          <span class="process-step-number">${escapeHTML(s.number)}</span>
          <h3 class="process-step-title">${escapeHTML(s.title)}</h3>
        </div>
        <p class="process-step-desc">${escapeHTML(s.description)}</p>
        ${images}
      </div>
    `;
  }).join('');
  document.getElementById('process').innerHTML = `
    <h2>${escapeHTML(data.title || '수업 진행 방식')}</h2>
    ${intro}
    <div class="process-list">${steps}</div>
  `;
}

function chip(type, value) {
  const active = reviewState.filters[type] === value;
  return `<button class="chip${active ? ' chip-active' : ''}" data-filter="${type}" data-value="${escapeHTML(value)}">${escapeHTML(value)}</button>`;
}

function chipInfo(value) {
  return `<span class="chip-info">${escapeHTML(value)}</span>`;
}

function renderFilterBar() {
  const genders = new Set();
  const ages = new Set();
  const goals = new Set();
  reviewState.all.forEach(r => {
    if (r.gender) genders.add(r.gender);
    if (r.memberAge) ages.add(r.memberAge);
    parseGoals(r.memberGoal).forEach(g => goals.add(g));
  });
  const order = (arr) => Array.from(arr).sort();
  const chips = [
    ...order(genders).map(v => chip('gender', v)),
    ...order(ages).map(v => chip('age', v)),
    ...order(goals).map(v => chip('goal', v))
  ];
  if (!chips.length) return '';
  return `<div class="filter-bar"><div class="filter-bar-label">나에게 맞는 후기 찾기</div><div class="filter-bar-chips">${chips.join('')}</div></div>`;
}

function renderReviewCard(r) {
  const badge = r.featured ? `<div class="review-badge">⭐ 추천 후기</div>` : '';
  const stars = r.rating ? `<div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>` : '';
  const name = r.memberName ? `<h3 class="member-name">${escapeHTML(r.memberName)}</h3>` : '';
  const chips = [];
  if (r.gender) chips.push(chipInfo(r.gender));
  if (r.memberAge) chips.push(chipInfo(r.memberAge));
  parseGoals(r.memberGoal).forEach(g => chips.push(chipInfo(g)));
  const chipsHtml = chips.length ? `<div class="chips">${chips.join('')}</div>` : '';
  const subParts = [r.source, r.date].filter(Boolean).map(escapeHTML);
  const sub = subParts.length ? `<div class="sub-meta">${subParts.join(' · ')}</div>` : '';
  const text = r.text ? `<p class="text">${escapeHTML(r.text)}</p>` : '';
  const image = r.image ? `<figure class="review-image"><img src="${escapeHTML(r.image)}" alt="후기 캡처" loading="lazy" data-zoom="1" /></figure>` : '';
  return `<div class="card review-card${r.featured ? ' featured' : ''}">${badge}${stars}${name}${chipsHtml}${sub}${text}${image}</div>`;
}

function renderFilterBanner() {
  const f = reviewState.filters;
  const items = [];
  if (f.gender) items.push({ type: 'gender', value: f.gender });
  if (f.age) items.push({ type: 'age', value: f.age });
  if (f.goal) items.push({ type: 'goal', value: f.goal });
  if (!items.length) return '';
  const pills = items.map(i => `<span class="filter-pill">${escapeHTML(i.value)}<button data-clear-filter="${i.type}" aria-label="해제">×</button></span>`).join('');
  return `<div class="filter-banner"><span class="filter-label">필터:</span>${pills}<button class="filter-clear" data-clear-filter="all">전체 보기</button></div>`;
}

function reviewSortKey(r) {
  if (r.createdAt && typeof r.createdAt.seconds === 'number') return r.createdAt.seconds * 1000;
  if (r.date) { const t = Date.parse(r.date); if (!isNaN(t)) return t; }
  return 0;
}

function renderReviewsView() {
  const f = reviewState.filters;
  const filtered = reviewState.all.filter(r => {
    if (f.gender && r.gender !== f.gender) return false;
    if (f.age && r.memberAge !== f.age) return false;
    if (f.goal && !parseGoals(r.memberGoal).includes(f.goal)) return false;
    return true;
  });
  if (reviewState.sortMode === 'featured') {
    filtered.sort((a, b) => {
      const fa = a.featured ? 1 : 0, fb = b.featured ? 1 : 0;
      if (fa !== fb) return fb - fa;
      return reviewSortKey(b) - reviewSortKey(a);
    });
  } else {
    filtered.sort((a, b) => reviewSortKey(b) - reviewSortKey(a));
  }
  const sortToggle = `<div class="sort-toggle">
    <button data-sort="latest" class="${reviewState.sortMode === 'latest' ? 'active' : ''}">최신순</button>
    <button data-sort="featured" class="${reviewState.sortMode === 'featured' ? 'active' : ''}">추천순</button>
  </div>`;
  const filterBar = renderFilterBar();
  const banner = renderFilterBanner();
  const empty = filtered.length === 0 ? `<div class="empty">아직 등록된 후기가 없습니다. 첫 후기를 남겨주세요!</div>` : '';
  const cards = filtered.map(renderReviewCard).join('');
  document.getElementById('reviews').innerHTML = `<h2>회원 후기</h2><button class="write-review-btn" id="write-review">✏️ 후기 쓰기</button>${sortToggle}${filterBar}${banner}${empty}${cards}`;
}

function renderReviewsAll(data) {
  reviewState.all = (data.reviews || []).filter(r => !r.hidden);
  renderReviewsView();
}

function renderBeforeAfter(data) {
  const section = document.getElementById('before-after');
  const navLink = document.querySelector('nav a[href="#before-after"]');
  const list = data.items || [];
  // 등록된 비포/애프터가 없으면 섹션과 메뉴를 숨김 (빈 제목·깨진 사진 방지)
  if (!list.length) {
    if (section) section.style.display = 'none';
    if (navLink) navLink.style.display = 'none';
    return;
  }
  if (section) section.style.display = '';
  if (navLink) navLink.style.display = '';
  const items = list.map(b => `
    <div class="card ba-card">
      <h3>${escapeHTML(b.memberLabel)} · ${escapeHTML(b.period)}</h3>
      <div class="images">
        <figure><img src="${escapeHTML(b.beforeImage)}" alt="before" data-zoom="1" onerror="this.style.display='none'" /><figcaption>Before · ${escapeHTML(b.weightBefore)}kg</figcaption></figure>
        <figure><img src="${escapeHTML(b.afterImage)}" alt="after" data-zoom="1" onerror="this.style.display='none'" /><figcaption>After · ${escapeHTML(b.weightAfter)}kg</figcaption></figure>
      </div>
      <p class="summary">${escapeHTML(b.note || '')}</p>
    </div>
  `).join('');
  section.innerHTML = `<h2>비포 / 애프터</h2>${items}`;
}

function renderContact(p) {
  const c = p.contacts || {};
  document.getElementById('contact').innerHTML = `
    <h2>상담 / 연락</h2>
    <div class="contact-buttons">
      ${c.instagram ? `<a class="insta" href="${escapeHTML(c.instagram)}" target="_blank" rel="noopener">인스타그램 DM</a>` : ''}
      ${c.kakaoOpen ? `<a class="kakao" href="${escapeHTML(c.kakaoOpen)}" target="_blank" rel="noopener">카카오톡 오픈채팅</a>` : ''}
      ${c.phone ? `<a class="phone" href="tel:${escapeHTML(c.phone.replace(/-/g,''))}">${escapeHTML(c.phone)}</a>` : ''}
    </div>
  `;
}

function openLightbox(clickedImg) {
  let container = clickedImg.parentElement;
  while (container && container.querySelectorAll('img[data-zoom="1"]').length < 2) {
    container = container.parentElement;
    if (container === document.body) break;
  }
  const group = container && container !== document.body
    ? Array.from(container.querySelectorAll('img[data-zoom="1"]'))
    : [clickedImg];
  let idx = group.indexOf(clickedImg);
  if (idx < 0) idx = 0;

  const lb = document.createElement('div');
  lb.className = 'lightbox';
  const lbImg = document.createElement('img');
  lb.appendChild(lbImg);

  const prev = document.createElement('button');
  prev.className = 'lightbox-nav lightbox-prev';
  prev.setAttribute('aria-label', '이전 사진');
  prev.textContent = '‹';

  const next = document.createElement('button');
  next.className = 'lightbox-nav lightbox-next';
  next.setAttribute('aria-label', '다음 사진');
  next.textContent = '›';

  const counter = document.createElement('div');
  counter.className = 'lightbox-counter';

  function update() {
    lbImg.src = group[idx].src;
    counter.textContent = `${idx + 1} / ${group.length}`;
  }
  function go(delta) {
    idx = (idx + delta + group.length) % group.length;
    update();
  }
  function close() {
    document.removeEventListener('keydown', onKey);
    lb.remove();
  }
  function onKey(e) {
    if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'Escape') close();
  }

  prev.addEventListener('click', e => { e.stopPropagation(); go(-1); });
  next.addEventListener('click', e => { e.stopPropagation(); go(1); });
  lbImg.addEventListener('click', e => e.stopPropagation());
  lb.addEventListener('click', close);
  document.addEventListener('keydown', onKey);

  let touchStartX = 0;
  let touchStartY = 0;
  lb.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx > 0 ? -1 : 1);
  }, { passive: true });

  if (group.length > 1) {
    lb.appendChild(prev);
    lb.appendChild(next);
    lb.appendChild(counter);
  }
  document.body.appendChild(lb);
  update();
}

// ===== 후기 작성 기능 (Firebase) — db 없으면 조용히 건너뜀 =====
function compressImage(file, maxSize, quality) {
  maxSize = maxSize || 1000;
  quality = quality || 0.7;
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > h && w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize; }
        else if (h > maxSize) { w = Math.round(w * maxSize / h); h = maxSize; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function loadApprovedReviews() {
  if (!db) return [];
  const snap = await db.collection('reviews').where('approved', '==', true).get();
  const rows = snap.docs.map(d => d.data());
  return rows;
}

function paintStars(box, val) {
  box.querySelectorAll('span').forEach(s => {
    s.classList.toggle('on', Number(s.dataset.star) <= val);
  });
}

function openReviewModal() {
  const modal = document.getElementById('review-modal');
  if (!modal) return;
  document.getElementById('review-form').reset();
  document.getElementById('review-form-wrap').hidden = false;
  document.getElementById('review-done').hidden = true;
  document.getElementById('review-msg').textContent = '';
  const box = document.getElementById('star-input');
  box.dataset.value = '5';
  paintStars(box, 5);
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeReviewModal() {
  const modal = document.getElementById('review-modal');
  if (modal) modal.hidden = true;
  document.body.style.overflow = '';
}

function setupReviewForm() {
  const form = document.getElementById('review-form');
  const box = document.getElementById('star-input');
  if (!form || !box) return;
  const msg = document.getElementById('review-msg');
  const submitBtn = document.getElementById('review-submit');

  paintStars(box, Number(box.dataset.value));
  box.addEventListener('click', e => {
    const s = e.target.closest('span[data-star]');
    if (!s) return;
    box.dataset.value = s.dataset.star;
    paintStars(box, Number(s.dataset.star));
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const text = form.text.value.trim();
    if (!text) { msg.textContent = '후기 내용을 입력해주세요.'; return; }
    if (!db) { msg.textContent = '연결 오류로 등록할 수 없어요. 새로고침 후 다시 시도해주세요.'; return; }
    submitBtn.disabled = true;
    submitBtn.textContent = '등록 중...';
    msg.textContent = '';
    try {
      let image = '';
      if (form.image.files[0]) {
        msg.textContent = '사진 처리 중...';
        image = await compressImage(form.image.files[0]);
      }
      await db.collection('reviews').add({
        rating: Number(box.dataset.value) || 5,
        memberName: form.memberName.value.trim(),
        gender: form.gender.value,
        memberAge: form.memberAge.value,
        memberGoal: form.memberGoal.value.trim(),
        text: text,
        image: image,
        source: '사이트 후기',
        date: new Date().toISOString().slice(0, 10),
        approved: false,
        featured: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      document.getElementById('review-form-wrap').hidden = true;
      document.getElementById('review-done').hidden = false;
    } catch (err) {
      console.error(err);
      msg.textContent = '등록 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '후기 등록하기';
    }
  });
}

document.addEventListener('click', e => {
  if (e.target.closest('#write-review')) { openReviewModal(); return; }
  if (e.target.id === 'review-close' || e.target.id === 'review-done-close' || e.target.id === 'review-modal') {
    closeReviewModal();
    return;
  }
  const sortBtn = e.target.closest('[data-sort]');
  if (sortBtn) {
    reviewState.sortMode = sortBtn.getAttribute('data-sort');
    renderReviewsView();
    return;
  }
  const filterBtn = e.target.closest('[data-filter]');
  if (filterBtn) {
    const type = filterBtn.getAttribute('data-filter');
    const value = filterBtn.getAttribute('data-value');
    reviewState.filters[type] = reviewState.filters[type] === value ? null : value;
    renderReviewsView();
    return;
  }
  const clearBtn = e.target.closest('[data-clear-filter]');
  if (clearBtn) {
    const t = clearBtn.getAttribute('data-clear-filter');
    if (t === 'all') reviewState.filters = { gender: null, age: null, goal: null };
    else reviewState.filters[t] = null;
    renderReviewsView();
    return;
  }
  const img = e.target.closest('img[data-zoom="1"]');
  if (img) openLightbox(img);
});

// ===== 시작: 본문은 firebase와 무관하게 항상 렌더 =====
async function main() {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  try { setupReviewForm(); } catch (e) { console.error(e); }

  try {
    const profile = await loadJSON('data/profile.json');
    renderHero(profile);
    renderAbout(profile);
    renderContact(profile);
  } catch (e) { console.error(e); }

  try { renderProcess(await loadJSON('data/process.json')); } catch (e) { console.error(e); }

  try {
    const local = await loadJSON('data/reviews.json').catch(() => ({ reviews: [] }));
    let remote = [];
    try { remote = await loadApprovedReviews(); } catch (e) { console.error(e); }
    renderReviewsAll({ reviews: [...remote, ...(local.reviews || [])] });
  } catch (e) { console.error(e); }

  try { renderBeforeAfter(await loadJSON('data/before-after.json')); } catch (e) { console.error(e); }
}
main();
