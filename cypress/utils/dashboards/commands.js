/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './vis_builder/commands';
import './vis_type_table/commands';
import './vis-augmenter/commands';

Cypress.Commands.add('waitForLoader', () => {
  const opts = { log: false };

  Cypress.log({
    name: 'waitForPageLoad',
    displayName: 'wait',
    message: 'page load',
  });

  cy.getElementByTestId('homeIcon', opts); // Update to `homeLoader` once useExpandedHeader is enabled
});

Cypress.Commands.add('setTopNavQuery', (value, submit = true) => {
  const opts = { log: false };

  Cypress.log({
    name: 'setTopNavQuery',
    displayName: 'set query',
    message: value,
  });

  cy.getElementByTestId('queryInput', opts)
    .clear(opts)
    .type(value, opts)
    .blur(opts);

  if (submit) {
    cy.updateTopNav(opts);
  }
});

Cypress.Commands.add('setTopNavDate', (start, end, submit = true) => {
  const opts = { log: false };

  Cypress.log({
    name: 'setTopNavDate',
    displayName: 'set date',
    message: `Start: ${start} :: End: ${end}`,
  });

  // Click date picker
  cy.getElementByTestId('superDatePickerShowDatesButton', opts).click(opts);

  // Click start date
  cy.getElementByTestId('superDatePickerstartDatePopoverButton', opts).click(
    opts
  );

  // Click absolute tab
  cy.getElementByTestId('superDatePickerAbsoluteTab', opts).click(opts);

  // Type absolute start date
  cy.getElementByTestId('superDatePickerAbsoluteDateInput', opts)
    .click(opts)
    .clear(opts)
    .type(start, opts);

  // Click end date
  cy.getElementByTestId('superDatePickerendDatePopoverButton', opts)
    .last(opts)
    .click(opts);

  // Click absolute tab
  cy.getElementByTestId('superDatePickerAbsoluteTab', opts)
    .last(opts)
    .click(opts);

  // Type absolute end date
  cy.getElementByTestId('superDatePickerAbsoluteDateInput', opts)
    .last(opts)
    .click(opts)
    .clear(opts)
    .type(end, opts);

  // Close popup
  cy.getElementByTestId('superDatePickerendDatePopoverButton', opts).click(
    opts
  );

  if (submit) {
    cy.updateTopNav(opts);
  }
});

Cypress.Commands.add('updateTopNav', (options) => {
  cy.getElementByTestId('querySubmitButton', options).click(options);
});
