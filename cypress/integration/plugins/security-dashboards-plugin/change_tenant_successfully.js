/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CURRENT_TENANT } from '../../../utils/commands';
import { switchTenantTo } from './switch_tenant';

if (Cypress.env('SECURITY_ENABLED')) {
  describe('Switch tenants when visiting copied links: ', () => {
    const tenantName = 'private';

    before(() => {
      cy.server();
    });
    it('Checks that the tenant switcher can switch tenants despite a different tenant being present in the tenant query parameter.', function () {
      CURRENT_TENANT.newTenant = tenantName;

      cy.visit('/app/home').then(() => {
        cy.waitForLoader();
        switchTenantTo('global');
        cy.waitForLoader();
        cy.getElementByTestId('account-popover').click();
        cy.get('#tenantName').should('contain.text', 'Global');
      });
    });
  });
}
