/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const makeTimestampedBody = (raw) => {
  const body = JSON.parse(JSON.stringify(raw));
  const resp = body.response || {};
  const list = (resp.top_queries || body.top_queries || []);
  const now = Date.now();
  body.response = resp;
  body.response.top_queries = list.map((q, i) => ({ ...q, timestamp: now - i * 1000 }));
  return body;
};

export const getRowsFromRaw = (raw) => {
  const resp = (raw && raw.response) || {};
  return (resp.top_queries || (raw && raw.top_queries) || []).slice();
};

export const assertRowCountEquals = (expected) => {
  // Target the main data table (last table on page), not the chart table
  cy.get('.euiBasicTable').last().find('.euiTableRow').should('have.length', expected);
};

export const getHeaders = () =>
  // Target the main data table headers (last table on page), not the chart table
  cy
    .get('.euiBasicTable')
    .last()
    .find('.euiTableHeaderCell')
    .then(($h) =>
      $h
        .map((_, el) => Cypress.$(el).text().trim())
        .get()
        .filter(Boolean)
    );

export const expectSortedBy = (label, colIdx) => {
  const extract = ($rows) =>
    [...$rows].map(($r) => {
      const txt = Cypress.$($r).find('td').eq(colIdx).text().trim();
      if (/ms|s|B|KB|MB|GB|TB/i.test(txt)) return parseFloat(txt.replace(/[^\d.]/g, '')) || 0;
      const ms = Date.parse(txt);
      if (!Number.isNaN(ms)) return ms;
      const num = parseFloat(txt.replace(/[^\d.-]/g, ''));
      return Number.isNaN(num) ? 0 : num;
    });

  // Target the main data table (last table on page)
  cy.get('.euiBasicTable').last().find('.euiTableHeaderCell').contains(label).click();
  cy.get('.euiBasicTable')
    .last()
    .find('.euiTableRow')
    .then(($r) => {
      const v = extract($r);
      const asc = [...v].sort((a, b) => a - b);
      expect(v, `${label} asc`).to.deep.equal(asc);
    });

  cy.get('.euiBasicTable').last().find('.euiTableHeaderCell').contains(label).click();
  cy.get('.euiBasicTable')
    .last()
    .find('.euiTableRow')
    .then(($r) => {
      const v = extract($r);
      const desc = [...v].sort((a, b) => b - a);
      expect(v, `${label} desc`).to.deep.equal(desc);
    });
};

export const norm = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();

export const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const findFilterButton = (labels) => {
  const candidates = (Array.isArray(labels) ? labels : [labels]).map(norm);

  return cy.get('button.euiFilterButton').then(($btns) => {
    const found = [...$btns].find((btn) => {
      const txt = norm(btn.innerText);
      const aria = norm(btn.getAttribute('aria-label'));
      const title = norm(btn.getAttribute('title'));
      const subj = norm(btn.getAttribute('data-test-subj'));
      return candidates.some(
        (lab) =>
          txt.includes(lab) || aria.includes(lab) || title.includes(lab) || subj.includes(lab)
      );
    });

    if (!found) {
      const dump = [...$btns]
        .map(
          (el) =>
            norm(el.innerText) ||
            norm(el.getAttribute('aria-label')) ||
            norm(el.getAttribute('title')) ||
            norm(el.getAttribute('data-test-subj'))
        )
        .join(' | ');
      throw new Error(
        `Filter button not found. Tried [${candidates.join(', ')}]. Buttons seen: ${dump}`
      );
    }

    return cy.wrap(found);
  });
};

export const openFilter = (labels) => {
  findFilterButton(labels).scrollIntoView().click();
  cy.get('.euiSelectableListItem', { timeout: 10000 }).should('exist');
};

export const clearAllOpenFilterOptions = () => {
  cy.get('.euiSelectableListItem').each(($item) => {
    // Check if item is selected by looking for the check icon or euiSelectableListItem-isChecked class
    const hasCheck =
      $item.find('[data-euiicon-type="check"]').length > 0 ||
      $item.hasClass('euiSelectableListItem-isChecked') ||
      $item.attr('aria-checked') === 'true';
    if (hasCheck) {
      cy.wrap($item).click();
    }
  });
};

