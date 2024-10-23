/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './vis_builder/commands';
import './vis_type_timeline/commands';
import './vis_type_table/commands';
import './vis_type_vega/commands';
import './vis-augmenter/commands';
import './data_explorer/commands';
import moment from 'moment';

Cypress.Commands.add('waitForLoader', (isEnhancement = false) => {
  const opts = { log: false };

  Cypress.log({
    name: 'waitForPageLoad',
    displayName: 'wait',
    message: 'page load',
  });

  cy.wait(Cypress.env('WAIT_FOR_LOADER_BUFFER_MS'));

  // Use recentItemsSectionButton for query enhancement, otherwise use homeIcon
  cy.getElementByTestId(
    isEnhancement ? 'recentItemsSectionButton' : 'homeIcon',
    opts
  );
});

Cypress.Commands.add(
  'setTopNavQuery',
  (value, submit = true, isEnhancement = false) => {
    const opts = { log: false };

    Cypress.log({
      name: 'setTopNavQuery',
      displayName: 'set query',
      message: value,
    });

    const selector = isEnhancement
      ? '.osdQueryEditor__input .monaco-editor .inputarea' // find by class
      : '[data-test-subj="queryInput"]';

    Cypress.log({ message: `isEnhancement is ${isEnhancement}` });
    Cypress.log({ message: `selector is ${selector}` });

    cy.get(selector, opts).clear(opts).type(value, opts).blur(opts);

    if (submit) {
      cy.updateTopNav(opts);
    }
  }
);

Cypress.Commands.add('setTopNavDate', (start, end, submit = true) => {
  const opts = { log: false };

  Cypress.log({
    name: 'setTopNavDate',
    displayName: 'set date',
    message: `Start: ${start} :: End: ${end}`,
  });

  /* Find any one of the two buttons that change/open the date picker:
   *   * if `superDatePickerShowDatesButton` is found, it will switch the mode to dates
   *      * in some versions of OUI, the switch will open the date selection dialog as well
   *   * if `superDatePickerstartDatePopoverButton` is found, it will open the date selection dialog
   */
  cy.getElementsByTestIds(
    ['superDatePickerstartDatePopoverButton', 'superDatePickerShowDatesButton'],
    opts
  )
    .should('be.visible')
    .invoke('attr', 'data-test-subj')
    .then((testId) => {
      cy.getElementByTestId(testId, opts).should('be.visible').click(opts);
    });

  /* While we surely are in the date selection mode, we don't know if the date selection dialog
   * is open or not. Looking for a tab and if it is missing, click on the dialog opener.
   */
  cy.whenTestIdNotFound('superDatePickerAbsoluteTab', () => {
    cy.getElementByTestId('superDatePickerstartDatePopoverButton', opts)
      .should('be.visible')
      .click(opts);
  });

  // Click absolute tab
  cy.getElementByTestId('superDatePickerAbsoluteTab', opts).click(opts);

  // Type absolute start date
  cy.getElementByTestId('superDatePickerAbsoluteDateInput', opts)
    .click(opts)
    .clear(opts)
    .type(start, {
      ...opts,
      delay: 0, // add a delay here, cypress sometimes fails to type all the content into the input.
    });

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
    .type(end, {
      ...opts,
      delay: 0, // add a delay here, cypress sometimes fails to type all the content into the input.
    });

  // Close popup
  cy.getElementByTestId('superDatePickerendDatePopoverButton', opts).click(
    opts
  );

  if (submit) {
    cy.updateTopNav(opts);
  }
});

Cypress.Commands.add(
  'setTopNavDateWithRetry',
  (start, end, isEnhancement = false) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000;

    const parseDateString = (dateStr) => {
      // Remove any trailing milliseconds if present (e.g., .000)
      const cleanStr = dateStr.replace(/\.\d{3}$/, '');
      return moment(cleanStr, 'MMM DD, YYYY @ HH:mm:ss');
    };

    const areDatesEqual = (date1Str, date2Str) => {
      const date1 = parseDateString(date1Str);
      const date2 = parseDateString(date2Str);
      return date1.isSame(date2);
    };

    const verifyDates = () => {
      return cy
        .get('[data-test-subj="superDatePickerstartDatePopoverButton"]')
        .should('be.visible')
        .invoke('text')
        .then((startText) => {
          return cy
            .get('[data-test-subj="superDatePickerendDatePopoverButton"]')
            .should('be.visible')
            .invoke('text')
            .then((endText) => {
              const startDateCorrect = areDatesEqual(startText.trim(), start);
              const endDateCorrect = areDatesEqual(endText.trim(), end);
              return { startDateCorrect, endDateCorrect };
            });
        });
    };

    const attemptSetDates = (attempt = 1) => {
      cy.log(`Attempt ${attempt} of ${MAX_RETRIES} to set dates`);

      return cy
        .setTopNavDate(start, end)
        .then(() => {
          cy.waitForLoader(isEnhancement);
        })
        .then(() => verifyDates())
        .then(({ startDateCorrect, endDateCorrect }) => {
          if (!startDateCorrect || !endDateCorrect) {
            if (attempt < MAX_RETRIES) {
              cy.wait(RETRY_DELAY);
              return attemptSetDates(attempt + 1);
            } else {
              throw new Error(
                `Failed to set dates correctly after ${MAX_RETRIES} attempts`
              );
            }
          }
        });
    };

    return attemptSetDates();
  }
);

Cypress.Commands.add('updateTopNav', (options) => {
  cy.getElementByTestId('querySubmitButton', options).click({ force: true });
});
