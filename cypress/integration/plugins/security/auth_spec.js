/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SEC_UI_AUTH_PATH,
  SEC_FIXTURES_BASE_PATH,
  BASE_PATH,
} from '../../../utils/constants';

import '../../../utils/commands';
import '../../../utils/dashboards/commands';
import '../../../utils/dashboards/datasource-management-dashboards-plugin/commands';
import '../../../utils/plugins/index-management-dashboards-plugin/commands';
import '../../../utils/plugins/anomaly-detection-dashboards-plugin/commands';
import '../../../utils/plugins/security/commands';
import '../../../utils/plugins/security-dashboards-plugin/commands';
import '../../../utils/plugins/alerting-dashboards-plugin/commands';
import '../../../utils/plugins/ml-commons-dashboards/commands';
import '../../../utils/plugins/security-analytics-dashboards-plugin/commands';
import '../../../utils/plugins/notifications-dashboards/commands';

import 'cypress-real-events';
import { switchTenantTo } from '../security-dashboards-plugin/switch_tenant';

if (Cypress.env('SECURITY_ENABLED')) {
  describe('OpenSearch Dashboards Security Plugin - Enhanced Sanity Tests', () => {
    const username = 'newuser';
    const password = 'ew4q56a4d6as51!*asSS';
    const roleName = 'newRole';
    const tenantName = 'yourTenantName'; // Replace with your tenant name

    beforeEach(() => {
      // Visit the OpenSearch Dashboards login page
      // cy.visit(SEC_UI_AUTH_PATH);
      // Login as admin
      // cy.get('input[name="username"]').type(Cypress.env('username'));
      // cy.get('input[name="password"]').type(Cypress.env('password'), { log: false });
      // cy.get('button[type="submit"]').click();
      // Wait for the OpenSearch Dashboards home page to load
      // cy.contains('Welcome to OpenSearch Dashboards', { timeout: 12000 }).should('be.visible');
    });

    it('should create a new internal user', () => {
      // Navigate to Security/Internal User Database section
      cy.visit('/app/security-dashboards-plugin#/users');

      // Click on 'Add internal user' button
      // cy.get('button').contains('Create internal user').click();
      cy.get('a[href="#/users/create"]').click({
        force: true,
      });
      // Provide username and password for the new user
      cy.get('input[data-test-subj="name-text"]').type(username);
      cy.get('input[data-test-subj="password"]').type(password);
      cy.get('input[data-test-subj="re-enter-password"]').type(password);

      // Optionally add backend role and user attribute
      // Skipping as per the instruction [No backend role]

      // Submit the form to create the user
      cy.get('button').contains('Create').click();

      // Verify that the user is created
      cy.contains(username).should('exist');
    });
    // it('should create a new role with specific permissions', () => {

    it('should create a new role with specific permissions', () => {
      // Add sample data if it hasn't been added yet
      cy.visit(`${BASE_PATH}/app/home#/tutorial_directory/sampleData`, {
        retryOnStatusCodeFailure: true,
      });

      cy.get('body').then(($body) => {
        if (
          $body.find('[data-test-subj="addSampleDataSetflights"]').length > 0
        ) {
          // If the element exists, click on it
          cy.get('[data-test-subj="addSampleDataSetflights"]').click();
        } else {
          // The element does not exist, you can log a message or take other actions
          cy.get('[data-test-subj="launchSampleDataSetflights"]').click();
        }
      });

      // Navigate to Security/Roles section
      cy.visit('/app/security-dashboards-plugin#/roles/create');

      // Click on 'Add new role' button
      // Set role name
      cy.get('input[data-test-subj="name-text"]').type(roleName);

      // Add Cluster Permissions
      cy.get('input[data-test-subj="comboBoxSearchInput"]')
        .eq(0)
        .type('indices:data/read/msearch')
        .type('{downArrow}{enter}');

      cy.get('#index-input-box').type(
        'opensearch_dashboards_sample_data_flights*'
      );

      // Set Document Level Security Query
      cy.get('textarea').type('{{}"match": {{}"FlightDelay": true}}');

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

      //TODO checkTenantText exist
      //TODO checkClusterPermisio exist
      //TODO checkIndexPermissionText exist
    });

    it('should add a new role mapping', () => {
      // Navigate to Role Mappings
      cy.visit(
        'http://localhost:5601/app/security-dashboards-plugin#/users/edit/' +
          username
      );

      // Choose the role you created earlier
      cy.get('[placeholder="Type in backend role"]').type(roleName); //Not iDeal use placeholder

      // Submit the role mapping
      cy.get('button[id="submit"]').click();

      // Optional: Verify that the role mapping was added
      // This can include checking for a success message or verifying the list of role mappings
    });

    it.only('should create a new index pattern', () => {
      cy.visit('http://localhost:5601/app/home?security_tenant=' + tenantName);
      // Step 1: Change tenant to the newly created tenant  user-icon-btn

      // cy.get('body').then(($body) => {
      //   if ($body.find('[data-test-subj="tenant-switch-modal"]').length == 0) {
      //     cy.get('[id="user-icon-btn"]').click({ force: true });
      //     cy.get('button[data-test-subj="switch-tenants"]').click();
      //
      //     // If the element exists, click on it
      //     cy.get('[data-test-subj="addSampleDataSetflights"]').click();
      //   } else {
      //     // The element does not exist, you can log a message or take other actions
      //     cy.log('POTATO');
      //   }
      // });

      // cy.get('button[data-test-subj="switch-tenants"]').click();
      // cy.get('button[title="${tenantName}"]').click();
      // cy.get('button[data-test-subj="confirm"]').click();

      cy.visit(`${BASE_PATH}/app/home#/tutorial_directory/sampleData`, {
        retryOnStatusCodeFailure: true,
      });

      cy.get('body').then(($body) => {
        if (
          $body.find('[data-test-subj="addSampleDataSetflights"]').length > 0
        ) {
          // If the element exists, click on it
          cy.get('[data-test-subj="addSampleDataSetflights"]').click();
        } else {
          // The element does not exist, you can log a message or take other actions
          cy.get('[data-test-subj="launchSampleDataSetflights"]').click();
        }
      });

      // Step 3: Navigate to Manage data to add an index pattern
      cy.visit('/app/home');
      cy.get('button[aria-label="Closes this modal window"]').click();
      cy.get('a').contains('Manage').click(); // Adjust the selector as needed

      // Step 4: Add the index pattern
      cy.get('[data-test-subj="indexPatterns"]').click();
      cy.get('[data-test-subj="createIndexPatternButton"]').click();
      cy.get('input[data-test-subj="createIndexPatternNameInput"]').type(
        'opensearch_dashboards_sample_data_flights*'
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

      // Additional verification if needed
    });
  });

  describe('Authc and Authz page', () => {
    // start a server so that server responses can be mocked via fixtures
    // in all of the below test cases
    before(() => {
      cy.server();
    });

    it('authentication and authorization section should exist', () => {
      cy.mockAuthAction(SEC_FIXTURES_BASE_PATH + '/auth_response.json', () => {
        cy.visit(SEC_UI_AUTH_PATH);
      });

      cy.contains('h3', 'Authentication sequences');
      cy.contains('span', 'kerberos_auth_domain');

      cy.contains('h3', 'Authorization');
      cy.contains('span', 'roles_from_another_ldap');
    });

    it('View Expression Modal should display and close correctly', () => {
      cy.mockAuthAction(SEC_FIXTURES_BASE_PATH + '/auth_response.json', () => {
        cy.visit(SEC_UI_AUTH_PATH);
      });

      cy.get('.euiModal').should('not.exist');

      cy.get('[data-test-subj=view-expression]').first().click({ force: true });

      cy.get('.euiModal').should('be.visible');

      cy.get('.euiModal__closeIcon').click({ force: true });

      cy.get('.euiModal').should('not.exist');
    });
  });
}
