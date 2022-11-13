/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * Terms Aggregation
 */

Cypress.Commands.add('toggleOtherBucket', (request) => {
  expect(request).to.be.oneOf(['true', 'false']);
  cy.getElementByTestId('otherBucketSwitch')
    .invoke('attr', 'aria-checked')
    .then((state) => {
      if (state !== request) {
        cy.getElementByTestId('otherBucketSwitch').click();
      }
    });
});

Cypress.Commands.add('toggleMissingBucket', (request) => {
  expect(request).to.be.oneOf(['true', 'false']);
  cy.getElementByTestId('missingBucketSwitch')
    .invoke('attr', 'disabled')
    .should('not.exist');
  cy.getElementByTestId('missingBucketSwitch')
    .invoke('attr', 'aria-checked')
    .then((state) => {
      if (state !== request) {
        cy.getElementByTestId('missingBucketSwitch').click();
      }
    });
});

// size is a aggregation param only for Terms and Significant Terms Aggregation
// it is used to set the displayed row size
Cypress.Commands.add('setTermsSize', (size, id) => {
  const opts = { log: false };
  cy.getElementByTestId(`visEditorAggAccordion${id}`)
    .find('[data-test-subj="sizeParamEditor"]')
    .click(opts)
    .clear(opts)
    .type(size);
});

// sort is a aggregation param for Terms Aggregation
// it is a direction param which sort the term column in ascending or descending
Cypress.Commands.add('setTermsSort', (sort, id) => {
  expect(['Ascending', 'Descending']).to.contain(sort);
  cy.getElementByTestId(`visEditorAggAccordion${id}`)
    .find('[class="visEditorAggParam--half visEditorAggParam--half-order"]')
    .find('[class="euiSelect euiSelect--fullWidth euiSelect--compressed"]')
    .select(sort);
});

Cypress.Commands.add('setupTermsAggregation', (field, sort, size, id) => {
  cy.log('Set up Buckets Aggregation');
  cy.log('Set up aggregation type Terms');
  // set aggregation type to `Terms`
  cy.selectAggregationType('Terms', id);
  cy.isAggregationTypeSelected('Terms', id);
  // set aggregation field
  cy.log('Set up aggregation field: ', field);
  cy.selectAggregationField(field, id);
  cy.isAggregationFieldSelected(field, id);
  // set Terms aggregation unique params
  cy.setTermsSort(sort, id);
  cy.setTermsSize(size, id);
  cy.updateAggregationSettings();
  cy.isUpdateAggregationSettingsDisabled();
});

/*
 * Histogram Aggregation
 */

// interval is a aggregation param for Histogram Aggregation
// it is the width of each bucket
Cypress.Commands.add('enableHistogramInterval', (id) => {
  cy.getElementByTestId(`visEditorIntervalSwitch${id}`)
    .invoke('attr', 'aria-checked')
    .should('eq', 'true');
  cy.getElementByTestId(`visEditorIntervalSwitch${id}`).click();
});

Cypress.Commands.add('setHistogramInterval', (interval, id) => {
  const opts = { log: false };
  cy.getElementByTestId(`visEditorInterval${id}`)
    .click(opts)
    .clear(opts)
    .type(interval);
});

Cypress.Commands.add('isHistogramIntervalSet', (interval, id) => {
  cy.getElementByTestId(`visEditorAggAccordion${id}`)
    .find(`[data-test-subj="visEditorInterval${id}"]`)
    .invoke('attr', 'value')
    .should('eq', interval);
});

Cypress.Commands.add('setupHistogramAggregation', (field, interval, id) => {
  cy.log('Set up Buckets Aggregation');
  cy.log('Set up aggregation type Histogram');
  // set aggregation type to `Histogram`
  cy.selectAggregationType('Histogram', id);
  cy.isAggregationTypeSelected('Histogram', id);
  // set aggregation field
  cy.log('Set up aggregation field: ', field);
  cy.selectAggregationField(field, id);
  cy.isAggregationFieldSelected(field, id);
  // set Histogram aggregation interval params
  if (interval) {
    cy.enableHistogramInterval(id);
    cy.setHistogramInterval(interval, id);
  }
  // update aggregation settings
  cy.updateAggregationSettings();
  cy.isHistogramIntervalSet(interval, id);
});

/*
 * Range Aggregation
 */

Cypress.Commands.add('addRange', () => {
  cy.getElementByTestId('range__addRangeButton').click();
});

Cypress.Commands.add('setupRange', (range, id) => {
  const numOfRange = range.length;
  expect(numOfRange).to.be.at.least(1);
  if (numOfRange == 1) {
    cy.getElementByTestId(`visEditorAggAccordion${id}`)
      .find(
        '[class="euiFlexGroup euiFlexGroup--gutterSmall euiFlexGroup--alignItemsCenter euiFlexGroup--directionRow"]'
      )
      .last()
      .find('button')
      .click();
  } else if (numOfRange > 2) {
    for (let i = 2; i < numOfRange; i++) {
      cy.addRange();
    }
  }

  for (let i = 0; i < numOfRange; i++) {
    cy.getElementByTestId(`range${i}__from`)
      .click()
      .clear()
      .type(range[`${i}`][0]);
    cy.getElementByTestId(`range${i}__to`)
      .click()
      .clear()
      .type(range[`${i}`][1]);
  }
});

Cypress.Commands.add('setupRangeAggregation', (field, range, id) => {
  cy.log('Set up Buckets Aggregation');
  cy.log('Set up aggregation type Range');
  // set aggregation type to `Range`
  cy.selectAggregationType('Range', id);
  cy.isAggregationTypeSelected('Range', id);
  // set aggregation field
  cy.log('Set up aggregation field: ', field);
  cy.selectAggregationField(field, id);
  cy.isAggregationFieldSelected(field, id);
  // set Range aggregation range params
  cy.setupRange(range, id);
  // update aggregation settings
  cy.updateAggregationSettings();
});

/*
 * Date Histogram Aggregation
 */
Cypress.Commands.add('setupMinimumlInterval', (interval, id) => {
  const opts = { log: false };
  cy.getElementByTestId(`visEditorAggAccordion${id}`)
    .find('[data-test-subj="visEditorInterval"]')
    .find('[data-test-subj="comboBoxSearchInput"]', opts)
    .click(opts)
    .clear(opts)
    .type(interval);
  cy.getElementByTestId('comboBoxOptionsList visEditorInterval-optionsList')
    .find(`[title=${interval}]`)
    .click(opts);
});

Cypress.Commands.add(
  'setupDateHistogramAggregation',
  (field, interval, id) => {
    cy.log('Set up Buckets Aggregation');
    cy.log('Set up aggregation type Date Histogram');
    // set aggregation type to `Range`
    cy.selectAggregationType('Date Histogram', id);
    cy.isAggregationTypeSelected('Date Histogram', id);
    // set aggregation field
    cy.log('Set up aggregation field: ', field);
    cy.selectAggregationField(field, id);
    cy.isAggregationFieldSelected(field, id);
    // set Range aggregation range params
    cy.setupMinimumlInterval(interval, id);
    // update aggregation settings
    cy.updateAggregationSettings();
  }
);
