/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH, TIMEOUT } from '../../../utils/constants';

const REPORT_DEFINITION_API = '**/api/reporting/reportDefinitions/**';

const setupEditIntercepts = () => {
  cy.intercept('GET', REPORT_DEFINITION_API).as('getReportDefinition');

  cy.intercept('PUT', REPORT_DEFINITION_API, (req) => {
    req.headers['origin'] = BASE_PATH;
    if (
      req.body &&
      req.body.report_params &&
      req.body.report_params.core_params
    ) {
      req.body.report_params.core_params.origin = BASE_PATH;
    }
  }).as('updateReportDefinition');
};

const openEditPage = () => {
  cy.get('#reportDefinitionDetailsLink').first().click({ force: true });

  cy.get('#editReportDefinitionButton', { timeout: TIMEOUT }).should('exist');
  cy.get('#editReportDefinitionButton').click();

  cy.url().should('include', 'edit');

  cy.wait('@getReportDefinition', { timeout: TIMEOUT });

  cy.get('#reportSettingsName', { timeout: TIMEOUT })
    .should('exist')
    .and(($el) => {
      expect($el.val()).to.not.equal('');
    });
};

const clickSaveChanges = () => {
  cy.get('#editReportDefinitionButton')
    .contains('Save Changes')
    .trigger('mouseover')
    .click({ force: true });

  cy.wait('@updateReportDefinition', { timeout: TIMEOUT })
    .its('response.statusCode')
    .should('eq', 200);

  // check that re-direct to home page
  cy.get('#reportDefinitionDetailsLink', { timeout: TIMEOUT }).should('exist');
};

describe('Cypress', () => {
  beforeEach(() => {
    setupEditIntercepts();

    // Wait before visiting to allow index refresh after previous test's save
    cy.wait(5000);
    cy.visit(`${BASE_PATH}/app/reports-dashboards#/`, {
      waitForGetTenant: true,
    });
    cy.location('pathname', { timeout: TIMEOUT }).should(
      'include',
      '/reports-dashboards'
    );
    // Retry: if the list doesn't load, reload the page
    cy.get('body').then(($body) => {
      if ($body.find('#reportDefinitionDetailsLink').length === 0) {
        cy.wait(5000);
        cy.reload();
      }
    });
    cy.get('#reportDefinitionDetailsLink', { timeout: TIMEOUT }).should(
      'exist'
    );
  });

  it('Visit edit page, update name and description', () => {
    openEditPage();

    // update the report name
    cy.get('#reportSettingsName').type('{selectall}{backspace} update name');

    // update report description
    cy.get('#reportSettingsDescription').type(
      '{selectall}{backspace} update description'
    );

    clickSaveChanges();
  });

  it('Visit edit page, change report trigger', () => {
    openEditPage();

    cy.get('#reportDefinitionTriggerTypes > div:nth-child(2)').click({
      force: true,
    });

    cy.get('#Schedule').check({ force: true }).should('be.checked');

    clickSaveChanges();
  });

  it('Visit edit page, change report trigger back', () => {
    openEditPage();

    cy.get('#reportDefinitionTriggerTypes > div:nth-child(1)').click({
      force: true,
    });

    cy.get('#On\\ demand').check({ force: true }).should('be.checked');

    clickSaveChanges();
  });
});
