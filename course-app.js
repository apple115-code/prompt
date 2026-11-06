'use strict';
const labels = { original: '원문', example: '편집용 예시', placeholder: '작성 예정' };
const teacherView = document.body.dataset.teacher === 'true';
let activeCourseId = new URL(location.href).searchParams.get('course') || (teacherView ? window.LIBRARY.courses[0]?.id : null);
let activeCategory = 'all', toastTimer;
const el = (tag, text, className) => { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (className) n.className = className; return n; };
const currentCourse = () => window.LIBRARY.courses.find(c => c.id === activeCourseId);
function showMessage(text) { const n = document.querySelector('#toast'); n.textContent = text; n.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => n.classList.remove('visible'), 3500); }
async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) { try { await navigator.clipboard.writeText(text); return true; } catch (_) {} }
  const previous = document.activeElement, area = el('textarea'); area.value = text; area.style.cssText = 'position:fixed;opacity:0;top:0;left:0;font-size:16px'; document.body.append(area); area.focus(); area.select(); area.setSelectionRange(0, text.length);
  let copied = false; try { copied = document.execCommand('copy'); } catch (_) {} area.remove(); previous?.focus(); return copied;
}
function courseUrl() { return new URL('./', location.href).href; }
function render() {
  // The first saved course is the teacher's designated student course.
  // Query parameters never switch the student screen to another course.
  if (!teacherView) {
    const designated = window.LIBRARY.courses[0]?.id || null;
    if (activeCourseId !== designated) { activeCourseId = designated; activeCategory = 'all'; document.querySelector('#search').value = ''; document.querySelector('#cards').dataset.course = ''; }
  }
  const course = currentCourse();
  document.querySelector('#course-home').hidden = true;
  document.querySelector('#course-content').hidden = !course;
  document.querySelector('#missing-course').hidden = Boolean(course) || teacherView;
  document.querySelector('#course-name').textContent = course?.title || (teacherView ? '선생님용 편집' : '수업별 프롬프트 자료실');
  if (!course && !teacherView) { document.querySelector('#hero-title').textContent = '수업을 준비하고 있어요.'; document.querySelector('#hero-description').textContent = '선생님이 수업을 게시하면 이곳에 표시됩니다.'; }
  else { document.querySelector('#hero-title').textContent = course?.title || '수업마다, 새로운 아이디어.'; document.querySelector('#hero-description').textContent = course?.description || '참여하는 수업을 선택하고 필요한 프롬프트를 복사하세요.'; }
  const list = document.querySelector('#course-list'); list.replaceChildren();
  document.querySelector('#no-courses').hidden = window.LIBRARY.courses.length > 0;
  if (!course) return;
  document.title = `${course.title} · 프롬프트 서가`;
  const filters = document.querySelector('#course-filters'); filters.replaceChildren();
  if (!course.categories.some(c => c.id === activeCategory)) activeCategory = 'all';
  [{ id: 'all', name: '전체' }, ...course.categories].forEach(cat => { const button = el('button', cat.name); button.type = 'button'; button.setAttribute('aria-pressed', String(activeCategory === cat.id)); button.addEventListener('click', () => { activeCategory = cat.id; render(); }); filters.append(button); });
  const q = document.querySelector('#search').value.trim().normalize('NFC').toLocaleLowerCase('ko');
  const items = course.prompts.filter(p => (activeCategory === 'all' || p.category === activeCategory) && `${p.title} ${p.description} ${p.text} ${course.categories.find(c => c.id === p.category)?.name} ${labels[p.status]}`.normalize('NFC').toLocaleLowerCase('ko').includes(q));
  const cards = document.querySelector('#cards'), opened = new Set([...cards.querySelectorAll('details[open]')].map(d => d.dataset.promptId));
  const firstRender = cards.dataset.course !== course.id; cards.dataset.course = course.id; cards.replaceChildren();
  document.querySelector('#count').textContent = `${items.length}개의 프롬프트`;
  document.querySelector('#empty').hidden = items.length > 0; document.querySelector('#clear').hidden = !q;
  items.forEach(item => {
    const card = el('article', undefined, 'card'), details = el('details'); details.dataset.promptId = item.id; details.open = firstRender ? item.id === course.prompts[0]?.id : opened.has(item.id);
    const summary = el('summary'), meta = el('span', undefined, 'meta'); meta.append(el('span', course.categories.find(c => c.id === item.category)?.name), el('span', labels[item.status], `badge ${item.status}`));
    const arrow = el('span', '+', 'arrow'); arrow.setAttribute('aria-hidden', 'true'); summary.append(meta, el('h3', item.title), el('span', item.description, 'description'), arrow);
    const content = el('div', undefined, 'content'), text = el('p', item.text, 'prompt'); content.append(text); details.append(summary, content);
    const actions = el('div', undefined, 'actions'), button = el('button', '전체 복사', 'copy'); button.type = 'button'; button.setAttribute('aria-label', `${item.title} 전체 복사`);
    button.addEventListener('click', async () => { button.disabled = true; const success = await copyText(item.text); button.disabled = false; if (success) { button.textContent = '✓ 복사 완료'; showMessage('전체 프롬프트를 복사했어요.'); setTimeout(() => button.textContent = '전체 복사', 2500); } else { details.open = true; const range = document.createRange(); range.selectNodeContents(text); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); showMessage('내용을 선택했어요. Ctrl+C 또는 길게 눌러 복사해 주세요.'); } });
    actions.append(el('span', item.status === 'original' ? '원문 프롬프트' : '예시 내용을 확인하고 수정해 주세요'), button); card.append(details, actions); cards.append(card);
  });
}
document.querySelector('#search').addEventListener('input', render);
document.querySelector('#clear').addEventListener('click', () => { document.querySelector('#search').value = ''; render(); });
document.querySelector('#reset').addEventListener('click', () => { document.querySelector('#search').value = ''; activeCategory = 'all'; render(); });
render();
document.querySelector('.back-link')?.remove();
