/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * Terms Aggregation
 */

Cypress.Commands.add('tbToggleOtherBucket', (request) => {
  expect(request).to.be.oneOf(['true', 'false']);
  cy.getElementByTestId('otherBucketSwitch')
    .invoke('attr', 'aria-checked')
    .then((state) => {
      if (state !== request) {
        cy.getElementByTestId('otherBucketSwitch').click();
      }
    });
});

Cypress.Commands.add('tbToggleMissingBucket', (request) => {
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
Cypress.Commands.add('tbSetTermsSize', (size, id) => {
  const opts = { log: false };
  cy.getElementByTestId(`visEditorAggAccordion${id}`)
    .find('[data-test-subj="sizeParamEditor"]')
    .click(opts)
    .clear(opts)
    .type(size);
});

// sort is a aggregation param for Terms Aggregation
// it is a direction param which sort the term column in ascending or descending
Cypress.Commands.add('tbSetTermsSort', (sort, id) => {
  expect(['Ascending', 'Descending']).to.contain(sort);
  cy.getElementByTestId(`visEditorAggAccordion${id}`)
    .find('[class="visEditorAggParam--half visEditorAggParam--half-order"]')
    .find('[class="euiSelect euiSelect--fullWidth euiSelect--compressed"]')
    .select(sort);
});

Cypress.Commands.add('tbSetupTermsAggregation', (field, sort, size, id) => {
  cy.log('Set up Buckets Aggregation');
  cy.log('Set up aggregation type Terms');
  // set aggregation type to `Terms`
  cy.tbSelectAggregationType('Terms', id);
  cy.tbIsAggregationTypeSelected('Terms', id);
  // set aggregation field
  cy.log('Set up aggregation field: ', field);
  cy.tbSelectAggregationField(field, id);
  cy.tbIsAggregationFieldSelected(field, id);
  // set Terms aggregation unique params
  cy.tbSetTermsSort(sort, id);
  cy.tbSetTermsSize(size, id);
  cy.tbUpdateAggregationSettings();
  cy.tbIsUpdateAggregationSettingsDisabled();
});

/*
 * Histogram Aggregation
 */

// interval is a aggregation param for Histogram Aggregation
// it is the width of each bucket
Cypress.Commands.add('tbEnableHistogramInterval', (id) => {
  cy.getElementByTestId(`visEditorIntervalSwitch${id}`)
    .invoke('attr', 'aria-checked')
    .should('eq', 'true');
  cy.getElementByTestId(`visEditorIntervalSwitch${id}`).click();
});

Cypress.Commands.add('tbSetHistogramInterval', (interval, id) => {
  const opts = { log: false };
  cy.getElementByTestId(`visEditorInterval${id}`)
    .click(opts)
    .clear(opts)
    .type(interval);
});

Cypress.Commands.add('tbIsHistogramIntervalSet', (interval, id) => {
  cy.getElementByTestId(`visEditorAggAccordion${id}`)
    .find(`[data-test-subj="visEditorInterval${id}"]`)
    .invoke('attr', 'value')
    .should('eq', interval);
});

Cypress.Commands.add('tbSetupHistogramAggregation', (field, interval, id) => {
  cy.log('Set up Buckets Aggregation');
  cy.log('Set up aggregation type Histogram');
  // set aggregation type to `Histogram`
  cy.tbSelectAggregationType('Histogram', id);
  cy.tbIsAggregationTypeSelected('Histogram', id);
  // set aggregation field
  cy.log('Set up aggregation field: ', field);
  cy.tbSelectAggregationField(field, id);
  cy.tbIsAggregationFieldSelected(field, id);
  // set Histogram aggregation interval params
  if (interval) {
    cy.tbEnableHistogramInterval(id);
    cy.tbSetHistogramInterval(interval, id);
  }
  // update aggregation settings
  cy.tbUpdateAggregationSettings();
  cy.tbIsHistogramIntervalSet(interval, id);
});

/*
 * Range Aggregation
 */

Cypress.Commands.add('tbAddRange', () => {
  cy.getElementByTestId('range__addRangeButton').click();
});

Cypress.Commands.add('tbSetupRange', (range, id) => {
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
      cy.tbAddRange();
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

Cypress.Commands.add('tbSetupRangeAggregation', (field, range, id) => {
  cy.log('Set up Buckets Aggregation');
  cy.log('Set up aggregation type Range');
  // set aggregation type to `Range`
  cy.tbSelectAggregationType('Range', id);
  cy.tbIsAggregationTypeSelected('Range', id);
  // set aggregation field
  cy.log('Set up aggregation field: ', field);
  cy.tbSelectAggregationField(field, id);
  cy.tbIsAggregationFieldSelected(field, id);
  // set Range aggregation range params
  cy.tbSetupRange(range, id);
  // update aggregation settings
  cy.tbUpdateAggregationSettings();
});

/*
 * Date Histogram Aggregation
 */
Cypress.Commands.add('tbSetupMinimumlInterval', (interval, id) => {
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
  'tbSetupDateHistogramAggregation',
  (field, interval, id) => {
    cy.log('Set up Buckets Aggregation');
    cy.log('Set up aggregation type Date Histogram');
    // set aggregation type to `Range`
    cy.tbSelectAggregationType('Date Histogram', id);
    cy.tbIsAggregationTypeSelected('Date Histogram', id);
    // set aggregation field
    cy.log('Set up aggregation field: ', field);
    cy.tbSelectAggregationField(field, id);
    cy.tbIsAggregationFieldSelected(field, id);
    // set Range aggregation range params
    cy.tbSetupMinimumlInterval(interval, id);
    // update aggregation settings
    cy.tbUpdateAggregationSettings();
  }
);
