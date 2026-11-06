'use strict';
let sourcePrompts = JSON.stringify(window.LIBRARY);
const libraryStorageKey = 'prompt-library-courses-v2';
const clone = value => JSON.parse(JSON.stringify(value));
const makeId = prefix => prefix + '-' + crypto.randomUUID();
const fields = Object.fromEntries(['title','description','prompt-title','prompt-description','category','status','text'].map(k => [k,document.querySelector('#manage-'+k)]));
const picker = document.querySelector('#manage-course'), promptPicker = document.querySelector('#manage-prompt');
const categoryRows = document.querySelector('#category-rows');
// Older cached teacher HTML can still load the current editor script.
if(!document.querySelector('#set-student-course')){
  const select=el('button','이 수업을 수강생에게 표시','copy');select.id='set-student-course';select.type='button';document.querySelector('#copy-course-link').before(select);
  const status=el('p','','editor-note');status.id='student-course-status';status.setAttribute('role','status');document.querySelector('#storage-status').before(status);
}
let editingId = null, draftSnapshot = '';
const draftValue = () => JSON.stringify({ fields:Object.fromEntries(Object.entries(fields).map(([k,e])=>[k,e.value])), categories:[...categoryRows.children].map(row=>({id:row.dataset.id,name:row.querySelector('input').value})) });
const isValidList = library => { try { PromptSchema.validateLibrary(library); return true; } catch (_) { return false; } };
const errorText = text => document.querySelector('#editor-error').textContent = text;
function persist() {
  try { localStorage.setItem(libraryStorageKey,JSON.stringify({base:sourcePrompts,library:window.LIBRARY}));document.querySelector('#storage-status').textContent='브라우저에 초안을 저장했습니다. 전체 수업에 반영하려면 ‘수강생에게 게시’를 눌러 주세요.'; }
  catch (_) { document.querySelector('#storage-status').textContent='브라우저 저장에 실패했습니다. 닫기 전에 전체 수업 백업을 다운로드하세요.'; }
}
try {
  const saved=JSON.parse(localStorage.getItem(libraryStorageKey)||'null');
  if(saved?.base===sourcePrompts && isValidList(saved.library)) window.LIBRARY=saved.library;
  else if(saved) {
    document.querySelector('#storage-status').textContent='공유 자료가 갱신되어 최신 게시본을 표시합니다. 기존 브라우저 초안은 별도로 보관되어 있습니다.';
    if(isValidList(saved.library))localStorage.setItem('prompt-library-courses-previous',JSON.stringify(saved.library));
  }
}catch(_){document.querySelector('#storage-status').textContent='브라우저 저장소를 읽지 못했습니다. 백업 다운로드를 이용해 주세요.';}
function mayDiscard(){return draftValue()===draftSnapshot||window.confirm('아직 저장하지 않은 입력을 버릴까요? 먼저 변경 내용 저장을 누르면 보관할 수 있습니다.');}
function updateCategoryOptions(preferred){
  fields.category.replaceChildren();
  [...categoryRows.children].forEach(row=>{const opt=el('option',row.querySelector('input').value||'이름 없는 카테고리');opt.value=row.dataset.id;fields.category.append(opt);});
  if([...fields.category.options].some(o=>o.value===preferred))fields.category.value=preferred;
}
function categoryRow(cat){
  const row=el('div',undefined,'category-row');row.dataset.id=cat.id;
  const input=el('input');input.value=cat.name;input.maxLength=80;input.required=true;input.setAttribute('aria-label','카테고리 이름');
  input.addEventListener('input',()=>updateCategoryOptions(fields.category.value));
  const remove=el('button','삭제','danger');remove.type='button';remove.setAttribute('aria-label',cat.name+' 카테고리 삭제');
  remove.addEventListener('click',()=>{
    if(categoryRows.children.length===1){errorText('수업에는 카테고리가 최소 1개 필요합니다.');return;}
    if(currentCourse().prompts.some(p=>p.category===cat.id)){errorText('사용 중인 카테고리입니다. 프롬프트를 다른 카테고리로 옮겨 저장한 뒤 삭제해 주세요.');return;}
    row.remove();updateCategoryOptions(fields.category.value);
  });row.append(input,remove);return row;
}
function fillPrompt(id){
  const course=currentCourse(),item=course?.prompts.find(p=>p.id===id);editingId=item?.id||null;
  fields['prompt-title'].value=item?.title||'';fields['prompt-description'].value=item?.description||'';fields.text.value=item?.text||'';fields.status.value=item?.status||'example';
  updateCategoryOptions(item?.category||course?.categories[0]?.id);
  promptPicker.replaceChildren();const empty=el('option','+ 새 프롬프트');empty.value='';promptPicker.append(empty);
  course?.prompts.forEach(p=>{const o=el('option',p.title);o.value=p.id;promptPicker.append(o);});promptPicker.value=editingId||'';
  document.querySelector('#delete-prompt').disabled=!item;draftSnapshot=draftValue();errorText('');
}
function fillCourse(id){
  const course=window.LIBRARY.courses.find(c=>c.id===id)||window.LIBRARY.courses[0];activeCourseId=course?.id||null;activeCategory='all';
  picker.replaceChildren();window.LIBRARY.courses.forEach(c=>{const opt=el('option',c.title);opt.value=c.id;picker.append(opt);});
  if(!course){const opt=el('option','수업을 추가해 주세요');opt.value='';picker.append(opt);}else picker.value=course.id;
  document.querySelector('#course-fields').disabled=!course;
  ['duplicate-course','delete-course','copy-course-link'].forEach(id=>document.querySelector('#'+id).disabled=!course);
  document.querySelector('#set-student-course').disabled=!course || window.LIBRARY.courses[0]?.id===course.id;
  document.querySelector('#student-course-status').textContent='수강생에게 표시할 수업: '+(window.LIBRARY.courses[0]?.title||'없음')+' · 변경 후 수강생에게 게시를 눌러 주세요.';
  fields.title.value=course?.title||'';fields.description.value=course?.description||'';categoryRows.replaceChildren();course?.categories.forEach(cat=>categoryRows.append(categoryRow(cat)));
  fillPrompt(course?.prompts[0]?.id);render();
}
picker.addEventListener('change',()=>{const next=picker.value;if(mayDiscard())fillCourse(next);else picker.value=activeCourseId||'';});
promptPicker.addEventListener('change',()=>{const next=promptPicker.value;if(mayDiscard())fillCourse(activeCourseId),fillPrompt(next);else promptPicker.value=editingId||'';});
document.querySelector('#new-prompt').addEventListener('click',()=>{if(mayDiscard()){fillCourse(activeCourseId);fillPrompt(null);fields['prompt-title'].focus();}});
document.querySelector('#add-category').addEventListener('click',()=>{if(categoryRows.children.length>=30){errorText('카테고리는 최대 30개입니다.');return;}categoryRows.append(categoryRow({id:makeId('category'),name:''}));updateCategoryOptions(fields.category.value);});
document.querySelector('#course-editor-form').addEventListener('submit',event=>{
  event.preventDefault();const course=currentCourse();if(!course)return;
  const next=clone(window.LIBRARY),target=next.courses.find(c=>c.id===course.id);target.title=fields.title.value.trim();target.description=fields.description.value;
  target.categories=[...categoryRows.children].map(row=>({id:row.dataset.id,name:row.querySelector('input').value.trim()}));
  const title=fields['prompt-title'].value.trim(),text=fields.text.value;
  let savedId=editingId;
  if(editingId||title||text.trim()){
    if(!title||!text.trim()){errorText('프롬프트 제목과 본문을 모두 입력해 주세요.');return;}
    const item={id:editingId||makeId('prompt'),title,description:fields['prompt-description'].value,category:fields.category.value,status:fields.status.value,text};
    const index=target.prompts.findIndex(p=>p.id===editingId);if(index<0)target.prompts.push(item);else target.prompts[index]=item;savedId=item.id;
  }
  try{PromptSchema.validateLibrary(next);}catch(error){errorText(error.message);return;}
  window.LIBRARY=next;persist();fillCourse(course.id);fillPrompt(savedId);render();showMessage('수업과 프롬프트 초안을 저장했어요.');
});
document.querySelector('#new-course').addEventListener('click',()=>{if(!mayDiscard())return;const title=window.prompt('새 수업 이름을 입력하세요.');if(!title?.trim())return;if(title.trim().length>150){errorText('수업 이름은 150자 이내로 입력해 주세요.');return;}if(window.LIBRARY.courses.length>=100){errorText('수업은 최대 100개입니다.');return;}
  const course={id:makeId('course'),title:title.trim(),description:'',categories:[{id:'general',name:'일반'}],prompts:[]};window.LIBRARY.courses.push(course);persist();fillCourse(course.id);showMessage('새 수업을 추가했어요.');});
