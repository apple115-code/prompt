'use strict';
const search = document.querySelector('#search');
const cards = document.querySelector('#cards');
const filters = [...document.querySelectorAll('[data-category]')];
const labels = { original: '원문', example: '편집용 예시', placeholder: '작성 예정' };
let category = 'all';
let toastTimer;
function showMessage(message) {
  const toast = document.querySelector('#toast');
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3500);
}
async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try { await navigator.clipboard.writeText(text); return true; } catch (_) { /* 로컬 복사 방식으로 재시도 */ }
  }
  const previous = document.activeElement;
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px';
  document.body.append(field);
  field.focus(); field.select(); field.setSelectionRange(0, text.length);
  let success = false;
  try { success = document.execCommand('copy'); } catch (_) { success = false; }
  field.remove(); previous?.focus();
  return success;
}
function render() {
  const query = search.value.trim().normalize('NFC').toLocaleLowerCase('ko');
  const items = window.PROMPTS.filter(item => (category === 'all' || category === item.category) &&
    `${item.title} ${item.description} ${item.text} ${labels[item.status]} ${item.category === 'model' ? '3D 모델링' : '배경 이미지'}`.normalize('NFC').toLocaleLowerCase('ko').includes(query));
  cards.replaceChildren();
  document.querySelector('#count').textContent = `${items.length}개의 프롬프트`;
  document.querySelector('#empty').hidden = items.length > 0;
  document.querySelector('#clear').hidden = !search.value;
  items.forEach((item, index) => {
    const article = document.createElement('article'); article.className = 'card';
    const details = document.createElement('details'); details.open = item.id === 'bamboo';
    const summary = document.createElement('summary');
    const meta = document.createElement('span'); meta.className = 'meta';
    const type = document.createElement('span'); type.textContent = item.category === 'model' ? '3D 모델링' : '배경 이미지';
    const badge = document.createElement('span'); badge.className = `badge ${item.status}`; badge.textContent = labels[item.status];
    meta.append(type, badge);
    const title = document.createElement('h3'); title.textContent = item.title;
    const description = document.createElement('span'); description.className = 'description'; description.textContent = item.description;
    const arrow = document.createElement('span'); arrow.className = 'arrow'; arrow.textContent = '+'; arrow.setAttribute('aria-hidden', 'true');
    summary.append(meta, title, description, arrow);
    const content = document.createElement('div'); content.className = 'content';
    const text = document.createElement('p'); text.className = 'prompt'; text.textContent = item.text; text.id = `text-${item.id}`;
    content.append(text); details.append(summary, content);
    const actions = document.createElement('div'); actions.className = 'actions';
    const hint = document.createElement('span'); hint.textContent = item.status === 'original' ? '수업 자료 원문 그대로' : '예시 내용을 확인하고 수정해 주세요';
    const button = document.createElement('button'); button.type = 'button'; button.className = 'copy'; button.textContent = '전체 복사'; button.setAttribute('aria-label', `${item.title} 전체 복사`);
    button.addEventListener('click', async () => {
      button.disabled = true;
      const success = await copyText(item.text);
      button.disabled = false;
      if (success) {
        button.textContent = '✓ 복사 완료'; showMessage(`${item.title} · 전체 내용이 복사되었어요.`);
        setTimeout(() => { button.textContent = '전체 복사'; }, 2500);
      } else {
        details.open = true;
        const selection = window.getSelection(); const range = document.createRange(); range.selectNodeContents(text); selection.removeAllRanges(); selection.addRange(range);
        showMessage('자동 복사가 제한되어 내용을 선택했어요. Ctrl+C 또는 길게 눌러 복사해 주세요.');
      }
    });
    actions.append(hint, button); article.append(details, actions); cards.append(article);
  });
}
filters.forEach(button => button.addEventListener('click', () => {
  category = button.dataset.category;
  filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
  render();
}));
search.addEventListener('input', render);
document.querySelector('#clear').addEventListener('click', () => { search.value = ''; render(); search.focus(); });
document.querySelector('#reset').addEventListener('click', () => { search.value = ''; filters[0].click(); search.focus(); });
render();
