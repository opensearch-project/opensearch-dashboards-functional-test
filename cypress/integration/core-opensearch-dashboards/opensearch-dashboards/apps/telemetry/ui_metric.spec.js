/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { CURRENT_TENANT } from '../../../../../utils/commands';

const miscUtils = new MiscUtils(cy);
describe('dev_console_ui_metric', () => {
  before(() => {
    CURRENT_TENANT.newTenant = 'global';
    miscUtils.visitPage('app/dev_tools#/console');

    cy.get('[data-test-subj="help-close-button"]', { timeout: 30000 }).then(
      ($btn) => {
        if ($btn.is(':visible')) {
          cy.wrap($btn).click({ force: true });
        } else {
          cy.get('[type="button"]').contains('Console').click({ force: true });
        }
      }
    );

    cy.intercept('POST', 'api/ui_metric/report').as('reportreq');

    cy.wait(5000); // Intentional wait
  });
  if (Cypress.env('UIMETRIC_ENABLED')) {
    it('check UI Metric are being recorded', function () {
      miscUtils.visitPage('app/home#/');

      cy.wait('@reportreq', { timeout: 100000 })
        .its('response.statusCode')
        .should('equal', 200);

      // Now verify the response of api/stat

      cy.request(
        'GET',
        `${
          Cypress.config().baseUrl
        }/api/stats?extended=true&legacy=true&exclude_usage=false`
      ).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body)
          .to.have.property('usage')
          .that.has.property('application_usage')
          .that.has.property('dev_tools');
        expect(res.body)
          .to.have.property('usage')
          .that.has.property('ui_metric')
          .that.has.property('console')
          .that.has.property('length')
          .that.is.gt(0);
      });
    });
  }
});
