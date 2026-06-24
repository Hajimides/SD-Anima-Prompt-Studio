import type { CategoryKey, PromptGroup } from '@app-types/index';
import {
  getData,
  createDraft,
  commitDraft,
  discardDraft,
  isDraftModified,
  resetEditableData,
  importEditableData,
  getCategories,
  getGroups,
  addGroup,
  updateGroup,
  deleteGroup,
  addCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  reorderGroups,
} from '@core/dataManager';

import { downloadJSON } from '@utils/fileExport';
import { readJSONFile } from '@utils/fileImport';
import { processImageUpload } from '@utils/imageUpload';
import { createElement, escapeHtml } from '@utils/dom';

const AVAILABLE_COLORS = [
  'indigo', 'purple', 'pink', 'emerald', 'teal', 'amber', 'cyan', 'sky', 'rose', 'orange', 'violet',
];

export interface EditorCallbacks {
  onChange?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
}

export interface EditorModalElements {
  modal: HTMLDivElement;
  container: HTMLDivElement;
  callbacks?: EditorCallbacks;
}

let currentCategory: CategoryKey | null = null;

function notifyChange(elements: EditorModalElements): void {
  elements.callbacks?.onChange?.();
}

export function createEditorModal(): EditorModalElements {
  const modal = createElement(
    'div',
    'fixed inset-0 z-[110] flex items-center justify-center opacity-0 invisible transition-all duration-300',
    { id: 'editorModal', 'aria-modal': 'true', role: 'dialog' }
  );

  modal.innerHTML = `
    <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" id="editorBackdrop"></div>
    <div class="relative glass rounded-3xl w-[95%] max-w-6xl h-[90vh] flex flex-col shadow-2xl animate-fade-in border-white/10 overflow-hidden">
      <div class="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <h2 class="text-xl font-bold text-zinc-100">🛠️ 数据编辑器</h2>
        <div class="flex items-center gap-2">
          <button id="editorImportBtn" class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-zinc-300 transition-all">📥 导入 JSON</button>
          <button id="editorExportBtn" class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-zinc-300 transition-all">📤 导出 JSON</button>
          <button id="editorResetBtn" class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-red-500/20 text-zinc-300 hover:text-red-300 transition-all">↺ 重置默认</button>
          <button id="editorCancelBtn" class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-zinc-300 transition-all">取消</button>
          <button id="editorSaveBtn" class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500 hover:bg-indigo-400 text-white transition-all">保存编辑</button>
          <button id="editorCloseBtn" class="w-8 h-8 rounded-full glass flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors">✕</button>
        </div>
      </div>
      <div id="editorContainer" class="flex-1 flex overflow-hidden">
        <!-- Content rendered here -->
      </div>
      <input type="file" id="editorFileInput" accept="application/json" class="hidden">
      <input type="file" id="editorImageInput" accept="image/*" class="hidden">
    </div>
  `;

  document.body.appendChild(modal);

  const container = modal.querySelector('#editorContainer') as HTMLDivElement;

  return { modal, container };
}

export function openEditor(elements: EditorModalElements, callbacks: EditorCallbacks): void {
  elements.callbacks = callbacks;
  createDraft();
  elements.modal.classList.remove('opacity-0', 'invisible');
  elements.modal.classList.add('opacity-100', 'visible');
  renderEditor(elements);
}

function doCloseEditor(elements: EditorModalElements): void {
  elements.modal.classList.add('opacity-0', 'invisible');
  elements.modal.classList.remove('opacity-100', 'visible');
}

export function closeEditor(elements: EditorModalElements): void {
  if (!isDraftModified()) {
    doCloseEditor(elements);
    elements.callbacks?.onCancel?.();
    return;
  }

  const result = confirm('是否保存编辑？\n点击「确定」保存修改，点击「取消」放弃修改。');
  if (result) {
    commitDraft();
    elements.callbacks?.onSave?.();
  } else {
    discardDraft();
    elements.callbacks?.onCancel?.();
  }
  doCloseEditor(elements);
}

