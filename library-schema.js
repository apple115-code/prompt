(function (root) {
  'use strict';
  function validateLibrary(data) {
    const error = message => { throw new Error(message); };
    const exact = (obj, keys) => obj && typeof obj === 'object' && !Array.isArray(obj) && Object.keys(obj).every(k => keys.includes(k)) && keys.every(k => Object.hasOwn(obj, k));
    const string = (value, max, required = false) => typeof value === 'string' && value.length <= max && (!required || value.trim().length > 0);
    const id = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
    if (!exact(data, ['version', 'courses']) || data.version !== 2 || !Array.isArray(data.courses) || data.courses.length > 100) error('수업 자료 형식을 확인해 주세요. 수업은 최대 100개입니다.');
    const courseIds = new Set(); let total = 0;
    for (const course of data.courses) {
      if (!exact(course, ['id', 'title', 'description', 'categories', 'prompts']) || !id(course.id) || courseIds.has(course.id) || !string(course.title, 150, true) || !string(course.description, 500) || !Array.isArray(course.categories) || course.categories.length < 1 || course.categories.length > 30 || !Array.isArray(course.prompts)) error('수업 제목과 카테고리를 확인해 주세요.');
      courseIds.add(course.id); const categories = new Set();
      for (const cat of course.categories) {
        if (!exact(cat, ['id', 'name']) || !id(cat.id) || categories.has(cat.id) || !string(cat.name, 80, true)) error('카테고리 이름이 비어 있거나 중복된 항목이 있습니다.');
        categories.add(cat.id);
      }
      const promptIds = new Set();
      for (const item of course.prompts) {
        if (!exact(item, ['id', 'title', 'description', 'category', 'status', 'text']) || !id(item.id) || promptIds.has(item.id) || !string(item.title, 150, true) || !string(item.description, 300) || !categories.has(item.category) || !['original', 'example', 'placeholder'].includes(item.status) || !string(item.text, 100000, true)) error('프롬프트 제목·본문·카테고리를 확인해 주세요.');
        promptIds.add(item.id); total++;
      }
    }
    if (total > 1000 || new TextEncoder().encode(JSON.stringify(data)).length > 1500000) error('자료 용량이 너무 큽니다. 프롬프트는 전체 1,000개까지 지원합니다.');
    return data;
  }
  const canonical = data => JSON.stringify(data, ['version','courses','id','title','description','categories','name','prompts','category','status','text']);
  root.PromptSchema = { validateLibrary, canonical };
})(globalThis);
