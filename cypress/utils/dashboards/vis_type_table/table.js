/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

Cypress.Commands.add('tbGetAllTableDataFromVisualization', (total) => {
  let data = [];
  for (let i = 0; i < total; i++) {
    data.push([]);
    cy.get('[class="visTable__group"]')
      .eq(i)
      .find('[data-test-subj="dataGridWrapper"]')
      .find('[data-test-subj="dataGridRowCell"]')
      .find('[class="euiDataGridRowCell__truncate"]')
      .find('span')
      .each(($cell) => data[i].push($cell.text()));
  }
  return cy.wrap(data);
});

Cypress.Commands.add('tbGetTableDataFromVisualization', () => {
  let data = [];
  cy.get('.tableVisContainer')
    .find('tbody td')
    .find('[data-test-subj="tableVisCellDataField"]')
    .each(($cell) => data.push($cell.text()));
  return cy.wrap(data);
});

/**
 * Wait for the table to have the expected number of data cells.
 * This is useful for React 18 concurrent rendering where DOM updates are deferred.
 * @param {number} expectedCount - The expected number of cells
 * @param {number} timeout - Timeout in milliseconds (default: 10000)
 */
Cypress.Commands.add(
  'tbWaitForTableCellCount',
  (expectedCount, timeout = 10000) => {
    cy.get('.tableVisContainer', { timeout })
      .find('[data-test-subj="tableVisCellDataField"]', { timeout })
      .should('have.length', expectedCount);
  }
);

/**
 * Wait for an aggregation accordion to exist and be visible.
 * Use this after adding a new aggregation to ensure UI is ready.
 * @param {number} id - The aggregation accordion ID (e.g., 2, 3)
 * @param {number} timeout - Timeout in milliseconds (default: 10000)
 */
Cypress.Commands.add('tbWaitForAggregationAccordion', (id, timeout = 10000) => {
  cy.getElementByTestId(`visEditorAggAccordion${id}`, { timeout }).should(
    'exist'
  );
});

/**
 * Wait for an aggregation type to be selected in the accordion.
 * @param {string} type - The aggregation type (e.g., 'Average', 'Terms')
 * @param {number} id - The aggregation accordion ID
 */
Cypress.Commands.add('tbWaitForAggregationType', (type, id) => {
  cy.getElementByTestId(`visEditorAggAccordion${id}`)
    .find('[data-test-subj="defaultEditorAggSelect"]')
    .find('.euiComboBoxPill')
    .should('contain', type);
});

/**
 * Wait for the visualization to finish loading/rendering.
 * Checks that the loader is not present and table container exists.
 */
Cypress.Commands.add('tbWaitForVisualization', (timeout = 10000) => {
  cy.get('.euiLoadingChart', { timeout }).should('not.exist');
  cy.get('.tableVisContainer', { timeout }).should('exist');
});

Cypress.Commands.add('tbGetTotalValueFromTable', () => {
  let data = [];
  cy.get('.tableVisContainer')
    .find('tfoot td')
    .each(($val) => {
      data.push($val.text().trim());
    });
  return cy.wrap(data);
});

Cypress.Commands.add('tbSelectSortColumn', (tableIndex, colIndex, dir) => {
  expect(dir).to.be.oneOf(['asc', 'desc']);
  const dirIndex = dir == 'asc' ? 0 : 1;
  cy.get('[class="visTable__group"]')
    .eq(tableIndex)
    .find('[class="euiDataGridHeaderCell"]')
    .eq(colIndex)
    .find('[class="euiDataGridHeaderCell__button"]')
    .click();
  cy.get('[class="euiListGroupItem__button"]').eq(dirIndex).click();
});

Cypress.Commands.add('tbGetColumnWidth', (tableIndex, colIndex, name) => {
  cy.get('[class="visTable__group"]')
    .eq(tableIndex)
    .find('[data-test-subj="dataGridHeader"]')
    .find('[class="euiDataGridHeaderCell"]')
    .eq(colIndex)
    .invoke('attr', 'style')
    .then((value) => {
      const width = value.split(' ').pop();
      const widthValue = Number(width.substring(0, width.indexOf('p')));
      cy.wrap(widthValue).as(name);
    });
});

Cypress.Commands.add(
  'tbAdjustColumnWidth',
  (totalColumn, tableIndex, colIndex, size) => {
    const resizerIndex = totalColumn * tableIndex + colIndex;
    cy.getElementByTestId('dataGridColumnResizer')
      .eq(resizerIndex)
      .then(($el) => {
        cy.wrap($el).trigger('mousedown', { which: 1, pageX: 0, pageY: 0 });
        cy.wrap($el).trigger('mousemove', { which: 1, pageX: size, pageY: 0 });
        cy.wrap($el).trigger('mouseup', { force: true });
      });
  }
);

Cypress.Commands.add(
  'tbClickTableCellAction',
  (totalColumn, rowIndex, colIndex, action, tableIndex = 0, embed = false) => {
    expect(action).to.be.oneOf(['filter for', 'filter out']);
    const filterFor = '[data-test-subj="tableVisFilterForValue"]';
    const filterOut = '[data-test-subj="tableVisFilterOutValue"]';

    const actionButton = action === 'filter for' ? filterFor : filterOut;

    if (embed) {
      // For embedded tables, directly find the cell
      cy.get('.tableVisContainer')
        .find('tbody tr')
        .eq(rowIndex)
        .find('td')
        .eq(colIndex)
        .then(($cell) => {
          cy.wrap($cell).trigger('mouseover'); // Hover to show filter buttons
          cy.wrap($cell).find(actionButton).click({ force: true });
        });
    } else {
      // For multiple tables, use the tableIndex
      cy.get('.tableVisContainer')
        .eq(tableIndex)
        .find('tbody tr')
        .eq(rowIndex)
        .find('td')
        .eq(colIndex)
        .then(($cell) => {
          cy.wrap($cell).trigger('mouseover');
          cy.wrap($cell).find(actionButton).click({ force: true });
        });
    }
  }
);

Cypress.Commands.add('tbClickFilterFromExpand', (action) => {
  expect(action).to.be.oneOf(['filter for', 'filter out']);
  const actionButton =
    action == 'filter for' ? 'filterForValue' : 'filterOutValue';
  cy.get('[class="euiPopoverFooter"]')
    .find('[class="euiFlexItem"]')
    .find(`[data-test-subj=${actionButton}]`)
    .click({ force: true });
});
