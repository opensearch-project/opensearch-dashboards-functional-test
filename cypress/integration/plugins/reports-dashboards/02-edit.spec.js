/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH, TIMEOUT } from '../../../utils/constants';

function waitForReportDefinitions(retries = 5) {
  cy.visit(`${BASE_PATH}/app/reports-dashboards#/`, {
    waitForGetTenant: true,
  });
  cy.location('pathname', { timeout: TIMEOUT }).should(
    'include',
    '/reports-dashboards'
  );
  cy.wait(5000);
  cy.get('body').then(($body) => {
    if (
      $body.find('#reportDefinitionDetailsLink').length === 0 &&
      retries > 0
    ) {
      cy.wait(10000);
      waitForReportDefinitions(retries - 1);
    }
  });
  cy.get('#reportDefinitionDetailsLink', { timeout: TIMEOUT }).should('exist');
}

describe('Cypress', () => {
  beforeEach(() => {
    waitForReportDefinitions();
  });

  it('Visit edit page, update name and description', () => {
    cy.get('#reportDefinitionDetailsLink').first().click({ force: true });

    cy.get('#editReportDefinitionButton').should('exist');
    cy.get('#editReportDefinitionButton').click();

    cy.url().should('include', 'edit');

    // update the report name
    cy.get('#reportSettingsName').type('{selectall}{backspace} update name');

    // update report description
    cy.get('#reportSettingsDescription').type(
      '{selectall}{backspace} update description'
    );

    cy.get('#editReportDefinitionButton')
      .contains('Save Changes')
      .trigger('mouseover')
      .click({ force: true });

    // check that re-direct to home page
    cy.get('#reportDefinitionDetailsLink', { timeout: TIMEOUT }).should(
      'exist'
    );
  });

  it('Visit edit page, change report trigger', () => {
    cy.get('#reportDefinitionDetailsLink').first().click();

    cy.get('#editReportDefinitionButton').should('exist');
    cy.get('#editReportDefinitionButton').click();

    cy.url().should('include', 'edit');

    cy.get('#reportDefinitionTriggerTypes > div:nth-child(2)').click({
      force: true,
    });

    cy.get('#Schedule').check({ force: true });
    cy.get('#editReportDefinitionButton')
      .contains('Save Changes')
      .trigger('mouseover')
      .click({ force: true });

    // check that re-direct to home page
    cy.get('#reportDefinitionDetailsLink', { timeout: TIMEOUT }).should(
      'exist'
    );
  });

  it('Visit edit page, change report trigger back', () => {
    cy.get('#reportDefinitionDetailsLink').first().click();

    cy.get('#editReportDefinitionButton').should('exist');
    cy.get('#editReportDefinitionButton').click();

    cy.url().should('include', 'edit');

    cy.get('#reportDefinitionTriggerTypes > div:nth-child(1)').click({
      force: true,
    });

    cy.get('#editReportDefinitionButton')
      .contains('Save Changes')
      .trigger('mouseover')
      .click({ force: true });

    // check that re-direct to home page
    cy.get('#reportDefinitionDetailsLink', { timeout: TIMEOUT }).should(
      'exist'
    );
  });
});
