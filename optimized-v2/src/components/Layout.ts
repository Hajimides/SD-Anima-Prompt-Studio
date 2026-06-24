import { createElement } from '@utils/dom';

export interface LayoutElements {
  shaderCanvas: HTMLCanvasElement;
  vignetteOverlay: HTMLDivElement;
  settingsModal: HTMLDivElement;
  nsfwModal: HTMLDivElement;
  sidebar: HTMLElement;
  sidebarNav: HTMLElement;
  sidebarTitle: HTMLElement;
  sidebarTotalBadge: HTMLElement;
  mainContent: HTMLElement;
  contentSections: HTMLElement;
  topNav: HTMLElement;
  searchInput: HTMLInputElement;
  searchClearBtn: HTMLButtonElement;
  rightPanel: HTMLElement;
  selectedGroupsContainer: HTMLElement;
  emptyHintRight: HTMLElement;
  groupCountBadge: HTMLElement;
  clearAllBtn: HTMLButtonElement;
  promptOutput: HTMLTextAreaElement;
  charCount: HTMLElement;
  regenPromptBtn: HTMLButtonElement;
  copyBtn: HTMLButtonElement;
  shuffleBtn: HTMLButtonElement;
  modeToggle: HTMLElement;
  nsfwBtn: HTMLButtonElement;
  settingsBtn: HTMLButtonElement;
  editorBtn: HTMLButtonElement;
  blurSlider: HTMLInputElement;
  blurValue: HTMLElement;
  shimmerToggle: HTMLButtonElement;
  settingsTitle: HTMLElement;
  settingsBlurLabel: HTMLElement;
  settingsShimmerLabel: HTMLElement;
  settingsShimmerHint: HTMLElement;
}

