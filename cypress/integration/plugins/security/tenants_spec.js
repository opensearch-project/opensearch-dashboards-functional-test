/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SEC_TENANTS_FIXTURES_PATH,
  SEC_UI_TENANTS_PATH,
} from '../../../utils/constants';

if (Cypress.env('SECURITY_ENABLED')) {
  describe('Tenants page', () => {
    // start a server so that server responses can be mocked via fixtures
    // in all of the below test cases
    before(() => {
      cy.server();
    });

    it('should load Tenants page properly', () => {
      cy.mockTenantsAction(
        SEC_TENANTS_FIXTURES_PATH + '/tenants_info_response.json',
        () => {
          cy.visit(SEC_UI_TENANTS_PATH);
        }
      );

      cy.contains('h3', 'Tenants');

      // One of the many tenants
      cy.contains('.euiTableCellContent', 'Global');
    });

    it('should create new tenant successfully by selecting `Create tenant`', () => {
      cy.visit(SEC_UI_TENANTS_PATH);

      cy.get('button[id="createTenant"]').first().click({ force: true });

      cy.contains('button', 'Create');
      cy.contains('button', 'Cancel');
      cy.contains('.euiModalHeader__title', 'Create tenant');

      const tenantName = 'test';
      const tenantDescription = 'Test description';
      cy.get('input[data-test-subj="name-text"]').type(tenantName, {
        force: true,
      });
      cy.get('input[data-test-subj="name-text"]').should(
        'have.value',
        tenantName
      );

      cy.get('textarea[data-test-subj="tenant-description"]').type(
        tenantDescription,
        { force: true }
      );
      cy.get('textarea[data-test-subj="tenant-description"]').should(
        'have.value',
        tenantDescription
      );

      cy.mockTenantsAction(
        SEC_TENANTS_FIXTURES_PATH + '/tenants_post_creation_response.json',
        () => {
          cy.get('button[id="submit"]').first().click({ force: true });
        }
      );

      cy.url().should((url) => {
        expect(url).to.contain('/tenants');
      });

      cy.contains('h3', 'Tenants');
      // should contain the new tenant that was just created
      cy.contains('.euiTableCellContent', tenantName);
      cy.contains('span', tenantDescription);
    });
  });
}
