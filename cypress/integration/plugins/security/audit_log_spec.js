/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SEC_AUDIT_FIXTURES_PATH,
  SEC_UI_AUDIT_LOGGING_PATH,
} from '../../../utils/constants';

if (Cypress.env('SECURITY_ENABLED')) {
  describe('Audit logs page', () => {
    // start a server so that server responses can be mocked via fixtures
    // in all of the below test cases
    before(() => {
      cy.server();
    });

    it('should load Audit logs page properly', () => {
      cy.mockAuditLogsAction(
        SEC_AUDIT_FIXTURES_PATH + '/audit_info_response.json',
        () => {
          cy.visit(SEC_UI_AUDIT_LOGGING_PATH);
        }
      );

      cy.contains('h3', 'Audit logging');
      cy.contains('h3', 'General settings');
      cy.contains('h3', 'Compliance settings');
    });

    it('should toggle enable-disable switch for audit logging', () => {
      cy.visit(SEC_UI_AUDIT_LOGGING_PATH);

      // enabled by default
      cy.contains('.euiSwitch', 'Enabled');

      cy.mockAuditConfigUpdateAction(
        SEC_AUDIT_FIXTURES_PATH + '/audit_config_updated.json',
        () => {
          cy.get('button[name="auditLoggingEnabledSwitch"]')
            .first()
            .click({ force: true });
        }
      ).then((result) => {
        // NOTE: JSON.parse fails on ARM64 because it is an object
        try {
          const body = JSON.parse(result.response.body);
          expect(body.message).to.equal("'config' updated.");
        } catch (e) {
          if (!(e instanceof SyntaxError)) throw e;
          const resp = JSON.parse(JSON.stringify(result.response));
          expect(resp.statusCode).to.equal(200);
        }
      });

      cy.contains('.euiSwitch', 'Disabled');

      cy.contains('h3', 'General settings').should('not.exist');
      cy.contains('h3', 'Compliance settings').should('not.exist');
    });

    it('should configure general settings successfully', () => {
      cy.visit(SEC_UI_AUDIT_LOGGING_PATH);

      cy.get('button[data-test-subj="general-settings-configure"]')
        .first()
        .click({ force: true });

      cy.url().should((url) => {
        expect(url).to.contain('/generalSettings');
      });

      cy.contains('h1', 'General settings');

      cy.mockAuditConfigUpdateAction(
        SEC_AUDIT_FIXTURES_PATH + '/audit_config_updated.json',
        () => {
          cy.get('button[data-test-subj="save"]').click({ force: true });
        }
      ).then((result) => {
        // NOTE: JSON.parse fails on ARM64 because it is an object
        try {
          const body = JSON.parse(result.response.body);
          expect(body.message).to.equal("'config' updated.");
        } catch (e) {
          if (!(e instanceof SyntaxError)) throw e;
          const resp = JSON.parse(JSON.stringify(result.response));
          expect(resp.statusCode).to.equal(200);
        }
      });

      cy.url().should((url) => {
        expect(url).to.not.contain('/generalSettings');
      });
    });

    it('should configure compliance settings successfully', () => {
      cy.visit(SEC_UI_AUDIT_LOGGING_PATH);

      cy.get('button[data-test-subj="compliance-settings-configure"]')
        .first()
        .click({ force: true });

      cy.url().should((url) => {
        expect(url).to.contain('/complianceSettings');
      });

      cy.contains('h1', 'Compliance settings');

      cy.mockAuditConfigUpdateAction(
        SEC_AUDIT_FIXTURES_PATH + '/audit_config_updated.json',
        () => {
          cy.get('button[data-test-subj="save"]').click({ force: true });
        }
      ).then((result) => {
        // NOTE: JSON.parse fails on ARM64 because it is an object
        try {
          const body = JSON.parse(result.response.body);
          expect(body.message).to.equal("'config' updated.");
        } catch (e) {
          if (!(e instanceof SyntaxError)) throw e;
          const resp = JSON.parse(JSON.stringify(result.response));
          expect(resp.statusCode).to.equal(200);
        }
      });

      cy.url().should((url) => {
        expect(url).to.not.contain('/complianceSettings');
      });
    });
  });
}