export function createLayout(): { root: HTMLElement; elements: LayoutElements } {
  const body = document.body;
  body.className = 'shimmer-enabled';

  const shaderCanvas = createElement('canvas', '', { id: 'shaderCanvas' }) as HTMLCanvasElement;
  const vignetteOverlay = createElement('div', '', { id: 'vignetteOverlay' });

  body.appendChild(shaderCanvas);
  body.appendChild(vignetteOverlay);

  // Settings Modal
  const settingsModal = createElement(
    'div',
    'settings-modal fixed inset-0 z-[100] flex items-center justify-center opacity-0 invisible',
    { id: 'settingsModal', 'aria-modal': 'true', role: 'dialog' }
  );
  settingsModal.innerHTML = `
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" id="settingsBackdrop"></div>
    <div class="relative glass rounded-3xl max-w-md w-[92%] p-8 shadow-2xl animate-fade-in border-white/10">
      <div class="flex items-center justify-between mb-7">
        <h2 class="text-xl font-bold text-zinc-100" id="settingsTitle">Settings</h2>
        <button id="settingsCloseBtn" class="w-8 h-8 rounded-full glass flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors" aria-label="Close settings">✕</button>
      </div>
      <div class="space-y-6">
        <div>
          <div class="flex items-center justify-between mb-3">
            <label class="text-sm font-medium text-zinc-300" id="settingsBlurLabel">Glass Blur Intensity</label>
            <span id="blurValue" class="text-xs text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">20px</span>
          </div>
          <input type="range" id="blurSlider" min="0" max="40" value="20" class="w-full" aria-labelledby="settingsBlurLabel">
        </div>
        <div>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-zinc-300" id="settingsShimmerLabel">Shimmer Effect</label>
            <button id="shimmerToggle" class="relative w-11 h-6 rounded-full transition-colors duration-300 bg-indigo-500" role="switch" aria-checked="true" aria-labelledby="settingsShimmerLabel">
              <span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 translate-x-5"></span>
            </button>
          </div>
          <p class="text-xs text-zinc-500 mt-1.5" id="settingsShimmerHint">Flowing light animation on cards</p>
        </div>
      </div>
    </div>
  `;
  body.appendChild(settingsModal);

  // NSFW Modal
  const nsfwModal = createElement(
    'div',
    'fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm opacity-0 invisible transition-all duration-300',
    { id: 'nsfwModal', 'aria-modal': 'true', role: 'dialog' }
  );
  nsfwModal.innerHTML = `
    <div class="glass rounded-3xl shadow-2xl max-w-lg w-[90%] p-6 sm:p-8 mx-auto animate-fade-in">
      <h2 id="nsfwModalTitle" class="text-xl font-bold text-zinc-100 mb-5 flex items-center gap-2.5">🔞 开启 NSFW 模式</h2>
      <ul id="nsfwClauses" class="space-y-3.5 mb-7 text-sm text-zinc-400 leading-relaxed">
        <li class="flex items-start gap-2.5"><span class="text-red-400 font-bold flex-shrink-0 mt-0.5">1.</span><span id="nsfwClause1"></span></li>
        <li class="flex items-start gap-2.5"><span class="text-red-400 font-bold flex-shrink-0 mt-0.5">2.</span><span id="nsfwClause2"></span></li>
        <li class="flex items-start gap-2.5"><span class="text-red-400 font-bold flex-shrink-0 mt-0.5">3.</span><span id="nsfwClause3"></span></li>
        <li class="flex items-start gap-2.5"><span class="text-red-400 font-bold flex-shrink-0 mt-0.5">4.</span><span id="nsfwClause4"></span></li>
        <li class="flex items-start gap-2.5"><span class="text-red-400 font-bold flex-shrink-0 mt-0.5">5.</span><span id="nsfwClause5"></span></li>
      </ul>
      <div class="flex flex-col sm:flex-row gap-3">
        <button id="nsfwModalCancel" class="flex-1 px-5 py-3 rounded-2xl text-sm font-semibold bg-white/10 hover:bg-white/15 text-zinc-300 transition-all duration-200"></button>
        <button id="nsfwModalConfirm" class="flex-1 px-5 py-3 rounded-2xl text-sm font-semibold bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-md hover:shadow-lg transition-all duration-200"></button>
      </div>
    </div>
  `;
  body.appendChild(nsfwModal);

  // Main Layout
  const mainLayout = createElement('div', 'flex h-screen relative z-10');

  // Sidebar
  const sidebar = createElement('aside', 'w-[260px] flex-shrink-0 flex flex-col border-r border-white/5 bg-zinc-950/30 backdrop-blur-xl', { id: 'sidebar' });
  sidebar.innerHTML = `
    <div class="px-5 py-5 flex items-center gap-3 border-b border-white/5">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-lg font-bold">P</div>
      <div>
        <p class="text-sm font-bold text-zinc-100 leading-tight" id="sidebarTitle">Prompt Studio</p>
        <p class="text-[11px] text-zinc-500 leading-tight">SD / Anima</p>
      </div>
    </div>
    <nav id="sidebarNav" class="flex-1 overflow-y-auto py-3 px-2 space-y-0.5" aria-label="Categories"></nav>
    <div class="px-4 py-3 border-t border-white/5">
      <div class="flex items-center gap-2">
        <span id="sidebarTotalBadge" class="text-xs text-zinc-500 bg-white/5 px-2.5 py-1 rounded-full">0 组已选</span>
      </div>
    </div>
  `;
  mainLayout.appendChild(sidebar);

  // Main content + right panel container
  const contentWrapper = createElement('div', 'flex-1 flex overflow-hidden');

  // Main content
  const mainContent = createElement('main', 'flex-1 overflow-y-auto overflow-x-hidden', { id: 'mainContent' });
  const topNav = createElement('nav', 'sticky top-0 z-40 px-6 py-3 flex items-center gap-4 bg-zinc-950/10 backdrop-blur-2xl border-b border-white/5');
  topNav.innerHTML = `
    <div class="flex-1 max-w-xl mx-auto relative">
      <input id="searchInput" type="text" class="w-full pl-10 pr-10 py-2.5 glass rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all" placeholder="搜索提示词或人物…" aria-label="Search prompts">
      <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm" aria-hidden="true">🔍</span>
      <button id="searchClearBtn" class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 text-zinc-400 text-xs flex items-center justify-center hover:bg-white/20 transition-all hidden" aria-label="Clear search">✕</button>
    </div>
    <div class="flex items-center gap-2 flex-shrink-0">
      <div id="modeToggle" class="flex items-center glass rounded-xl p-0.5 cursor-pointer select-none border-white/5" role="group" aria-label="Generation mode">
        <button class="mode-option px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 bg-indigo-500 text-white" data-mode="sd" aria-pressed="true">🎨 SD</button>
        <button class="mode-option px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 text-zinc-400" data-mode="anima" aria-pressed="false">🌟 Anima</button>
      </div>
      <button id="nsfwBtn" class="px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 glass text-zinc-400 hover:text-zinc-200 border-white/5" aria-pressed="false">🔞 <span id="label_nsfw">NSFW</span></button>
      <div class="flex items-center glass rounded-xl p-0.5 border-white/5" role="group" aria-label="Language">
        <button class="lang-btn px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 bg-indigo-500 text-white" data-lang="zh-CN" aria-pressed="true">简</button>
        <button class="lang-btn px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 text-zinc-400" data-lang="zh-TW" aria-pressed="false">繁</button>
        <button class="lang-btn px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 text-zinc-400" data-lang="en" aria-pressed="false">EN</button>
      </div>
      <button id="editorBtn" class="w-8 h-8 rounded-xl glass flex items-center justify-center text-zinc-400 hover:text-indigo-300 transition-colors border-white/5" title="编辑数据" aria-label="Edit Data">🛠️</button>
      <button id="settingsBtn" class="w-8 h-8 rounded-xl glass flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors border-white/5" aria-label="Settings">⚙️</button>
      <a href="https://github.com/Hajimides/SD-Anima-Prompt-Studio" target="_blank" rel="noopener noreferrer" class="w-8 h-8 rounded-xl glass flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors border-white/5" aria-label="GitHub Repository">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      </a>
    </div>
  `;
  mainContent.appendChild(topNav);

  const contentSections = createElement('div', 'px-6 py-5 space-y-8 pb-20', { id: 'contentSections', role: 'region', 'aria-label': 'Prompt categories' });
  mainContent.appendChild(contentSections);
  contentWrapper.appendChild(mainContent);

  // Right panel
  const rightPanel = createElement('aside', 'w-[340px] flex-shrink-0 border-l border-white/5 bg-zinc-950/30 backdrop-blur-xl flex flex-col overflow-hidden', { id: 'rightPanel' });
  rightPanel.innerHTML = `
    <div class="px-5 py-4 border-b border-white/5">
      <div class="flex items-center justify-between mb-0.5">
        <h3 class="text-sm font-bold text-zinc-300" id="label_selectedGroups">已选择提示词组</h3>
        <span id="groupCountBadge" class="text-[11px] text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">0 组</span>
      </div>
    </div>
    <div id="selectedGroupsScroll" class="flex-1 overflow-y-auto p-4">
      <div id="selectedGroupsContainer" class="flex flex-wrap gap-2 min-h-[60px] items-start content-start">
        <span id="emptyHintRight" class="text-zinc-500 text-xs w-full text-center py-6">👈 从左侧选择提示词组</span>
      </div>
    </div>
    <div class="border-t border-white/5 p-4 space-y-3">
      <div>
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-bold text-zinc-300" id="label_prompt">组合后的 Prompt</h3>
            <button id="regenPromptBtn" class="hidden px-2 py-0.5 text-[10px] rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-all" title="从当前已选组重新生成提示词（覆盖手动编辑）">↺ 刷新</button>
          </div>
          <span id="charCount" class="text-[11px] text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">0 字符</span>
        </div>
        <textarea id="promptOutput" class="w-full h-28 p-3.5 glass rounded-2xl text-zinc-200 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all placeholder:text-zinc-600" placeholder="可直接编辑提示词，修改后选择变化不再自动覆盖…"></textarea>
      </div>
      <div class="flex gap-2.5">
        <button id="copyBtn" class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200 text-sm">📋 <span id="label_copy">复制 Prompt</span></button>
        <button id="shuffleBtn" class="flex items-center justify-center gap-2 px-4 py-3 glass text-zinc-300 font-semibold rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all duration-200 text-sm">🔄 <span id="label_shuffle">随机排序</span></button>
      </div>
      <button id="clearAllBtn" class="w-full py-2 text-xs text-red-400/70 hover:text-red-400 glass rounded-xl transition-all duration-200 hidden">🗑 <span id="label_clearAll">清空所有</span></button>
    </div>
  `;
  contentWrapper.appendChild(rightPanel);

  mainLayout.appendChild(contentWrapper);
  body.appendChild(mainLayout);

  const elements: LayoutElements = {
    shaderCanvas,
    vignetteOverlay,
    settingsModal,
    nsfwModal,
    sidebar,
    sidebarNav: $('#sidebarNav', sidebar)!,
    sidebarTitle: $('#sidebarTitle', sidebar)!,
    sidebarTotalBadge: $('#sidebarTotalBadge', sidebar)!,
    mainContent,
    contentSections,
    topNav,
    searchInput: $('#searchInput', topNav) as HTMLInputElement,
    searchClearBtn: $('#searchClearBtn', topNav) as HTMLButtonElement,
    rightPanel,
    selectedGroupsContainer: $('#selectedGroupsContainer', rightPanel)!,
    emptyHintRight: $('#emptyHintRight', rightPanel)!,
    groupCountBadge: $('#groupCountBadge', rightPanel)!,
    clearAllBtn: $('#clearAllBtn', rightPanel) as HTMLButtonElement,
    promptOutput: $('#promptOutput', rightPanel) as HTMLTextAreaElement,
    charCount: $('#charCount', rightPanel)!,
    regenPromptBtn: $('#regenPromptBtn', rightPanel) as HTMLButtonElement,
    copyBtn: $('#copyBtn', rightPanel) as HTMLButtonElement,
    shuffleBtn: $('#shuffleBtn', rightPanel) as HTMLButtonElement,
    modeToggle: $('#modeToggle', topNav)!,
    nsfwBtn: $('#nsfwBtn', topNav) as HTMLButtonElement,
    settingsBtn: $('#settingsBtn', topNav) as HTMLButtonElement,
    editorBtn: $('#editorBtn', topNav) as HTMLButtonElement,
    blurSlider: $('#blurSlider', settingsModal) as HTMLInputElement,
    blurValue: $('#blurValue', settingsModal)!,
    shimmerToggle: $('#shimmerToggle', settingsModal) as HTMLButtonElement,
    settingsTitle: $('#settingsTitle', settingsModal)!,
    settingsBlurLabel: $('#settingsBlurLabel', settingsModal)!,
    settingsShimmerLabel: $('#settingsShimmerLabel', settingsModal)!,
    settingsShimmerHint: $('#settingsShimmerHint', settingsModal)!,
  };

  return { root: mainLayout, elements };
}

function $<T extends HTMLElement>(selector: string, parent: ParentNode): T | null {
  return parent.querySelector<T>(selector);
}
