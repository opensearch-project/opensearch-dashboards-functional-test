/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SAVED_OBJECTS_PATH } from '../../../utils/dashboards/constants';

import { CURRENT_TENANT } from '../../../utils/commands';
import tenantDescription from '../../../fixtures/plugins/security-dashboards-plugin/tenants/testTenant';

const tenantName = 'test';

if (Cypress.env('SECURITY_ENABLED')) {
  describe('Multi Tenancy Default Tenant Tests: ', () => {
    before(() => {
      cy.server();
      cy.createTenant(tenantName, tenantDescription);
      cy.changeDefaultTenant({
        multitenancy_enabled: true,
        private_tenant_enabled: true,
        default_tenant: tenantName,
      });
    });
    it('Test Changed Default Tenant ', () => {
      CURRENT_TENANT.newTenant = null;
      cy.visit(SAVED_OBJECTS_PATH);
      cy.waitForLoader();
      cy.get('#user-icon-btn').click();
      cy.wait(1000);
      cy.get('#tenantName').contains(tenantName);
    });
  });
}
