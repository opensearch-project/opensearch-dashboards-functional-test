/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function switchTenantTo(newTenant) {
  cy.getElementByTestId('account-popover').click();
  cy.getElementByTestId('switch-tenants').click();
  cy.intercept({
    method: 'GET',
        url: '/api/v1/auth/dashboardsinfo',
  }).as('waitForReloadAfterTenantSwitch');

  cy.intercept({
    method: 'POST',
    url: '/api/v1/multitenancy/tenant',
  }).as('waitForUpdatingTenants');

  cy.wait(2000);
  cy.get('.euiRadio__label[for="' + newTenant + '"]').click();

  cy.getElementByTestId('tenant-switch-modal')
      .find('[data-test-subj="confirm"]')
      .click();
  cy.wait('@waitForUpdatingTenants');

  // Make sure dashboards has really reloaded.
  // @waitForReloadAfterTenantSwitch should be triggered twice
  cy.wait('@waitForReloadAfterTenantSwitch');
  cy.wait('@waitForReloadAfterTenantSwitch');
}
  