document.querySelector('#duplicate-course').addEventListener('click',()=>{if(!mayDiscard())return;const course=currentCourse();if(!course)return;const copy=clone(course);copy.id=makeId('course');copy.title=course.title.slice(0,144)+' (복사)';const next=clone(window.LIBRARY);next.courses.push(copy);try{PromptSchema.validateLibrary(next);}catch(error){errorText(error.message);return;}window.LIBRARY=next;persist();fillCourse(copy.id);showMessage('수업과 프롬프트를 복제했어요.');});
document.querySelector('#delete-course').addEventListener('click',()=>{const course=currentCourse();if(!course||!window.confirm(`‘${course.title}’ 수업과 프롬프트 ${course.prompts.length}개를 모두 삭제할까요? 아직 게시하지 않은 입력도 사라집니다.`))return;window.LIBRARY.courses=window.LIBRARY.courses.filter(c=>c.id!==course.id);persist();fillCourse();showMessage('수업을 삭제했어요. 게시 전까지 수강생 화면은 유지됩니다.');});
document.querySelector('#delete-prompt').addEventListener('click',()=>{const course=currentCourse();if(!course||!editingId||!window.confirm('선택한 프롬프트를 삭제할까요? 저장하지 않은 입력도 사라집니다.'))return;course.prompts=course.prompts.filter(p=>p.id!==editingId);persist();fillCourse(course.id);showMessage('프롬프트를 삭제했어요.');});
document.querySelector('#set-student-course').addEventListener('click',()=>{
  if(draftValue()!==draftSnapshot){errorText('입력 중인 내용을 먼저 변경 내용 저장으로 저장해 주세요.');return;}
  const course=currentCourse();if(!course)return;const promptId=editingId;
  window.LIBRARY.courses=[course,...window.LIBRARY.courses.filter(c=>c.id!==course.id)];persist();fillCourse(course.id);fillPrompt(promptId);
  showMessage('표시할 수업을 지정했어요. 수강생에게 게시를 누르면 적용됩니다.');
});
document.querySelector('#copy-course-link').addEventListener('click',async()=>{const url=courseUrl();if(await copyText(url))showMessage('수강생 주소를 복사했어요. 지정해 게시한 수업만 표시됩니다.');else window.prompt('이 주소를 복사해 수강생에게 공유하세요.',url);});
document.querySelector('#export-library').addEventListener('click',()=>{if(draftValue()!==draftSnapshot){errorText('입력 중인 내용을 먼저 저장해 주세요.');return;}const url=URL.createObjectURL(new Blob([JSON.stringify(window.LIBRARY,null,2)],{type:'application/json;charset=utf-8'})),a=el('a');a.href=url;a.download='prompt-library-backup.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);});
document.querySelector('#import-library').addEventListener('change',async event=>{const file=event.target.files[0];event.target.value='';if(!file)return;try{if(file.size>1500000)throw Error('백업 파일이 너무 큽니다.');const data=PromptSchema.validateLibrary(JSON.parse(await file.text()));if(!window.confirm('현재 브라우저의 전체 수업과 초안을 이 백업으로 교체할까요? 수강생에게 반영하려면 게시를 눌러야 합니다.'))return;window.LIBRARY=data;persist();fillCourse();showMessage('백업을 불러왔어요.');}catch(error){errorText('백업 불러오기 실패: '+error.message);}});
fillCourse(activeCourseId);
try {
  const legacy=JSON.parse(localStorage.getItem('prompt-library-edits-v1')||'null');
  if(Array.isArray(legacy?.items)){
    const recover=el('button','이전 가상현실 초안 복구','secondary');recover.type='button';
    recover.addEventListener('click',()=>{try{const next=clone(window.LIBRARY),course=next.courses.find(c=>c.id==='vr');if(!course)throw Error('기존 가상현실 수업이 없습니다.');course.prompts=clone(legacy.items);PromptSchema.validateLibrary(next);if(!window.confirm('이전에 브라우저에 저장했던 가상현실 초안으로 해당 수업만 교체할까요? 현재 입력 중인 내용도 사라집니다.'))return;window.LIBRARY=next;persist();fillCourse('vr');showMessage('이전 초안을 복구했어요.');}catch(error){errorText(error.message);}});
    document.querySelector('.editor-export').append(recover);
  }
}catch(_){}
window.addEventListener('beforeunload',event=>{if(draftValue()!==draftSnapshot){event.preventDefault();event.returnValue='';}});
