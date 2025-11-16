// main.js - Plugin Version Links
// Simple DOM-based enhancement of Settings -> Plugins -> Available Plugins

(function () {
  'use strict';

  // Only care about the Settings / Plugins area; cheap guard
  function isLikelyPluginsPage() {
    const path = window.location.pathname || '';
    const hash = window.location.hash || '';
    return (
      path.toLowerCase().includes('settings') ||
      hash.toLowerCase().includes('plugins')
    );
  }

  function findAvailablePluginsTable(root) {
    // Look for a heading that says "Available Plugins"
    const headings = root.querySelectorAll('h1, h2, h3, h4');
    for (const h of headings) {
      const text = (h.textContent || '').trim().toLowerCase();
      if (text.startsWith('available plugins')) {
        // Walk forward to find the first TABLE sibling
        let el = h.nextElementSibling;
        while (el) {
          if (el.tagName === 'TABLE') return el;
          if (el.querySelector) {
            const nestedTable = el.querySelector('table');
            if (nestedTable) return nestedTable;
          }
          el = el.nextElementSibling;
        }
      }
    }
    return null;
  }

  function enhanceAvailablePluginsTable() {
    if (!isLikelyPluginsPage()) return;

    const table = findAvailablePluginsTable(document);
    if (!table) return;
    if (!table.tHead || !table.tBodies || !table.tBodies[0]) return;

    const headerCells = Array.from(table.tHead.rows[0].cells);
    const versionColIndex = headerCells.findIndex((th) =>
      (th.textContent || '').trim().toLowerCase() === 'version'
    );
    const urlColIndex = headerCells.findIndex((th) =>
      (th.textContent || '').trim().toLowerCase() === 'url'
    );

    if (versionColIndex === -1) return; // schema changed, bail

    const bodyRows = Array.from(table.tBodies[0].rows);

    for (const row of bodyRows) {
      const versionCell = row.cells[versionColIndex];
      if (!versionCell) continue;

      // Skip if we already converted this cell
      if (versionCell.querySelector('a')) continue;

      let url = null;

      if (urlColIndex !== -1 && row.cells[urlColIndex]) {
        const urlCell = row.cells[urlColIndex];
        const link = urlCell.querySelector('a');
        if (link && link.href) {
          url = link.href;
        } else {
          const txt = (urlCell.textContent || '').trim();
          if (txt) url = txt;
        }
      }

      // Only touch GitHub URLs so we don't accidentally link random text
      if (!url || !/^https?:\/\/github\.com\//i.test(url)) continue;

      const versionText = (versionCell.textContent || '').trim();
      if (!versionText) continue;

      // Replace cell content with a clickable link
      versionCell.textContent = '';
      const a = document.createElement('a');
      a.textContent = versionText;
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      versionCell.appendChild(a);
    }
  }

  // Observe SPA navigation / React renders
  function setupObserver() {
    if (!document.body) return;

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          // Cheap heuristic: rerun if any new heading or table appears
          if (
            node.matches('h1, h2, h3, h4, table') ||
            node.querySelector?.('h1, h2, h3, h4, table')
          ) {
            enhanceAvailablePluginsTable();
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Initial run
    enhanceAvailablePluginsTable();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupObserver);
  } else {
    setupObserver();
  }
})();
