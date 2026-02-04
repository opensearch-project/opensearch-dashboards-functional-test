/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH, TIMEOUT } from '../../../utils/constants';

describe('Cypress', () => {
  it('Visit edit page, update name and description', () => {
    cy.visit(`${BASE_PATH}/app/reports-dashboards#/`, {
      waitForGetTenant: true,
    });
    cy.location('pathname', { timeout: TIMEOUT }).should(
      'include',
      '/reports-dashboards'
    );

    cy.wait(12500);

    cy.intercept(
      'GET',
      `${BASE_PATH}/api/reporting/getReportSource/dashboard`
    ).as('dashboard');

    cy.intercept(
      'GET',
      `${BASE_PATH}/api/reporting/getReportSource/visualization`
    ).as('visualization');

    cy.intercept('GET', `${BASE_PATH}/api/reporting/getReportSource/search`).as(
      'search'
    );

    cy.intercept('GET', `${BASE_PATH}/api/observability/notebooks/savedNotebook`).as(
      'notebook'
    );

    cy.get('#reportDefinitionDetailsLink').first().click({ force: true });

    cy.get('#editReportDefinitionButton').should('exist');

    cy.get('#editReportDefinitionButton').click();

    cy.url().should('include', 'edit');

    cy.wait(1000);
    cy.wait('@dashboard');
    cy.wait('@visualization');
    cy.wait('@search');
    cy.wait('@notebook');

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

    cy.wait(12500);

    // check that re-direct to home page
    cy.get('#reportDefinitionDetailsLink').should('exist');
  });

  it('Visit edit page, change report trigger', () => {
    cy.visit(`${BASE_PATH}/app/reports-dashboards#/`, {
      waitForGetTenant: true,
    });
    cy.location('pathname', { timeout: TIMEOUT }).should(
      'include',
      '/reports-dashboards'
    );

    cy.wait(12500);

    cy.intercept(
      'GET',
      `${BASE_PATH}/api/reporting/getReportSource/dashboard`
    ).as('dashboard');

    cy.intercept(
      'GET',
      `${BASE_PATH}/api/reporting/getReportSource/visualization`
    ).as('visualization');

    cy.intercept('GET', `${BASE_PATH}/api/reporting/getReportSource/search`).as(
      'search'
    );

    cy.intercept('GET', `${BASE_PATH}/api/observability/notebooks/savedNotebook`).as('notebook');

    cy.get('#reportDefinitionDetailsLink').first().click();

    cy.get('#editReportDefinitionButton').should('exist');

    cy.get('#editReportDefinitionButton').click();

    cy.url().should('include', 'edit');

    cy.wait(1000);

    cy.wait('@dashboard');
    cy.wait('@visualization');
    cy.wait('@search');
    cy.wait('@notebook');
    cy.get('#reportDefinitionTriggerTypes > div:nth-child(2)').click({
      force: true,
    });

    cy.get('#Schedule').check({ force: true });
    cy.get('#editReportDefinitionButton')
      .contains('Save Changes')
      .trigger('mouseover')
      .click({ force: true });

    cy.wait(12500);

    // check that re-direct to home page
    cy.get('#reportDefinitionDetailsLink').should('exist');
  });

  it('Visit edit page, change report trigger back', () => {
    cy.visit(`${BASE_PATH}/app/reports-dashboards#/`, {
      waitForGetTenant: true,
    });
    cy.location('pathname', { timeout: TIMEOUT }).should(
      'include',
      '/reports-dashboards'
    );

    cy.wait(12500);

    cy.intercept(
      'GET',
      `${BASE_PATH}/api/reporting/getReportSource/dashboard`
    ).as('dashboard');

    cy.intercept(
      'GET',
      `${BASE_PATH}/api/reporting/getReportSource/visualization`
    ).as('visualization');

    cy.intercept('GET', `${BASE_PATH}/api/reporting/getReportSource/search`).as(
      'search'
    );

    cy.intercept('GET', `${BASE_PATH}/api/observability/notebooks/savedNotebook`).as(
      'notebook'
    );

    cy.get('#reportDefinitionDetailsLink').first().click();

    cy.get('#editReportDefinitionButton').should('exist');

    cy.get('#editReportDefinitionButton').click();

    cy.url().should('include', 'edit');

    cy.wait(1000);

    cy.wait('@dashboard');
    cy.wait('@visualization');
    cy.wait('@search');
    cy.wait('@notebook');

    cy.get('#reportDefinitionTriggerTypes > div:nth-child(1)').click({
      force: true,
    });

    cy.get('#editReportDefinitionButton')
      .contains('Save Changes')
      .trigger('mouseover')
      .click({ force: true });

    cy.wait(12500);

    // check that re-direct to home page
    cy.get('#reportDefinitionDetailsLink').should('exist');
  });
});