export const setListFilter = (buttonLabels, values = []) => {
  openFilter(buttonLabels);
  clearAllOpenFilterOptions();
  values.forEach((label) => {
    cy.contains('.euiSelectableListItem', new RegExp(`^${esc(label)}$`, 'i'))
      .scrollIntoView()
      .click();
  });
  cy.get('body').click(0, 0);
  cy.wait(300);
};

export const setNodeIdFilter = (nodeIds = []) => setListFilter(['Coordinator Node ID'], nodeIds);
export const setSearchTypeFilter = (types = []) => setListFilter(['Search Type'], types);
export const setIndicesFilter = (indices = []) => setListFilter(['Indices'], indices);

export const setTypeFilter = (mode /* 'query' | 'group' | 'both' */) => {
  // Click the Type filter button (in the filter group, not visualization toggle)
  findFilterButton(['Type']).click();
  cy.get('.euiSelectableListItem', { timeout: 10000 }).should('exist');

  const ensureToggle = (label, shouldBeOn) => {
    cy.contains('.euiSelectableListItem', new RegExp(`^${esc(label)}$`, 'i')).then(($item) => {
      const isOn = $item.attr('aria-checked') === 'true';
      if (isOn !== shouldBeOn) {
        cy.wrap($item).click();
      }
    });
  };

  if (mode === 'query') {
    ensureToggle('query', true);
    ensureToggle('group', false);
  } else if (mode === 'group') {
    ensureToggle('query', false);
    ensureToggle('group', true);
  } else {
    ensureToggle('query', true);
    ensureToggle('group', true);
  }
  cy.get('body').click(0, 0);
  cy.wait(300);
};

export const resetTypeFilterToNone = () => {
  // Click the Type filter button to open the popover
  findFilterButton(['Type']).click();
  cy.get('.euiSelectableListItem', { timeout: 10000 }).should('exist');

  cy.contains('.euiSelectableListItem', /^query$/i).then(($item) => {
    if ($item.attr('aria-checked') === 'true') {
      cy.wrap($item).click();
    }
  });

  cy.contains('.euiSelectableListItem', /^group$/i).then(($item) => {
    if ($item.attr('aria-checked') === 'true') {
      cy.wrap($item).click();
    }
  });

  cy.get('body').click(0, 0);
  cy.wait(500);
};

export const deriveExpectations = (payload, type = 'all') => {
  const allRows = getRowsFromRaw(payload);

  let rows = allRows;
  if (type === 'query') {
    rows = allRows.filter((r) => String(r.group_by).toUpperCase() === 'NONE');
  } else if (type === 'group') {
    rows = allRows.filter((r) => String(r.group_by).toUpperCase() !== 'NONE');
  }

  const uniq = (arr) => [...new Set(arr)];
  const countBy = (items, keyFn) =>
    items.reduce((acc, item) => {
      const k = keyFn(item);
      if (Array.isArray(k)) {
        k.filter(Boolean).forEach((kk) => {
          acc[kk] = (acc[kk] || 0) + 1;
        });
      } else if (k) {
        acc[k] = (acc[k] || 0) + 1;
      }
      return acc;
    }, {});

  const nodeIds = uniq(rows.map((r) => r.node_id).filter(Boolean));
  const indexNames = uniq(rows.flatMap((r) => r.indices || []).filter(Boolean));
  const searchTypes = uniq(rows.map((r) => r.search_type).filter(Boolean));

  return {
    appliedType: type,
    rows,
    totalRowCount: rows.length,
    nodeIds,
    nodeIdCounts: countBy(rows, (r) => r.node_id),
    indexNames,
    indexCounts: countBy(rows, (r) => r.indices || []),
    searchTypes,
    searchTypeCounts: countBy(rows, (r) => r.search_type),
  };
};