function bindGlobalEditorEvents(elements: EditorModalElements): void {
  const backdrop = elements.modal.querySelector('#editorBackdrop');
  const closeBtn = elements.modal.querySelector('#editorCloseBtn');
  const saveBtn = elements.modal.querySelector('#editorSaveBtn');
  const cancelBtn = elements.modal.querySelector('#editorCancelBtn');
  const exportBtn = elements.modal.querySelector('#editorExportBtn');
  const importBtn = elements.modal.querySelector('#editorImportBtn');
  const resetBtn = elements.modal.querySelector('#editorResetBtn');
  const fileInput = elements.modal.querySelector('#editorFileInput') as HTMLInputElement;

  backdrop?.addEventListener('click', () => closeEditor(elements));
  closeBtn?.addEventListener('click', () => closeEditor(elements));

  saveBtn?.addEventListener('click', () => {
    commitDraft();
    elements.callbacks?.onSave?.();
    doCloseEditor(elements);
  });

  cancelBtn?.addEventListener('click', () => closeEditor(elements));

  exportBtn?.addEventListener('click', () => {
    downloadJSON('prompt-studio-data.json', getData());
  });

  importBtn?.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      const json = await readJSONFile(file);
      const data = importEditableData(JSON.stringify(json));
      if (data) {
        notifyChange(elements);
        currentCategory = null;
        renderEditor(elements);
      } else {
        alert('导入失败：JSON 格式不正确');
      }
    } catch (e) {
      alert('导入失败：' + (e as Error).message);
    }
    fileInput.value = '';
  });

  resetBtn?.addEventListener('click', () => {
    if (confirm('确定要重置为默认数据吗？所有自定义修改都会丢失。')) {
      resetEditableData();
      notifyChange(elements);
      currentCategory = null;
      renderEditor(elements);
    }
  });
}

