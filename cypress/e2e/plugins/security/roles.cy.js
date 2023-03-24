/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SEC_UI_ROLES_PATH,
  SEC_ROLES_FIXTURES_PATH,
  SEC_UI_ROLES_CREATE_PATH,
} from '../../../utils/constants';

if (Cypress.env('SECURITY_ENABLED')) {
  describe('Roles page', () => {
    // start a server so that server responses can be mocked via fixtures
    // in all of the below test cases
    before(() => {
      cy.server();
    });

    it('should load Roles page properly', () => {
      cy.mockRolesAction(
        SEC_ROLES_FIXTURES_PATH + '/roles_response.json',
        () => {
          cy.visit(SEC_UI_ROLES_PATH);
        }
      );

      cy.contains('h3', 'Roles');

      // One of the many roles
      cy.contains('a', 'kibana_user');
    });

    // TODO: add test to check for other filters too
    it('should open Cluster Permissions drop-down menu when clicked', () => {
      cy.mockRolesAction(
        SEC_ROLES_FIXTURES_PATH + '/roles_response.json',
        () => {
          cy.visit(SEC_UI_ROLES_PATH);
        }
      );

      // one of the cluster permissions
      cy.contains('span', 'cluster:admin/opendistro/ad/detector/search').should(
        'not.exist'
      );

      cy.get('[data-text="Cluster permissions"]')
        .first()
        .click({ force: true });

      cy.contains('span', 'cluster:admin/opendistro/ad/detector/search').should(
        'not.exist'
      );
    });

    it('should redirect to create new role page', () => {
      cy.mockRolesAction(
        SEC_ROLES_FIXTURES_PATH + '/roles_response.json',
        () => {
          cy.visit(SEC_UI_ROLES_PATH);
        }
      );

      cy.contains('span', 'Create role');

      cy.get('a[href*="#/roles/create"]').click({ force: true });

      cy.url().should((url) => {
        expect(url).to.contain('/roles/create');
      });

      cy.contains('span', 'Create');
      cy.contains('span', 'Cancel');
    });

    it('should create new role successfully', () => {
      cy.visit(SEC_UI_ROLES_CREATE_PATH);

      cy.contains('span', 'Create');

      const roleName = 'role-name';
      cy.get('input[data-test-subj="name-text"]').type(roleName, {
        force: true,
      });

      cy.get('input[data-test-subj="name-text"]').should(
        'have.value',
        roleName
      );

      cy.contains('button', 'Create').first().click({ force: true });

      cy.url().should((url) => {
        expect(url).to.contain('/roles/view/');
      });

      cy.contains('h1', roleName);
    });
  });
}
