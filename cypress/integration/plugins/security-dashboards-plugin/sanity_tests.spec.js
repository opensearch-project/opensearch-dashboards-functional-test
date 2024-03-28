/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BASE_PATH,
  SEC_UI_TENANTS_PATH,
  SEC_TENANTS_FIXTURES_PATH,
  SEC_INTERNALUSERS_FIXTURES_PATH,
  SEC_API_INTERNAL_USERS_PATH,
} from '../../../utils/constants';

if (Cypress.env('SECURITY_ENABLED')) {
  describe('OpenSearch Dashboards Security Plugin - Enhanced Sanity Tests', () => {
    const username = 'test';
    const password = 'ew4q56a4d6as51!*asSS';
    const roleName = 'newRole';
    const tenantName = 'yourTenantName'; // Replace with your tenant name
    const tenantDescription = 'Test description';

    const indexPattern = 'opensearch_dashboards_sample_data_flight';
    const documentLevelSecurityQuery = '{{}"match": {{}"FlightDelay": true}}';

    it('should create new tenant successfully by selecting `Create tenant`', () => {
      cy.visit(SEC_UI_TENANTS_PATH);

      cy.get('button[id="createTenant"]').first().click({ force: true });

      cy.contains('button', 'Create');
      cy.contains('button', 'Cancel');
      cy.contains('.euiModalHeader__title', 'Create tenant');

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

    it('should create a new internal user', () => {
      // Navigate to Security/Internal User Database section

      cy.visit(`${BASE_PATH}/app/security-dashboards-plugin#/users`);
      cy.intercept(SEC_API_INTERNAL_USERS_PATH, {
        fixture:
          SEC_INTERNALUSERS_FIXTURES_PATH + '/internalusers_info_response.json',
      }).as('listUserResponse');
      cy.wait('@listUserResponse');
      cy.get('a[href="#/users/create"]').click({
        force: true,
      });
      // Provide username and password for the new user
      cy.get('input[data-test-subj="name-text"]').type(username);
      cy.get('input[data-test-subj="password"]').type(password);
      cy.get('input[data-test-subj="re-enter-password"]').type(password);

      // Submit the form to create the user
      cy.get('button').contains('Create').click();

      cy.intercept(SEC_API_INTERNAL_USERS_PATH, {
        fixture:
          SEC_INTERNALUSERS_FIXTURES_PATH +
          '/internalusers_response_post_new_user_creation.json',
      }).as('createUserResponse');
      cy.contains(username).should('exist');
    });

    it('should create a new role with specific permissions', () => {
      // Add sample data if it hasn't been added yet
      cy.visit(`${BASE_PATH}/app/home#/tutorial_directory/sampleData`, {
        retryOnStatusCodeFailure: true,
      });

      cy.loadSampleData('flights');
      // Navigate to Security/Roles section
      cy.visit(`${BASE_PATH}/app/security-dashboards-plugin#/roles/create`);

      // Click on 'Add new role' button
      // Set role name
      cy.get('input[data-test-subj="name-text"]').type(roleName);

      // Add Cluster Permissions
      cy.get('input[data-test-subj="comboBoxSearchInput"]')
        .eq(0)
        .type('indices:data/read/msearch')
        .type('{downArrow}{enter}');

      cy.get('input[data-test-subj="comboBoxSearchInput"]')
        .eq(2)
        .type('indices:data/read/search*')
        .type('{downArrow}{enter}');

      cy.get('#index-input-box').type(
        'opensearch_dashboards_sample_data_flights*'
      );

      // Set Document Level Security Query
      cy.get('textarea').type(documentLevelSecurityQuery);

      // Anonymize fields
      cy.get('input[data-test-subj="comboBoxSearchInput"][role="textbox"]')
        .eq(4)
        .type('FlightNum');

      // Add Tenant Permissions
      cy.get('input[id="roles-tenant-permission-box"]')
        .type(tenantName)
        .type('{enter}');

      // Save Role Definition
      cy.get('button').contains('Create').click();

      // Verify that the role is created
      cy.contains(roleName).should('exist');
    });

    it('should add a new role mapping', () => {
      // Navigate to Role Mappings
      cy.visit(
        `${BASE_PATH}/app/security-dashboards-plugin#/roles/edit/${roleName}/mapuser`
      );

      cy.get('div[data-test-subj="comboBoxInput"]').type(username);
      cy.get('button[id="map"]').click();
    });

    it('should create a new index pattern', () => {
      cy.visit(`${BASE_PATH}/app/home?security_tenant=${tenantName}`);
      cy.visit(`${BASE_PATH}/app/home#/tutorial_directory/sampleData`, {
        retryOnStatusCodeFailure: true,
      });
      cy.loadSampleData('flights');
      // Step 3: Navigate to Manage data to add an index pattern
      cy.visit(`${BASE_PATH}/app/home`);
      cy.get('button[aria-label="Closes this modal window"]').click();
      cy.get('a').contains('Manage').click(); // Adjust the selector as needed

      // Step 4: Add the index pattern
      cy.get('[data-test-subj="indexPatterns"]').click();
      cy.get('[data-test-subj="createIndexPatternButton"]').click();
      cy.get('input[data-test-subj="createIndexPatternNameInput"]').type(
        indexPattern
      );
      cy.get(
        'button[data-test-subj="createIndexPatternGoToStep2Button"]'
      ).click();

      // Assuming a timestamp field needs to be selected
      cy.get(
        'select[data-test-subj="createIndexPatternTimeFieldSelect"]'
      ).select('timestamp');

      cy.get('option[value="timestamp"]');
      cy.get('button[data-test-subj="createIndexPatternButton"]').click();
      cy.visit(
        `${BASE_PATH}/app/management/opensearch-dashboards/indexPatterns/patterns`
      );
      cy.contains(indexPattern);
    });
  });
}
