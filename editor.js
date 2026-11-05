'use strict';
const storageKey = 'prompt-library-edits-v1';
const sourcePrompts = JSON.stringify(window.PROMPTS);
const editor = document.querySelector('#editor');
const picker = document.querySelector('#edit-picker');
const fields = Object.fromEntries(['title', 'description', 'category', 'status', 'text'].map(key => [key, document.querySelector(`#edit-${key}`)]));
let editingId = null;
let draftSnapshot = '';
const draftValue = () => JSON.stringify(Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.value])));
const isValidList = items => Array.isArray(items) && items.every(item => item && typeof item.id === 'string' && ['title', 'description', 'text'].every(key => typeof item[key] === 'string') && ['background', 'model'].includes(item.category) && Object.hasOwn(labels, item.status)) && new Set(items.map(item => item.id)).size === items.length;
function storageStatus(message) { document.querySelector('#storage-status').textContent = message; }
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
  if (saved && saved.base === sourcePrompts && isValidList(saved.items)) {
    window.PROMPTS = saved.items;
    storageStatus('이 브라우저에 저장된 수정본을 표시하고 있습니다.');
  } else if (saved) {
    storageStatus('공유 파일이 갱신되었거나 저장 형식이 달라 현재 파일을 표시합니다. 기존 브라우저 저장본은 아직 덮어쓰지 않았습니다.');
  }
} catch (_) { storageStatus('브라우저 저장소를 읽을 수 없습니다. 편집 후 반드시 공유용 파일을 다운로드하세요.'); }
function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ base: sourcePrompts, items: window.PROMPTS }));
    storageStatus('이 브라우저에 저장되었습니다. 다른 기기나 수강생에게는 파일 교체 후 반영됩니다.');
  } catch (_) {
    storageStatus('브라우저 저장에 실패했습니다. 현재 화면에만 반영됩니다. 닫기 전에 공유용 파일을 다운로드하세요.');
  }
}
function fillPicker() {
  picker.replaceChildren();
  const newOption = document.createElement('option'); newOption.value = ''; newOption.textContent = '+ 새 프롬프트'; picker.append(newOption);
  window.PROMPTS.forEach(item => { const option = document.createElement('option'); option.value = item.id; option.textContent = item.title; picker.append(option); });
  picker.value = editingId || '';
}
function loadDraft(id) {
  const item = window.PROMPTS.find(item => item.id === id);
  editingId = item?.id || null;
  const values = item || { title: '', description: '', category: 'background', status: 'example', text: '' };
  Object.entries(fields).forEach(([key, field]) => { field.value = values[key]; });
  fillPicker(); draftSnapshot = draftValue();
  document.querySelector('#delete-prompt').disabled = !item;
  document.querySelector('#editor-error').textContent = '';
}
function mayDiscard() { return draftValue() === draftSnapshot || window.confirm('저장하지 않은 변경 내용을 버릴까요?'); }
document.querySelector('#open-editor').addEventListener('click', () => { loadDraft(window.PROMPTS[0]?.id); editor.showModal(); });
document.querySelector('#close-editor').addEventListener('click', () => { if (mayDiscard()) editor.close(); });
editor.addEventListener('cancel', event => { if (!mayDiscard()) event.preventDefault(); });
picker.addEventListener('change', () => { const next = picker.value; if (mayDiscard()) loadDraft(next); else picker.value = editingId || ''; });
document.querySelector('#new-prompt').addEventListener('click', () => { if (mayDiscard()) { loadDraft(null); fields.title.focus(); } });
document.querySelector('#edit-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!fields.title.value.trim() || !fields.text.value.trim()) { document.querySelector('#editor-error').textContent = '제목과 본문을 입력해 주세요.'; return; }
  const item = Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.value]));
  item.title = item.title.trim();
  item.id = editingId || `prompt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const index = window.PROMPTS.findIndex(value => value.id === editingId);
  if (index < 0) window.PROMPTS.push(item); else window.PROMPTS[index] = item;
  persist(); loadDraft(item.id); render(); showMessage('변경 내용을 반영했어요. 저장 상태를 확인해 주세요.');
});
document.querySelector('#delete-prompt').addEventListener('click', () => {
  if (!editingId || !window.confirm('이 프롬프트를 삭제할까요? 공유된 원본 파일은 바뀌지 않습니다.')) return;
  window.PROMPTS = window.PROMPTS.filter(item => item.id !== editingId);
  persist(); loadDraft(window.PROMPTS[0]?.id); render(); showMessage('프롬프트를 삭제했어요.');
});
document.querySelector('#export-prompts').addEventListener('click', () => {
  if (draftValue() !== draftSnapshot) { document.querySelector('#editor-error').textContent = '먼저 변경 내용을 저장해 주세요. 다운로드에는 저장된 내용만 포함됩니다.'; return; }
  const content = '// 페이지 편집 화면에서 내보낸 공유용 콘텐츠\nwindow.PROMPTS = ' + JSON.stringify(window.PROMPTS, null, 2) + ';\n';
  const url = URL.createObjectURL(new Blob([content], { type: 'text/javascript;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'prompts.js'; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  showMessage('다운로드한 prompts.js로 기존 파일을 교체해 주세요.');
});
document.querySelector('#restore-prompts').addEventListener('click', () => {
  if (!window.confirm('이 브라우저의 수정과 저장하지 않은 내용을 버리고 현재 prompts.js 파일의 내용으로 되돌릴까요?')) return;
  try { localStorage.removeItem(storageKey); } catch (_) { storageStatus('저장소 초기화에 실패했습니다. 브라우저의 사이트 데이터를 확인해 주세요.'); return; }
  window.PROMPTS = JSON.parse(sourcePrompts); loadDraft(window.PROMPTS[0]?.id); render(); storageStatus('현재 공유 파일의 내용으로 초기화했습니다.');
});
render();
