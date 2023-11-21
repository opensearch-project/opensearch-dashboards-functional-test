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

if (Cypress.env('SECURITY_ENABLED')) {
  describe('OpenSearch Dashboards Security Plugin - Enhanced Sanity Tests', () => {
    const username = 'newuser';
    const password = 'ew4q56a4d6as51!*asSS';

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

    // it.skip('should create a new internal user', () => {
    //   // Navigate to Security/Internal User Database section
    //   cy.visit('/app/security-dashboards-plugin#/users');
    //
    //   // Click on 'Add internal user' button
    //   // cy.get('button').contains('Create internal user').click();
    //   cy.get('a[href="#/users/create"]').click({
    //     force: true,
    //   });
    //   // Provide username and password for the new user
    //   cy.get('input[data-test-subj="name-text"]').type(username);
    //   cy.get('input[data-test-subj="password"]').type(password);
    //   cy.get('input[data-test-subj="re-enter-password"]').type(password);
    //
    //   // Optionally add backend role and user attribute
    //   // Skipping as per the instruction [No backend role]
    //
    //   // Submit the form to create the user
    //   cy.get('button').contains('Create').click();
    //
    //   // Verify that the user is created
    //   cy.contains(username).should('exist');
    // });
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
          cy.get('[data-test-subj="launchSampleDataSetecommerce"]').click();
        }
      });

      // if(cy.find('[data-test-subj="addSampleDataSetflights"]').then(($el) => {
      //   if ($el.length()) {
      //     cy.get('[data-test-subj="addSampleDataSetflights"]').click();
      //   } else {
      //     cy.get('[data-test-subj="launchSampleDataSetecommerce"]').click();
      //   }
      // });

      // //[data-test-subj="addSampleDataSetflights"').click();
      // cy.get('div[data-test-subj="sampleDataSetCardflights"]', {
      //   timeout: 90000,
      // })
      //   .contains(/Add data/)
      //   .click();
      // // cy.wait(60000);

      // Navigate to Security/Roles section
      cy.visit('/app/security-dashboards-plugin#/roles/create');

      // Click on 'Add new role' button
      // Set role name
      const roleName = 'newRole';
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
      const tenantName = 'yourTenantName'; // Replace with your tenant name
      cy.get('input[id="roles-tenant-permission-box"]')
        .type(tenantName)
        .type('{enter}');

      // Save Role Definition
      cy.get('button').contains('Create').click();

      // Verify that the role is created
      cy.contains(roleName).should('exist');
    });
  });

  // describe.skip('Authc and Authz page', () => {
  //   // start a server so that server responses can be mocked via fixtures
  //   // in all of the below test cases
  //   before(() => {
  //     cy.server();
  //   });
  //
  //   it.skip('authentication and authorization section should exist', () => {
  //     cy.mockAuthAction(SEC_FIXTURES_BASE_PATH + '/auth_response.json', () => {
  //       cy.visit(SEC_UI_AUTH_PATH);
  //     });
  //
  //     cy.contains('h3', 'Authentication sequences');
  //     cy.contains('span', 'kerberos_auth_domain');
  //
  //     cy.contains('h3', 'Authorization');
  //     cy.contains('span', 'roles_from_another_ldap');
  //   });
  //
  //   it.skip('View Expression Modal should display and close correctly', () => {
  //     cy.mockAuthAction(SEC_FIXTURES_BASE_PATH + '/auth_response.json', () => {
  //       cy.visit(SEC_UI_AUTH_PATH);
  //     });
  //
  //     cy.get('.euiModal').should('not.exist');
  //
  //     cy.get('[data-test-subj=view-expression]').first().click({ force: true });
  //
  //     cy.get('.euiModal').should('be.visible');
  //
  //     cy.get('.euiModal__closeIcon').click({ force: true });
  //
  //     cy.get('.euiModal').should('not.exist');
  //   });
  // });
}
