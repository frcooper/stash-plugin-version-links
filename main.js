// main.js - Plugin Version Links
// Simple DOM-based enhancement of Settings -> Plugins -> Available Plugins

(function () {
  'use strict';

  const GRAPHQL_ENDPOINT = '/graphql';
  const GITHUB_URL_REGEX = /^https?:\/\/github\.com\//i;
  const SOURCES_QUERY = `
    query PluginVersionLinksSources {
      configuration {
        general {
          pluginPackageSources {
            url
          }
        }
      }
    }
  `;
  const PACKAGES_QUERY = `
    query PluginVersionLinksPackages($source: String!) {
      availablePackages(type: Plugin, source: $source) {
        package_id
        metadata
      }
    }
  `;

  let packageUrlMapPromise = null;

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

    const info = findAvailablePluginsTable(document);
    if (!info) return;

    const { table, versionColIndex, urlColIndex } = info;

    const bodyRows = Array.from(table.tBodies[0].rows);

    for (const row of bodyRows) {
      const versionCell = row.cells[versionColIndex];
      if (!versionCell || versionCell.querySelector('a')) continue;

      let url = null;
      const urlCell = row.cells[urlColIndex];
      if (urlCell) {
        const link = urlCell.querySelector('a');
        if (link && link.href) {
          url = link.href;
        } else {
          const txt = (urlCell.textContent || '').trim();
          if (txt) url = txt;
        }
      }

      if (!url || !GITHUB_URL_REGEX.test(url)) continue;

      const versionText = (versionCell.textContent || '').trim();
      if (!versionText) continue;

      linkifyText(versionCell, versionText, url);
    }
  }

  function enhancePackageManagerTable(table, packageUrlMap) {
    if (!packageUrlMap || !table.tBodies || !table.tBodies[0]) return;
    const rows = table.tBodies[0].querySelectorAll('tr');

    for (const row of rows) {
      const idEl = row.querySelector('.package-id');
      const versionEl = row.querySelector('.package-version');
      if (!idEl || !versionEl || versionEl.querySelector('a')) continue;

      const packageId = (idEl.textContent || '').trim().toLowerCase();
      if (!packageId) continue;

      const url = packageUrlMap[packageId];
      if (!url) continue;

      const versionText = (versionEl.textContent || '').trim();
      if (!versionText) continue;

      linkifyText(versionEl, versionText, url);
    }
  }

  function enhanceAvailablePluginsTable() {
    if (!isLikelyPluginsPage()) return;

    const table = findAvailablePluginsTable(document);
    if (!table || !table.tHead || !table.tHead.rows.length) return;

    const headerCells = Array.from(table.tHead.rows[0].cells || []);
    const versionColIndex = headerCells.findIndex((th) =>
      (th.textContent || '').trim().toLowerCase() === 'version'
    );
    if (versionColIndex === -1) return;

    const urlColIndex = headerCells.findIndex((th) =>
      (th.textContent || '').trim().toLowerCase() === 'url'
    );

    if (urlColIndex !== -1) {
      enhanceLegacyTable(table, versionColIndex, urlColIndex);
      return;
    }

    getPackageUrlMap().then((packageMap) => {
      if (!packageMap) return;
      enhancePackageManagerTable(table, packageMap);
    });
  }

  function fetchGraphQL(query, variables) {
    return fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ query, variables }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`GraphQL request failed: ${response.status}`);
        }
        return response.json();
      })
      .then((payload) => {
        if (payload.errors && payload.errors.length) {
          throw new Error(payload.errors.map((err) => err.message).join(', '));
        }
        return payload.data;
      });
  }

  async function fetchPluginSources() {
    const data = await fetchGraphQL(SOURCES_QUERY, {});
    const sources =
      data?.configuration?.general?.pluginPackageSources ?? [];
    return sources.filter((src) => typeof src?.url === 'string' && src.url);
  }

  function extractGithubUrl(metadata) {
    if (!metadata || typeof metadata !== 'object') return null;
    const candidates = [
      metadata.url,
      metadata.homepage,
      metadata.homepage_url,
      metadata.homepageUrl,
      metadata.repository,
      metadata.repo,
      metadata.source,
    ];
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && GITHUB_URL_REGEX.test(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  async function fetchPackagesForSource(sourceURL) {
    const data = await fetchGraphQL(PACKAGES_QUERY, { source: sourceURL });
    return data?.availablePackages ?? [];
  }

  async function loadPackageUrlMap() {
    const sources = await fetchPluginSources();
    if (!sources.length) return {};

    const map = Object.create(null);
    const results = await Promise.all(
      sources.map((src) =>
        fetchPackagesForSource(src.url)
          .then((packages) => ({ packages }))
          .catch(() => ({ packages: [] }))
      )
    );

    for (const result of results) {
      for (const pkg of result.packages) {
        const pkgId = (pkg?.package_id || '').trim().toLowerCase();
        if (!pkgId || map[pkgId]) continue;
        const url = extractGithubUrl(pkg?.metadata);
        if (!url) continue;
        map[pkgId] = url;
      }
    }

    return map;
  }

  function getPackageUrlMap() {
    if (!packageUrlMapPromise) {
      packageUrlMapPromise = loadPackageUrlMap().catch((err) => {
        console.warn('Plugin Version Links: failed to load package data', err);
        packageUrlMapPromise = null;
        return null;
      });
    }
    return packageUrlMapPromise;
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
