/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SEC_UI_AUTH_PATH,
  SEC_FIXTURES_BASE_PATH,
} from '../../../utils/constants';

if (Cypress.env('SECURITY_ENABLED')) {

  describe('OpenSearch Dashboards Security Plugin - User Creation', () => {
    const username = 'newuser';
    const password = 'newpassword';

    beforeEach(() => {
      // Visit the OpenSearch Dashboards login page
      cy.visit('/');

      // Login as admin
      cy.get('input[name="username"]').type(Cypress.env('username'));
      cy.get('input[name="password"]').type(Cypress.env('password'), { log: false });
      cy.get('button[type="submit"]').click();

      // Wait for the OpenSearch Dashboards home page to load
      cy.contains('Welcome to OpenSearch Dashboards', { timeout: 60000 }).should('be.visible');
    });

    it('should create a new internal user', () => {
      // Navigate to Security/Internal User Database section
      cy.visit('/app/security-dashboards#/users');

      // Click on 'Add internal user' button
      cy.get('button').contains('Add internal user').click();

      // Provide username and password for the new user
      cy.get('input[data-test-subj="user-name"]').type(username);
      cy.get('input[data-test-subj="password"]').type(password);
      cy.get('input[data-test-subj="password-confirmation"]').type(password);

      // Optionally add backend role and user attribute
      // Skipping as per the instruction [No backend role]

      // Submit the form to create the user
      cy.get('button').contains('Submit').click();

      // Verify that the user is created
      cy.contains(username).should('exist');
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
