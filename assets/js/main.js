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

const reviewState = { all: [], filters: { gender: null, age: null, goal: null } };

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
  document.getElementById('about').innerHTML = `
    <h2>소개</h2>
    <p>${escapeHTML(p.bio)}</p>
    <div class="certs"><h3>자격증</h3><ul>${certs}</ul></div>
    <div class="certs"><h3>경력</h3><ul>${career}</ul></div>
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
  return `<div class="card review-card">${stars}${name}${chipsHtml}${sub}${text}${image}</div>`;
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

function renderReviewsView() {
  const f = reviewState.filters;
  const filtered = reviewState.all.filter(r => {
    if (f.gender && r.gender !== f.gender) return false;
    if (f.age && r.memberAge !== f.age) return false;
    if (f.goal && !parseGoals(r.memberGoal).includes(f.goal)) return false;
    return true;
  });
  const filterBar = renderFilterBar();
  const banner = renderFilterBanner();
  const empty = filtered.length === 0 ? `<div class="empty">조건에 맞는 후기가 없습니다.</div>` : '';
  const cards = filtered.map(renderReviewCard).join('');
  document.getElementById('reviews').innerHTML = `<h2>회원 후기</h2>${filterBar}${banner}${empty}${cards}`;
}

function renderReviewsAll(data) {
  reviewState.all = (data.reviews || []).filter(r => !r.hidden);
  renderReviewsView();
}

function renderBeforeAfter(data) {
  const items = (data.items || []).map(b => `
    <div class="card ba-card">
      <h3>${escapeHTML(b.memberLabel)} · ${escapeHTML(b.period)}</h3>
      <div class="images">
        <figure><img src="${escapeHTML(b.beforeImage)}" alt="before" data-zoom="1" /><figcaption>Before · ${escapeHTML(b.weightBefore)}kg</figcaption></figure>
        <figure><img src="${escapeHTML(b.afterImage)}" alt="after" data-zoom="1" /><figcaption>After · ${escapeHTML(b.weightAfter)}kg</figcaption></figure>
      </div>
      <p class="summary">${escapeHTML(b.note || '')}</p>
    </div>
  `).join('');
  document.getElementById('before-after').innerHTML = `<h2>비포 / 애프터</h2>${items}`;
}

function renderGallery(data) {
  const items = (data.items || []).map(g => g.type === 'video'
    ? `<figure><video src="${escapeHTML(g.src)}" controls></video></figure>`
    : `<figure><img src="${escapeHTML(g.src)}" alt="${escapeHTML(g.caption || '')}" data-zoom="1" /></figure>`
  ).join('');
  document.getElementById('gallery').innerHTML = `<h2>갤러리</h2><div class="gallery-grid">${items}</div>`;
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

document.addEventListener('click', e => {
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
  if (img) {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `<img src="${img.src}" alt="" />`;
    lb.addEventListener('click', () => lb.remove());
    document.body.appendChild(lb);
  }
});

async function main() {
  document.getElementById('year').textContent = new Date().getFullYear();
  try {
    const profile = await loadJSON('data/profile.json');
    renderHero(profile);
    renderAbout(profile);
    renderContact(profile);
  } catch (e) { console.error(e); }
  try { renderReviewsAll(await loadJSON('data/reviews.json')); } catch (e) { console.error(e); }
  try { renderBeforeAfter(await loadJSON('data/before-after.json')); } catch (e) { console.error(e); }
  try { renderGallery(await loadJSON('data/gallery.json')); } catch (e) { console.error(e); }
}
main();
