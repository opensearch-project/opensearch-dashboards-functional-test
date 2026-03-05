/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SEC_UI_AUTH_PATH,
  SEC_FIXTURES_BASE_PATH,
} from '../../../utils/constants';

if (Cypress.env('SECURITY_ENABLED')) {
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
