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
      .trigger('mousedown', { which: 1, pageX: 0, pageY: 0 })
      .trigger('mousemove', { which: 1, pageX: size, pageY: 0 })
      .trigger('mouseup', { force: true });
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
        .trigger('mouseover') // Hover to show filter buttons
        .find(actionButton)
        .click({ force: true });
    } else {
      // For multiple tables, use the tableIndex
      cy.get('.tableVisContainer')
        .eq(tableIndex)
        .find('tbody tr')
        .eq(rowIndex)
        .find('td')
        .eq(colIndex)
        .trigger('mouseover')
        .find(actionButton)
        .click({ force: true });
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
