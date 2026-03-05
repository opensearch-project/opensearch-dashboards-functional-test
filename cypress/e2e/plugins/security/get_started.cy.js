/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BASE_SEC_UI_PATH,
  SEC_FIXTURES_BASE_PATH,
} from '../../../utils/constants';

if (Cypress.env('SECURITY_ENABLED')) {
  describe('Home(Get Started) page', () => {
    // start a server so that server responses can be mocked via fixtures
    // in all of the below test cases
    before(() => {
      cy.server();
    });

    it('should load Home page properly', () => {
      cy.visit(BASE_SEC_UI_PATH);

      cy.contains('h1', 'Get started');

      cy.contains('span', 'Open in new window');

      cy.url().should((url) => {
        expect(url).to.contain('/getstarted');
      });
    });

    it('should redirect to Auth page', () => {
      cy.visit(BASE_SEC_UI_PATH);

      cy.url().should((url) => {
        expect(url).to.not.contain('/auth');
      });

      cy.get(
        'button[data-test-subj="review-authentication-and-authorization"]'
      ).click({ force: true });

      cy.url().should((url) => {
        expect(url).to.contain('/auth');
      });
    });

    it('should redirect to view Roles page', () => {
      cy.visit(BASE_SEC_UI_PATH);

      cy.url().should((url) => {
        expect(url).to.not.contain('/roles');
      });

      cy.get('button[data-test-subj="explore-existing-roles"]').click({
        force: true,
      });

      cy.url().should((url) => {
        expect(url).to.contain('/roles');
      });
    });

    it('should redirect to create Roles page', () => {
      cy.visit(BASE_SEC_UI_PATH);

      cy.url().should((url) => {
        expect(url).to.not.contain('/roles/create');
      });

      cy.get('button[data-test-subj="create-new-role"]').click({ force: true });

      cy.url().should((url) => {
        expect(url).to.contain('/roles/create');
      });
    });

    it('should redirect to view Users page', () => {
      cy.visit(BASE_SEC_UI_PATH);

      cy.url().should((url) => {
        expect(url).to.not.contain('/users');
      });

      cy.get('button[data-test-subj="map-users-to-role"]').click({
        force: true,
      });

      cy.url().should((url) => {
        expect(url).to.contain('/users');
      });
    });

    it('should redirect to create Users page', () => {
      cy.visit(BASE_SEC_UI_PATH);

      cy.url().should((url) => {
        expect(url).to.not.contain('/users/create');
      });

      cy.get('button[data-test-subj="create-internal-user"]').click({
        force: true,
      });

      cy.url().should((url) => {
        expect(url).to.contain('/users/create');
      });
    });

    it('should redirect to Audit Logging page', () => {
      cy.visit(BASE_SEC_UI_PATH);

      cy.url().should((url) => {
        expect(url).to.not.contain('/auditLogging');
      });

      cy.get('button[data-test-subj="review-audit-log-configuration"]').click({
        force: true,
      });

      cy.url().should((url) => {
        expect(url).to.contain('/auditLogging');
      });
    });

    it('should purge Cache successfully', () => {
      cy.visit(BASE_SEC_UI_PATH);

      cy.mockCachePurgeAction(
        SEC_FIXTURES_BASE_PATH + '/cache_purge_success_response.json',
        () => {
          cy.contains('button', 'Purge cache').first().click({ force: true });
        }
      ).then((result) => {
        // NOTE: JSON.parse fails on ARM64 because it is an object
        try {
          const body = JSON.parse(result.response.body);
          expect(body.message).to.equal('Cache flushed successfully.');
        } catch (e) {
          if (!(e instanceof SyntaxError)) throw e;
          const resp = JSON.parse(JSON.stringify(result.response));
          expect(resp.statusCode).to.equal(200);
        }
      });
    });
  });
}
