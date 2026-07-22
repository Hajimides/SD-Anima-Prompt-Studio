import { describe, it, expect, beforeEach } from 'vitest';

describe('App initialization', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.documentElement.className = 'dark';
    document.documentElement.lang = 'zh-CN';
  });

  it('renders the full layout after initApp', async () => {
    const { initApp } = await import('@components/App');
    initApp();

    // Layout elements should exist
    expect(document.getElementById('shaderCanvas')).not.toBeNull();
    expect(document.getElementById('sidebar')).not.toBeNull();
    expect(document.getElementById('mainContent')).not.toBeNull();
    expect(document.getElementById('rightPanel')).not.toBeNull();
    expect(document.getElementById('contentSections')).not.toBeNull();
    expect(document.getElementById('settingsModal')).not.toBeNull();
    expect(document.getElementById('nsfwModal')).not.toBeNull();

    // Content should be rendered
    const sections = document.querySelectorAll('[data-cat-section]');
    expect(sections.length).toBeGreaterThan(0);

    // Sidebar should have category items
    const sidebarItems = document.querySelectorAll('[data-sidebar-cat]');
    expect(sidebarItems.length).toBeGreaterThan(0);
  });
});
