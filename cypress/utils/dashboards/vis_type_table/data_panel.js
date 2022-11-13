/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

Cypress.Commands.add('addMetricsAggregation', () => {
  cy.getElementByTestId('visEditorAdd_metrics').click();
  cy.getElementByTestId('visEditorAdd_metrics_Metric').click();
});

Cypress.Commands.add('addBucketsAggregation', () => {
  cy.getElementByTestId('visEditorAdd_buckets').click();
});

Cypress.Commands.add('openDataPanel', () => {
  cy.getElementByTestId('visEditorTab__data').click();
});

Cypress.Commands.add('toggleOpenEditor', (id, request) => {
  cy.getElementByTestId(`visEditorAggAccordion${id}`)
    .find(`[aria-controls="visEditorAggAccordion${id}"]`)
    .invoke('attr', 'aria-expanded')
    .then(($expanded) => {
      cy.log('expand', $expanded);
      if ($expanded !== request) {
        cy.getElementByTestId(`visEditorAggAccordion${id}`)
          .find(`[aria-controls="visEditorAggAccordion${id}"]`)
          .click({ force: true });
      }
    });
});

Cypress.Commands.add('splitRows', () => {
  cy.getElementByTestId('visEditorAdd_buckets_Split rows').click();
});

Cypress.Commands.add('splitTables', () => {
  cy.getElementByTestId('visEditorAdd_buckets_Split table').click();
});
Cypress.Commands.add('splitTablesInRows', () => {
  cy.getElementByTestId('visEditorSplitBy__true').click({ force: true });
});

Cypress.Commands.add('splitTablesInColumns', () => {
  cy.getElementByTestId('visEditorSplitBy__false').click({ force: true });
});

export const selectFromOptionsList = (type, opt) => {
  cy.log(`Select an ${type} option`);
  expect(type).to.be.oneOf(['agg', 'field']);
  const select =
    type == 'field' ? 'visDefaultEditorField' : 'defaultEditorAggSelect';
  cy.getElementByTestId(`comboBoxOptionsList ${select}-optionsList`)
    .find(`[title="${opt}"]`)
    .trigger('click');
};

Cypress.Commands.add('selectAggregationType', (agg, id) => {
  const opts = { log: false };
  cy.toggleOpenEditor(id, 'true');
  cy.getElementByTestId(`visEditorAggAccordion${id}`)
    .find('[data-test-subj="visAggEditorParams"]', opts)
    .find('[data-test-subj="defaultEditorAggSelect"]', opts)
    .find('[data-test-subj="comboBoxSearchInput"]', opts)
    .click(opts)
    .clear(opts)
    .type(agg);
  selectFromOptionsList('agg', agg);
});

Cypress.Commands.add('selectAggregationField', (field, id) => {
  const opts = { log: false };
  cy.getElementByTestId(`visEditorAggAccordion${id}`)
    .find('[data-test-subj="visAggEditorParams"]', opts)
    .find('[data-test-subj="visDefaultEditorField"]', opts)
    .find('[data-test-subj="comboBoxSearchInput"]', opts)
    .click(opts)
    .clear(opts)
    .type(field);
  // select aggregation field
  selectFromOptionsList('field', field);
});

Cypress.Commands.add('selectSubAggregationType', (agg, id, type) => {
  const opts = { log: false };
  expect(type).to.be.oneOf(['buckets', 'metrics']);
  const order = type == 'buckets' ? 0 : 1;
  cy.toggleOpenEditor(id, 'true');
  cy.getElementByTestId(`visEditorAggAccordion${id}`)
    .find('[data-test-subj="visAggEditorParams"]', opts)
    .find('[data-test-subj="visAggEditorParams"]', opts)
    .then(($el) => {
      cy.wrap($el)
        .eq(order)
        .find('[data-test-subj="defaultEditorAggSelect"]')
        .find('[data-test-subj="comboBoxSearchInput"]', opts)
        .click(opts)
        .clear(opts)
        .type(agg);
    });
  selectFromOptionsList('agg', agg);
});

Cypress.Commands.add('selectSubAggregationField', (field, id, type) => {
  const opts = { log: false };
  expect(type).to.be.oneOf(['buckets', 'metrics']);
  const order = type == 'buckets' ? 0 : 1;
  cy.toggleOpenEditor(id, 'true');
  cy.getElementByTestId(`visEditorAggAccordion${id}`)
    .find('[data-test-subj="visAggEditorParams"]', opts)
    .find('[data-test-subj="visAggEditorParams"]', opts)
    .then(($el) => {
      cy.wrap($el)
        .eq(order)
        .find('[data-test-subj="visDefaultEditorField"]', opts)
        .find('[data-test-subj="comboBoxSearchInput"]', opts)
        .click(opts)
        .clear(opts)
        .type(field);
    });
  selectFromOptionsList('field', field);
});

Cypress.Commands.add('isAggregationTypeSelected', (type, id) => {
  cy.getElementByTestId(`visEditorAggAccordion${id}`)
    .find('[data-test-subj="defaultEditorAggSelect"]')
    .find('[class="euiComboBoxPill euiComboBoxPill--plainText"]')
    .should('contain.text', type);
});

Cypress.Commands.add('isAggregationFieldSelected', (field, id) => {
  cy.getElementByTestId(`visEditorAggAccordion${id}`)
    .find('[data-test-subj="visDefaultEditorField"]')
    .find('[class="euiComboBoxPill euiComboBoxPill--plainText"]')
    .should('contain.text', field);
});

Cypress.Commands.add('discardAggregationSettings', () => {
  cy.getElementByTestId('visualizeEditorResetButton').click();
});

Cypress.Commands.add('isUpdateAggregationSettingsEnabled', () => {
  cy.getElementByTestId('visualizeEditorRenderButton')
    .invoke('attr', 'class')
    .should(
      'equal',
      'euiButton euiButton--primary euiButton--small euiButton--fill'
    );
});

Cypress.Commands.add('isUpdateAggregationSettingsDisabled', () => {
  cy.getElementByTestId('visualizeEditorRenderButton')
    .invoke('attr', 'class')
    .should(
      'equal',
      'euiButton euiButton--primary euiButton--small euiButton--fill euiButton-isDisabled'
    );
});

Cypress.Commands.add('updateAggregationSettings', () => {
  cy.getElementByTestId('visualizeEditorRenderButton').click();
});

Cypress.Commands.add('removeAggregation', (id) => {
  cy.getElementByTestId(`visEditorAggAccordion${id}`)
    .find('[data-test-subj="removeDimensionBtn"]')
    .click();
});

Cypress.Commands.add('removeAllAggregations', (total) => {
  // remove all buckets and metrics aggregation
  // except the default metrics aggregation
  if (total > 1) {
    for (let i = 2; i <= total; i++) {
      cy.removeAggregation(i);
    }
  }
  cy.log('Open default metrics selection panel');
  cy.toggleOpenEditor(1, 'true');
  cy.log('Reset to Count');
  cy.selectAggregationType('Count', 1);
});
