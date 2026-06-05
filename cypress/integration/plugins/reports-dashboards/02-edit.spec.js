/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH, TIMEOUT } from '../../../utils/constants';

// The reportsDashboards backend reads `report_params.core_params.origin` from
// the HTTP `Origin` header, which Chromium does not always send for same-origin
// fetch (e.g. PUT). When the header is absent, validation fails with
// `[report_params.core_params.origin]: expected value of type [string] but got
// [undefined]` and the request returns 400. Use `cy.intercept` to inject the
// `origin` field into the PUT body.
const setupOriginIntercept = () => {
  cy.intercept('PUT', '/api/reporting/reportDefinitions/*', (req) => {
    let body = req.body;
    let wasString = false;
    if (typeof body === 'string') {
      wasString = true;
      try {
        body = JSON.parse(body);
      } catch (e) {
        return;
      }
    }
    if (
      body &&
      body.report_params &&
      body.report_params.core_params &&
      !body.report_params.core_params.origin
    ) {
      body.report_params.core_params.origin =
        BASE_PATH || 'http://localhost:5601';
    }
    req.body = wasString ? JSON.stringify(body) : body;
  }).as('updateReportDefinition');
};

const setupReportSourceIntercepts = () => {
  cy.intercept('GET', '**/api/reporting/getReportSource/dashboard').as(
    'getDashboard'
  );
  cy.intercept('GET', '**/api/reporting/getReportSource/visualization').as(
    'getVisualization'
  );
  cy.intercept('GET', '**/api/reporting/getReportSource/search').as(
    'getSearch'
  );
};

const openEditPage = () => {
  cy.get('#reportDefinitionDetailsLink', { timeout: TIMEOUT })
    .first()
    .click({ force: true });
  cy.get('#editReportDefinitionButton', { timeout: TIMEOUT })
    .should('exist')
    .click();
  cy.url().should('include', 'edit');
  // Wait for the edit form to load report sources before interacting
  cy.wait(['@getDashboard', '@getVisualization', '@getSearch'], {
    timeout: TIMEOUT,
  });
  cy.get('#reportSettingsName', { timeout: TIMEOUT }).should('be.visible');
};

const clickSaveChanges = () => {
  cy.get('#editReportDefinitionButton')
    .contains('Save Changes')
    .trigger('mouseover')
    .click({ force: true });
  cy.wait('@updateReportDefinition', { timeout: TIMEOUT })
    .its('response.statusCode')
    .should('eq', 200);
};

describe('Cypress', () => {
  beforeEach(() => {
    setupOriginIntercept();
    setupReportSourceIntercepts();
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

    // check that re-direct to home page
    cy.get('#reportDefinitionDetailsLink', { timeout: TIMEOUT }).should(
      'exist'
    );
  });

  it('Visit edit page, change report trigger', () => {
    openEditPage();

    cy.get('#Schedule').check({ force: true });
    cy.get('#Schedule').should('be.checked');

    clickSaveChanges();

    // check that re-direct to home page
    cy.get('#reportDefinitionDetailsLink', { timeout: TIMEOUT }).should(
      'exist'
    );
  });

  it('Visit edit page, change report trigger back', () => {
    openEditPage();

    cy.get('#On\\ demand').check({ force: true });
    cy.get('#On\\ demand').should('be.checked');

    clickSaveChanges();

    // check that re-direct to home page
    cy.get('#reportDefinitionDetailsLink', { timeout: TIMEOUT }).should(
      'exist'
    );
  });
});
