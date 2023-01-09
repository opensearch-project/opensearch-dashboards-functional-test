/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const tbSelectFromOptionsList = (type, opt) => {
  cy.log(`Select an ${type} option`);
  expect(type).to.be.oneOf(['agg', 'field']);
  const select =
    type == 'field' ? 'visDefaultEditorField' : 'defaultEditorAggSelect';
  cy.getElementByTestId(`comboBoxOptionsList ${select}-optionsList`)
    .find(`[title="${opt}"]`)
    .trigger('click');
};

Cypress.Commands.add('tbAddMetricsAggregation', () => {
  cy.getElementByTestId('visEditorAdd_metrics').click();
  cy.getElementByTestId('visEditorAdd_metrics_Metric').click();
});

Cypress.Commands.add('tbAddBucketsAggregation', () => {
  cy.getElementByTestId('visEditorAdd_buckets').click();
});

Cypress.Commands.add('tbOpenDataPanel', () => {
  cy.getElementByTestId('visEditorTab__data').click();
});

Cypress.Commands.add('tbToggleOpenEditor', (id, request) => {
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

Cypress.Commands.add('tbSplitRows', () => {
  cy.getElementByTestId('visEditorAdd_buckets_Split rows').click();
});

Cypress.Commands.add('tbSplitTables', () => {
  cy.getElementByTestId('visEditorAdd_buckets_Split table').click();
});
Cypress.Commands.add('tbSplitTablesInRows', () => {
  cy.getElementByTestId('visEditorSplitBy__true').click({ force: true });
});

Cypress.Commands.add('tbSplitTablesInColumns', () => {
  cy.getElementByTestId('visEditorSplitBy__false').click({ force: true });
});

Cypress.Commands.add('tbSelectAggregationType', (agg, id) => {
  const opts = { log: false };
  cy.tbToggleOpenEditor(id, 'true');
  cy.getElementByTestId(`visEditorAggAccordion${id}`)
    .find('[data-test-subj="visAggEditorParams"]', opts)
    .find('[data-test-subj="defaultEditorAggSelect"]', opts)
    .find('[data-test-subj="comboBoxSearchInput"]', opts)
    .click(opts)
    .clear(opts)
    .type(agg);
  tbSelectFromOptionsList('agg', agg);
});

Cypress.Commands.add('tbSelectAggregationField', (field, id) => {
  const opts = { log: false };
  cy.getElementByTestId(`visEditorAggAccordion${id}`)
    .find('[data-test-subj="visAggEditorParams"]', opts)
    .find('[data-test-subj="visDefaultEditorField"]', opts)
    .find('[data-test-subj="comboBoxSearchInput"]', opts)
    .click(opts)
    .clear(opts)
    .type(field);
  // select aggregation field
  tbSelectFromOptionsList('field', field);
});

Cypress.Commands.add('tbSelectSubAggregationType', (agg, id, type) => {
  const opts = { log: false };
  expect(type).to.be.oneOf(['buckets', 'metrics']);
  const order = type == 'buckets' ? 0 : 1;
  cy.tbToggleOpenEditor(id, 'true');
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
  tbSelectFromOptionsList('agg', agg);
});

Cypress.Commands.add('tbSelectSubAggregationField', (field, id, type) => {
  const opts = { log: false };
  expect(type).to.be.oneOf(['buckets', 'metrics']);
  const order = type == 'buckets' ? 0 : 1;
  cy.tbToggleOpenEditor(id, 'true');
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
  tbSelectFromOptionsList('field', field);
});

Cypress.Commands.add('tbIsAggregationTypeSelected', (type, id) => {
  cy.getElementByTestId(`visEditorAggAccordion${id}`)
    .find('[data-test-subj="defaultEditorAggSelect"]')
    .find('[class="euiComboBoxPill euiComboBoxPill--plainText"]')
    .should('contain.text', type);
});

Cypress.Commands.add('tbIsAggregationFieldSelected', (field, id) => {
  cy.getElementByTestId(`visEditorAggAccordion${id}`)
    .find('[data-test-subj="visDefaultEditorField"]')
    .find('[class="euiComboBoxPill euiComboBoxPill--plainText"]')
    .should('contain.text', field);
});

Cypress.Commands.add('tbDiscardAggregationSettings', () => {
  cy.getElementByTestId('visualizeEditorResetButton').click();
});

Cypress.Commands.add('tbIsUpdateAggregationSettingsEnabled', () => {
  cy.getElementByTestId('visualizeEditorRenderButton')
    .invoke('attr', 'class')
    .should(
      'equal',
      'euiButton euiButton--primary euiButton--small euiButton--fill'
    );
});

Cypress.Commands.add('tbIsUpdateAggregationSettingsDisabled', () => {
  cy.getElementByTestId('visualizeEditorRenderButton')
    .invoke('attr', 'class')
    .should(
      'equal',
      'euiButton euiButton--primary euiButton--small euiButton--fill euiButton-isDisabled'
    );
});

Cypress.Commands.add('tbUpdateAggregationSettings', () => {
  cy.getElementByTestId('visualizeEditorRenderButton').click();
});

Cypress.Commands.add('tbRemoveAggregation', (id) => {
  cy.getElementByTestId(`visEditorAggAccordion${id}`)
    .find('[data-test-subj="removeDimensionBtn"]')
    .click();
});

Cypress.Commands.add('tbRemoveAllAggregations', (total) => {
  // remove all buckets and metrics aggregation
  // except the default metrics aggregation
  if (total > 1) {
    for (let i = 2; i <= total; i++) {
      cy.tbRemoveAggregation(i);
    }
  }
  cy.log('Open default metrics selection panel');
  cy.tbToggleOpenEditor(1, 'true');
  cy.log('Reset to Count');
  cy.tbSelectAggregationType('Count', 1);
});
