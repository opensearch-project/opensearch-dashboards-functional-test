/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

Cypress.Commands.add('tbGetAllTableDataFromVisualization', (total) => {
  let data = [];
  for (let i = 0; i < total; i++) {
    data.push([]);
    cy.get(`[data-test-subj="visTableGroup${i}"]`)
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
  cy.getElementByTestId('dataGridWrapper')
    .find('[data-test-subj="dataGridRowCell"]')
    .find('[class="euiDataGridRowCell__truncate"]')
    .find('span')
    .each(($cell) => data.push($cell.text()));
  return cy.wrap(data);
});

Cypress.Commands.add('tbGetTotalValueFromTable', () => {
  let data = [];
  cy.getElementByTestId('dataGridRow')
    .find('[data-test-subj="dataGridRowCell"]')
    .find('[class="euiDataGridRowCell__truncate"]')
    .each(($val) => {
      const elementText = $val.text();
      const value = elementText.substring(0, elementText.indexOf('Row'));
      data.push(value);
    });
  return cy.wrap(data);
});

Cypress.Commands.add('tbSelectSortColumn', (tableIndex, colIndex, dir) => {
  expect(dir).to.be.oneOf(['asc', 'desc']);
  const dirIndex = dir == 'asc' ? 0 : 1;
  cy.get(`[data-test-subj="visTableGroup${tableIndex}"]`)
    .find('[class="euiDataGridHeaderCell"]')
    .eq(colIndex)
    .find('[class="euiDataGridHeaderCell__button"]')
    .click();
  cy.get('[class="euiListGroupItem__button"]').eq(dirIndex).click();
});

Cypress.Commands.add('tbGetColumnWidth', (tableIndex, colIndex, name) => {
  cy.get(`[data-test-subj="visTableGroup${tableIndex}"]`)
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
    expect(action).to.be.oneOf(['filter for', 'filter out', 'expand']);
    const filterFor = '[data-test-subj="filterForValue"]';
    const filterOut = '[data-test-subj="filterOutValue"]';
    const expand =
      '[class="euiButtonIcon euiButtonIcon--primary euiButtonIcon--fill euiButtonIcon--xSmall euiDataGridRowCell__expandButtonIcon"]';
    const actionButton =
      action == 'filter for'
        ? filterFor
        : action == 'filter out'
        ? filterOut
        : expand;
    if (embed) {
      cy.get('[data-test-subj="dataGridRowCell"]')
        .eq(rowIndex * totalColumn + colIndex)
        .click()
        .find(actionButton)
        .click({ force: true });
    } else {
      cy.get(`[data-test-subj="visTableGroup${tableIndex}"]`)
        .find('[data-test-subj="dataGridWrapper"]')
        .find('[data-test-subj="dataGridRowCell"]')
        .eq(rowIndex * totalColumn + colIndex)
        .click()
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
