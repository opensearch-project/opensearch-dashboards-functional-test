/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SECURITY_PLUGIN_PATH } from '../../../utils/dashboards/constants';

if (Cypress.env('SECURITY_ENABLED') && !Cypress.env('MULTITENANCY_ENABLED')) {
  describe('Multi Tenancy Tests: ', () => {
    before(() => {
      cy.server();
    });
    it('Test Dashboards tenancy features should not be accessible ', () => {
      // This test is to ensure tenancy related features are not accessible when opensearch_security.multitenancy.enabled is disabled in the opensearchdashboard.yaml
      cy.visit(SECURITY_PLUGIN_PATH);
      cy.waitForLoader();

      cy.get('[title="Tenants"]').should('not.exist');

      // Switch tenants button should not exist when multi-tenancy is disabled.
      cy.get('#user-icon-btn').click();
      cy.contains('button', 'Switch tenants').should('not.exist');
    });
  });
}