function renderEditor(elements: EditorModalElements): void {
  const categories = getCategories();
  if (!currentCategory && categories.length > 0) {
    currentCategory = categories[0];
  }
  if (currentCategory && !categories.includes(currentCategory)) {
    currentCategory = categories[0] ?? null;
  }

  elements.container.innerHTML = '';

  // Left sidebar: categories
  const leftPanel = createElement('div', 'w-[280px] flex-shrink-0 border-r border-white/5 flex flex-col bg-zinc-950/20');
  leftPanel.innerHTML = `
    <div class="p-4 border-b border-white/5 flex items-center justify-between">
      <h3 class="text-sm font-bold text-zinc-300">分类</h3>
      <button id="editorAddCategoryBtn" class="px-2 py-1 rounded-lg text-xs font-semibold bg-indigo-500 hover:bg-indigo-400 text-white transition-all">+ 新增</button>
    </div>
    <div id="editorCategoryList" class="flex-1 overflow-y-auto p-2 space-y-1"></div>
  `;

  const categoryList = leftPanel.querySelector('#editorCategoryList') as HTMLElement;
  const fragment = document.createDocumentFragment();

  for (const cat of categories) {
    const meta = getData().categoryMeta[cat];
    const isActive = cat === currentCategory;
    const item = createElement(
      'div',
      `editor-category-item flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all ${
        isActive ? 'bg-white/10 text-zinc-100' : 'text-zinc-400 hover:bg-white/5'
      }`,
      { 'data-cat': cat }
    );
    item.innerHTML = `
      <span class="editor-drag-handle text-zinc-600 hover:text-zinc-300 cursor-grab active:cursor-grabbing" draggable="true" title="拖动排序">⋮⋮</span>
      <span class="text-base">${meta?.icon ?? '•'}</span>
      <span class="flex-1 text-sm truncate">${escapeHtml(getData().i18n['zh-CN']['cat_' + cat] ?? cat)}</span>
      <button class="editor-edit-cat text-zinc-500 hover:text-zinc-200 p-1" data-cat="${cat}">✎</button>
      <button class="editor-del-cat text-zinc-500 hover:text-red-400 p-1" data-cat="${cat}">🗑</button>
    `;
    item.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('button, .editor-drag-handle')) return;
      currentCategory = cat;
      renderEditor(elements);
    });
    fragment.appendChild(item);
  }
  categoryList.appendChild(fragment);
  setupCategoryDragAndDrop(categoryList, elements);

  elements.container.appendChild(leftPanel);

  // Right panel: groups
  const rightPanel = createElement('div', 'flex-1 flex flex-col overflow-hidden');

  if (!currentCategory) {
    rightPanel.innerHTML = `<div class="flex-1 flex items-center justify-center text-zinc-500">👈 请先选择一个分类</div>`;
    elements.container.appendChild(rightPanel);
    bindGlobalEditorEvents(elements);
    bindCategoryEvents(elements);
    return;
  }

  const meta = getData().categoryMeta[currentCategory];
  const groups = getGroups(currentCategory);

  rightPanel.innerHTML = `
    <div class="p-4 border-b border-white/5 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="text-xl">${meta?.icon ?? '•'}</span>
        <h3 class="text-sm font-bold text-zinc-100">${escapeHtml(getData().i18n['zh-CN']['cat_' + currentCategory] ?? currentCategory)}</h3>
        <span class="text-xs text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">${groups.length} 组</span>
      </div>
      <button id="editorAddGroupBtn" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500 hover:bg-indigo-400 text-white transition-all">+ 新增提示词组</button>
    </div>
    <div id="editorGroupList" class="flex-1 overflow-y-auto p-4 space-y-3"></div>
  `;

  const groupList = rightPanel.querySelector('#editorGroupList') as HTMLElement;
  const groupFragment = document.createDocumentFragment();

  for (const group of groups) {
    const card = createElement('div', 'editor-group-item glass rounded-2xl p-4 border-white/5', {
      'data-id': String(group.id),
    });
    const hasImage = !!group.imageUrl;
    card.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="editor-drag-handle text-zinc-600 hover:text-zinc-300 cursor-grab active:cursor-grabbing" draggable="true" title="拖动排序">⋮⋮</span>
          <span class="text-xs text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">ID: ${group.id}</span>
        </div>
        <button class="editor-del-group text-zinc-500 hover:text-red-400 text-xs" data-id="${group.id}">🗑 删除</button>
      </div>
      <div class="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label class="block text-[11px] text-zinc-500 mb-1">简体</label>
          <input type="text" class="editor-name-cn w-full px-3 py-2 glass rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" value="${escapeHtml(group.name['zh-CN'] ?? '')}" data-id="${group.id}">
        </div>
        <div>
          <label class="block text-[11px] text-zinc-500 mb-1">繁体</label>
          <input type="text" class="editor-name-tw w-full px-3 py-2 glass rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" value="${escapeHtml(group.name['zh-TW'] ?? '')}" data-id="${group.id}">
        </div>
        <div>
          <label class="block text-[11px] text-zinc-500 mb-1">英文</label>
          <input type="text" class="editor-name-en w-full px-3 py-2 glass rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" value="${escapeHtml(group.name.en ?? '')}" data-id="${group.id}">
        </div>
      </div>
      <div class="mb-3">
        <label class="block text-[11px] text-zinc-500 mb-1">英文提示词（每行一个）</label>
        <textarea class="editor-texts w-full h-20 px-3 py-2 glass rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none" data-id="${group.id}">${escapeHtml(group.texts.join('\n'))}</textarea>
      </div>
      <div class="mb-3">
        <label class="block text-[11px] text-zinc-500 mb-1">图片链接（可选）</label>
        <input type="text" class="editor-image w-full px-3 py-2 glass rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" value="${escapeHtml(group.imageUrl ?? '')}" data-id="${group.id}" placeholder="./images/xxx.jpg 或 https://...">
      </div>
      <div class="flex items-center gap-3">
        <button class="editor-upload-image px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-zinc-300 transition-all" data-id="${group.id}">📷 上传图片</button>
        ${hasImage ? `<div class="editor-image-preview w-10 h-10 rounded-lg bg-cover bg-center border border-white/10" style="background-image: url('${escapeHtml(group.imageUrl!)}')"></div>` : ''}
      </div>
    `;

    // Auto-save on input
    const inputs = card.querySelectorAll('input, textarea');
    inputs.forEach((input) => {
      input.addEventListener('change', () => saveGroupFromEditor(currentCategory!, group.id, card));
      input.addEventListener('blur', () => saveGroupFromEditor(currentCategory!, group.id, card));
    });

    groupFragment.appendChild(card);
  }

  groupList.appendChild(groupFragment);
  setupGroupDragAndDrop(groupList, elements);
  elements.container.appendChild(rightPanel);

  bindGlobalEditorEvents(elements);
  bindCategoryEvents(elements);
  bindGroupEvents(elements);
}

function saveGroupFromEditor(cat: CategoryKey, id: number, card: HTMLElement): void {
  const cn = (card.querySelector('.editor-name-cn') as HTMLInputElement)?.value.trim() ?? '';
  const tw = (card.querySelector('.editor-name-tw') as HTMLInputElement)?.value.trim() ?? '';
  const en = (card.querySelector('.editor-name-en') as HTMLInputElement)?.value.trim() ?? '';
  const textsRaw = (card.querySelector('.editor-texts') as HTMLTextAreaElement)?.value ?? '';
  const imageUrl = (card.querySelector('.editor-image') as HTMLInputElement)?.value.trim() ?? '';

  const texts = textsRaw
    .split('\n')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  const group: Partial<PromptGroup> = {
    name: { 'zh-CN': cn || en, 'zh-TW': tw || cn || en, en: en || cn },
    texts,
  };

  if (imageUrl) {
    group.imageUrl = imageUrl;
  } else {
    group.imageUrl = undefined;
  }

  updateGroup(cat, id, group);
}

function bindCategoryEvents(elements: EditorModalElements): void {
  const addBtn = elements.modal.querySelector('#editorAddCategoryBtn');
  addBtn?.addEventListener('click', () => {
    const key = prompt('请输入分类标识（英文，如 effects）：');
    if (!key) return;
    if (getData().promptLibrary[key as CategoryKey]) {
      alert('该分类已存在');
      return;
    }
    const cn = prompt('简体中文名称：') || key;
    const tw = prompt('繁体中文名称：') || cn;
    const en = prompt('英文名称：') || cn;
    const icon = prompt('图标 emoji（如 ✨）：') || '✨';
    const color = prompt('颜色（indigo/purple/pink/emerald/teal/amber/cyan/sky/rose/orange/violet）：') || 'indigo';

    const ok = addCategory(key as CategoryKey, { icon, color: AVAILABLE_COLORS.includes(color) ? color : 'indigo' }, {
      'zh-CN': cn,
      'zh-TW': tw,
      en,
    });

    if (ok) {
      currentCategory = key as CategoryKey;
      notifyChange(elements);
      renderEditor(elements);
    }
  });

  elements.modal.querySelectorAll('.editor-edit-cat').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const cat = (e.currentTarget as HTMLElement).dataset.cat as CategoryKey;
      const meta = getData().categoryMeta[cat];
      const cn = getData().i18n['zh-CN']['cat_' + cat] ?? cat;
      const tw = getData().i18n['zh-TW']['cat_' + cat] ?? cn;
      const en = getData().i18n.en['cat_' + cat] ?? cn;

      const newCn = prompt('简体中文名称：', cn);
      if (newCn === null) return;
      const newTw = prompt('繁体中文名称：', tw) || newCn;
      const newEn = prompt('英文名称：', en) || newCn;
      const newIcon = prompt('图标 emoji：', meta?.icon ?? '✨') || '✨';
      const newColor = prompt('颜色：', meta?.color ?? 'indigo') || 'indigo';

      updateCategory(
        cat,
        { icon: newIcon, color: AVAILABLE_COLORS.includes(newColor) ? newColor : meta?.color ?? 'indigo' },
        { 'zh-CN': newCn, 'zh-TW': newTw, en: newEn }
      );
      notifyChange(elements);
      renderEditor(elements);
    });
  });

  elements.modal.querySelectorAll('.editor-del-cat').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const cat = (e.currentTarget as HTMLElement).dataset.cat as CategoryKey;
      const name = getData().i18n['zh-CN']['cat_' + cat] ?? cat;
      if (confirm(`确定要删除分类「${name}」吗？该分类下的所有提示词组都会被删除。`)) {
        deleteCategory(cat);
        if (currentCategory === cat) currentCategory = null;
        notifyChange(elements);
        renderEditor(elements);
      }
    });
  });
}

function bindGroupEvents(elements: EditorModalElements): void {
  const addBtn = elements.modal.querySelector('#editorAddGroupBtn');
  addBtn?.addEventListener('click', () => {
    if (!currentCategory) return;
    addGroup(currentCategory, {
      id: 0,
      name: { 'zh-CN': '新提示词组', 'zh-TW': '新提示詞組', en: 'New Group' },
      texts: ['new tag'],
    });
    notifyChange(elements);
    renderEditor(elements);
  });

  elements.modal.querySelectorAll('.editor-del-group').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      if (!currentCategory) return;
      const id = Number((e.currentTarget as HTMLElement).dataset.id);
      if (confirm('确定要删除这个提示词组吗？')) {
        deleteGroup(currentCategory, id);
        notifyChange(elements);
        renderEditor(elements);
      }
    });
  });

  const imageInput = elements.modal.querySelector('#editorImageInput') as HTMLInputElement;
  elements.modal.querySelectorAll('.editor-upload-image').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!currentCategory) return;
      const id = Number((btn as HTMLElement).dataset.id);
      imageInput.dataset.targetId = String(id);
      imageInput.click();
    });
  });

  imageInput?.addEventListener('change', async () => {
    const file = imageInput.files?.[0];
    const id = Number(imageInput.dataset.targetId);
    if (!file || !currentCategory || !id) return;

    try {
      const base64 = await processImageUpload(file, { maxWidth: 600, maxHeight: 600, quality: 0.85 });
      updateGroup(currentCategory, id, { imageUrl: base64 });
      notifyChange(elements);
      renderEditor(elements);
    } catch (e) {
      alert('图片上传失败：' + (e as Error).message);
    }
    imageInput.value = '';
    delete imageInput.dataset.targetId;
  });
}

// ========== Drag and Drop: Categories ==========
function setupCategoryDragAndDrop(container: HTMLElement, elements: EditorModalElements): void {
  let draggedItem: HTMLElement | null = null;
  const items = Array.from(container.querySelectorAll('.editor-category-item')) as HTMLElement[];

  items.forEach((item) => {
    const handle = item.querySelector('.editor-drag-handle') as HTMLElement | null;
    if (!handle) return;

    handle.addEventListener('dragstart', (e) => {
      draggedItem = item;
      item.classList.add('opacity-50');
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setDragImage(item, 0, 0);
      }
    });

    handle.addEventListener('dragend', () => {
      item.classList.remove('opacity-50');
      draggedItem = null;
      items.forEach((child) => {
        child.classList.remove('border-t-2', 'border-b-2', 'border-indigo-500');
      });
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (!draggedItem || draggedItem === item) return;
      const rect = item.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      if (e.clientY < midpoint) {
        item.classList.add('border-t-2', 'border-indigo-500');
        item.classList.remove('border-b-2');
      } else {
        item.classList.add('border-b-2', 'border-indigo-500');
        item.classList.remove('border-t-2');
      }
    });

    item.addEventListener('dragleave', () => {
      item.classList.remove('border-t-2', 'border-b-2', 'border-indigo-500');
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      if (!draggedItem || draggedItem === item) return;

      const fromIndex = items.indexOf(draggedItem);
      const toIndex = items.indexOf(item);

      if (fromIndex === -1 || toIndex === -1) return;

      const categories = getCategories();
      const [moved] = categories.splice(fromIndex, 1);
      const rect = item.getBoundingClientRect();
      const insertBefore = e.clientY < rect.top + rect.height / 2;
      const newIndex = insertBefore ? toIndex : toIndex + 1;
      categories.splice(newIndex, 0, moved);

      reorderCategories(categories);
      currentCategory = moved;
      notifyChange(elements);
      renderEditor(elements);
    });
  });
}

// ========== Drag and Drop: Groups ==========
function setupGroupDragAndDrop(container: HTMLElement, elements: EditorModalElements): void {
  if (!currentCategory) return;
  let draggedItem: HTMLElement | null = null;
  const items = Array.from(container.querySelectorAll('.editor-group-item')) as HTMLElement[];

  items.forEach((item) => {
    const handle = item.querySelector('.editor-drag-handle') as HTMLElement | null;
    if (!handle) return;

    handle.addEventListener('dragstart', (e) => {
      draggedItem = item;
      item.classList.add('opacity-50');
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setDragImage(item, 0, 0);
      }
    });

    handle.addEventListener('dragend', () => {
      item.classList.remove('opacity-50');
      draggedItem = null;
      items.forEach((child) => {
        child.classList.remove('border-t-2', 'border-b-2', 'border-indigo-500');
      });
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (!draggedItem || draggedItem === item) return;
      const rect = item.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      if (e.clientY < midpoint) {
        item.classList.add('border-t-2', 'border-indigo-500');
        item.classList.remove('border-b-2');
      } else {
        item.classList.add('border-b-2', 'border-indigo-500');
        item.classList.remove('border-t-2');
      }
    });

    item.addEventListener('dragleave', () => {
      item.classList.remove('border-t-2', 'border-b-2', 'border-indigo-500');
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      if (!draggedItem || draggedItem === item || !currentCategory) return;

      const fromIndex = items.indexOf(draggedItem);
      const toIndex = items.indexOf(item);

      if (fromIndex === -1 || toIndex === -1) return;

      const groups = getGroups(currentCategory);
      const ids = groups.map((g) => g.id);
      const [movedId] = ids.splice(fromIndex, 1);
      const rect = item.getBoundingClientRect();
      const insertBefore = e.clientY < rect.top + rect.height / 2;
      const newIndex = insertBefore ? toIndex : toIndex + 1;
      ids.splice(newIndex, 0, movedId);

      reorderGroups(currentCategory, ids);
      notifyChange(elements);
      renderEditor(elements);
    });
  });
}
