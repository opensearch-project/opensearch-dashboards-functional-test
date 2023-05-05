/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TENANTS_MANAGE_PATH } from '../../../utils/dashboards/constants';

if (Cypress.env('SECURITY_ENABLED')) {
  describe('Multi Tenancy Tests: ', () => {
    before(() => {
      cy.server();
    });
    it('Test Dashboards tenancy features should not be accessible ', () => {
      // This test is to ensure tenancy related features are not accessible when opensearch_security.multitenancy.enabled is disabled in the opensearchdashboard.yaml
      cy.visit(TENANTS_MANAGE_PATH);
      cy.waitForLoader();

      cy.contains('You have not enabled multi tenancy').should('exist');

      // Switch tenants button should not exist when multi-tenancy is disabled.
      cy.get('#user-icon-btn').click();
      cy.contains('button', 'Switch tenants').should('not.exist');
    });
  });
}
