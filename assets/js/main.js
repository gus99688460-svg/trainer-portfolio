async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(path + ' load failed');
  return res.json();
}

function escapeHTML(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

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

function renderReviews(data) {
  const items = (data.reviews || []).filter(r => !r.hidden).map(r => `
    <div class="card review-card">
      <div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
      <div class="meta">${escapeHTML(r.memberName)} · ${escapeHTML(r.memberAge)} · ${escapeHTML(r.memberGoal)}</div>
      <p class="text">${escapeHTML(r.text)}</p>
    </div>
  `).join('');
  document.getElementById('reviews').innerHTML = `<h2>회원 후기</h2>${items}`;
}

function renderBeforeAfter(data) {
  const items = (data.items || []).map(b => `
    <div class="card ba-card">
      <h3>${escapeHTML(b.memberLabel)} · ${escapeHTML(b.period)}</h3>
      <div class="images">
        <figure><img src="${escapeHTML(b.beforeImage)}" alt="before" /><figcaption>Before · ${escapeHTML(b.weightBefore)}kg</figcaption></figure>
        <figure><img src="${escapeHTML(b.afterImage)}" alt="after" /><figcaption>After · ${escapeHTML(b.weightAfter)}kg</figcaption></figure>
      </div>
      <p class="summary">${escapeHTML(b.note || '')}</p>
    </div>
  `).join('');
  document.getElementById('before-after').innerHTML = `<h2>비포 / 애프터</h2>${items}`;
}

function renderGallery(data) {
  const items = (data.items || []).map(g => g.type === 'video'
    ? `<figure><video src="${escapeHTML(g.src)}" controls></video></figure>`
    : `<figure><img src="${escapeHTML(g.src)}" alt="${escapeHTML(g.caption || '')}" /></figure>`
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

async function main() {
  document.getElementById('year').textContent = new Date().getFullYear();
  try {
    const profile = await loadJSON('data/profile.json');
    renderHero(profile);
    renderAbout(profile);
    renderContact(profile);
  } catch (e) { console.error(e); }
  try { renderReviews(await loadJSON('data/reviews.json')); } catch (e) { console.error(e); }
  try { renderBeforeAfter(await loadJSON('data/before-after.json')); } catch (e) { console.error(e); }
  try { renderGallery(await loadJSON('data/gallery.json')); } catch (e) { console.error(e); }
}
main();
