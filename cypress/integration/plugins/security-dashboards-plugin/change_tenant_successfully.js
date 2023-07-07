/*

* Copyright OpenSearch Contributors

* SPDX-License-Identifier: Apache-2.0

*/

import { CURRENT_TENANT } from '../../../utils/commands';
import tenantDescription from '../../../fixtures/plugins/security-dashboards-plugin/tenants/testTenant.json';

const tenantName = 'test';

if (Cypress.env('SECURITY_ENABLED')) {
  describe('Switch tenants when visiting copyed links: ', () => {
    before(() => {
      cy.server();

      cy.createTenant(tenantName, tenantDescription);
    });
    if (Cypress.browser.name === 'chrome') {
      it('Checks that the tenant switcher can switch tenants despite a different tenant being present in the tenant query parameter.', function () {
        CURRENT_TENANT.newTenant = 'private';
        function switchTenantTo(newTenant) {
          cy.getElementByTestId('account-popover').click();
          cy.getElementByTestId('switch-tenants').click();
          cy.get('.euiRadio__label[for="' + newTenant + '"]').click();

          cy.intercept({
            method: 'GET',
            url: '/api/v1/auth/dashboardsinfo',
          }).as('waitForReloadAfterTenantSwitch');

          cy.intercept({
            method: 'POST',
            url: '/api/v1/multitenancy/tenant',
          }).as('waitForUpdatingTenants');

          cy.getElementByTestId('tenant-switch-modal')
            .find('[data-test-subj="confirm"]')
            .click();
          cy.wait('@waitForUpdatingTenants');

          // Make sure dashboards has really reloaded.
          // @waitForReloadAfterTenantSwitch should be triggered twice
          cy.wait('@waitForReloadAfterTenantSwitch');
          cy.wait('@waitForReloadAfterTenantSwitch');
        }
        cy.visit('/app/home', {
          // Clean up
          onBeforeLoad(win) {
            window.localStorage.clear();
            window.sessionStorage.clear();
          },
        }).then(() => {
          cy.waitForLoader();
          switchTenantTo('global');
          cy.waitForLoader();
          cy.getElementByTestId('account-popover').click();
          cy.get('#tenantName').should('contain.text', 'Global');
        });
      });
    }
  });
}