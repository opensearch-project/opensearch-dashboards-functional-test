/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CURRENT_TENANT } from '../../../utils/commands';
import tenantDescription from '../../../fixtures/plugins/security-dashboards-plugin/tenants/testTenant.json';
import { switchTenantTo } from './switch_tenant';

const tenantName = 'tenant';

if (Cypress.env('SECURITY_ENABLED')) {
  describe('Switch tenants when visiting copied links: ', () => {
    before(() => {
      cy.server();

      cy.createTenant(tenantName, tenantDescription);
    });
    it('Checks that the tenant switcher can switch tenants despite a different tenant being present in the tenant query parameter.', function () {
      CURRENT_TENANT.newTenant = tenantName;

      cy.visit('/app/home', {
        // Clean up
        onBeforeLoad() {
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
  });
}
