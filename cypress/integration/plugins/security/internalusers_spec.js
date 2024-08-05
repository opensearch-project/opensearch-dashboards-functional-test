/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SEC_INTERNALUSERS_FIXTURES_PATH,
  SEC_UI_INTERNAL_USERS_PATH,
  SEC_UI_USER_CREATE_PATH,
} from '../../../utils/constants';

if (Cypress.env('SECURITY_ENABLED')) {
  describe('Internal users page', () => {
    // start a server so that server responses can be mocked via fixtures
    // in all of the below test cases
    before(() => {
      cy.server();
    });

    it('should load internal users page properly', () => {
      cy.mockInternalUsersAction(
        SEC_INTERNALUSERS_FIXTURES_PATH + '/internalusers_info_response.json',
        () => {
          cy.visit(SEC_UI_INTERNAL_USERS_PATH);
        }
      );

      cy.contains('h3', 'Internal users');

      // One of the many users
      cy.contains('a', 'logstash');
    });

    it('should view user edit page when a user is clicked', () => {
      cy.mockInternalUsersAction(
        SEC_INTERNALUSERS_FIXTURES_PATH + '/internalusers_info_response.json',
        () => {
          cy.visit(SEC_UI_INTERNAL_USERS_PATH);
        }
      );

      cy.get('a[href*="#/users/edit/logstash"]').click({ force: true });

      cy.url().should((url) => {
        expect(url).to.contain('/users/edit/logstash');
      });

      cy.contains('h1', 'Edit internal user');
      cy.contains('span', 'Save changes');
    });

    it('should redirect to create new users page', () => {
      cy.mockInternalUsersAction(
        SEC_INTERNALUSERS_FIXTURES_PATH + '/internalusers_info_response.json',
        () => {
          cy.visit(SEC_UI_INTERNAL_USERS_PATH);
        }
      );

      cy.contains('span', 'Create internal user');

      cy.url().should((url) => {
        expect(url).to.not.contain('/users/create');
      });

      cy.get('a[href*="#/users/create"]').click({ force: true });

      cy.url().should((url) => {
        expect(url).to.contain('/users/create');
      });

      cy.contains('span', 'Create');
      cy.contains('span', 'Cancel');
    });

    it('should create new user successfully', () => {
      cy.visit(SEC_UI_USER_CREATE_PATH);

      cy.url().should((url) => {
        expect(url).to.contain('/users/create');
      });

      cy.contains('span', 'Create');

      const userName = 'test';
      const password = 'testUserPassword123';

      cy.get('input[data-test-subj="name-text"]').type(userName, {
        force: true,
      });
      cy.get('input[data-test-subj="name-text"]').should(
        'have.value',
        userName
      );

      cy.get('input[data-test-subj="password"]').type(password, {
        force: true,
      });
      cy.get('input[data-test-subj="re-enter-password"]').type(password, {
        force: true,
      });

      cy.mockInternalUsersAction(
        SEC_INTERNALUSERS_FIXTURES_PATH +
          '/internalusers_response_post_new_user_creation.json',
        () => {
          cy.contains('button', 'Create').first().click({ force: true });
        }
      );

      cy.url().should((url) => {
        expect(url).to.contain('/users');
      });

      cy.contains('h3', 'Internal users');
      // should contain the new user that was just created
      cy.contains('a', userName);
    });
  });
}
