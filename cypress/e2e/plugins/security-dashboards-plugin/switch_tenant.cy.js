/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function switchTenantTo(newTenant) {
  cy.getElementByTestId('account-popover').click();
  cy.intercept({
    method: 'GET',
    url: '/api/v1/auth/dashboardsinfo*',
  }).as('waitForDashboardsInfo');

  cy.intercept({
    method: 'GET',
    url: '/api/v1/configuration/account*',
  }).as('waitForAccountInfo');

  cy.getElementByTestId('switch-tenants').click();

  if (['global', 'private'].includes(newTenant)) {
    cy.get('[id="' + newTenant + '"][name="tenantSwitchRadios"]').should(
      'be.enabled'
    );
    cy.get('.euiRadio__label[for="' + newTenant + '"]').click();
  } else {
    cy.get('[id="custom"][name="tenantSwitchRadios"]').should('be.enabled');

    cy.getElementByTestId('tenant-switch-modal')
      .find('[data-test-subj="comboBoxInput"]')
      .click();

    // typo in data-test-subj
    cy.getElementByTestId('comboBoxOptionsList ')
      .find(`[title="${newTenant}"]`)
      .click();
  }

  cy.intercept({
    method: 'POST',
    url: '/api/v1/multitenancy/tenant*',
  }).as('waitForUpdatingTenants');
  cy.getElementByTestId('tenant-switch-modal')
    .find('[data-test-subj="confirm"]')
    .click();

  cy.wait('@waitForUpdatingTenants');

  // Make sure dashboards has really reloaded.
  // @waitForReloadAfterTenantSwitch should be triggered twice
  cy.wait('@waitForDashboardsInfo');
  cy.wait('@waitForDashboardsInfo');
}
