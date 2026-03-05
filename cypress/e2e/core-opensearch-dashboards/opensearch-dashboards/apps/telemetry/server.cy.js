/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CURRENT_TENANT } from '../../../../../utils/commands';
import report from '../../../../../fixtures/dashboard/opensearch_dashboards/telemetry/uiReport.json';

describe('server', () => {
  before(() => {
    CURRENT_TENANT.newTenant = 'global';
  });

  if (Cypress.env('UIMETRIC_ENABLED')) {
    it('test server side batching', function () {
      cy.wait(60000); // Intentional Wait to burst previous batching
      // verify we don't have any entries forGET_cat.indices
      cy.request(
        'GET',
        `${
          Cypress.config().baseUrl
        }/api/stats?extended=true&legacy=true&exclude_usage=false`
      ).then((res) => {
        expect(res.status).to.eq(200);
        const usageMetric = res.body.usage.ui_metric.console || [];
        expect(usageMetric).to.not.include({ key: 'GET_cat.indices' });
      });

      // Send the first UI metric report
      cy.request({
        method: 'POST',
        url: `${Cypress.config().baseUrl}/api/ui_metric/report`,
        headers: {
          'Osd-Xsrf': 'osd-fetch',
        },
        body: report,
      }).then((res) => {
        expect(res.status).to.eq(200);
      });

      // Verify that the above report has been written
      cy.request(
        'GET',
        `${
          Cypress.config().baseUrl
        }/api/stats?extended=true&legacy=true&exclude_usage=false`
      ).then((res) => {
        expect(res.status).to.eq(200);
        const usageMetric = res.body.usage.ui_metric.console || []; // eslint-disable-line no-console
        expect(usageMetric).to.deep.include({
          key: 'GET_cat.indices',
          value: 21,
        });
      });

      // Send the second UI metric report
      cy.request({
        method: 'POST',
        url: `${Cypress.config().baseUrl}/api/ui_metric/report`,
        headers: {
          'Osd-Xsrf': 'osd-fetch',
        },
        body: report,
      }).then((res) => {
        expect(res.status).to.eq(200);
      });

      // Verify that the above report has not been written and count is same as before
      cy.request(
        'GET',
        `${
          Cypress.config().baseUrl
        }/api/stats?extended=true&legacy=true&exclude_usage=false`
      ).then((res) => {
        expect(res.status).to.eq(200);
        const usageMetric = res.body.usage.ui_metric.console || []; // eslint-disable-line no-console
        expect(usageMetric).to.deep.include({
          key: 'GET_cat.indices',
          value: 21,
        });
      });

      cy.wait(60000); // Intentional wait to exceed batching interval

      // Send the third UI metric report, since the time interval is greater than batching interval it will write this and previous report
      cy.request({
        method: 'POST',
        url: `${Cypress.config().baseUrl}/api/ui_metric/report`,
        headers: {
          'Osd-Xsrf': 'osd-fetch',
        },
        body: report,
      }).then((res) => {
        expect(res.status).to.eq(200);
      });

      // Verify all the 3 Ui metric report have been written
      cy.request(
        'GET',
        `${
          Cypress.config().baseUrl
        }/api/stats?extended=true&legacy=true&exclude_usage=false`
      ).then((res) => {
        expect(res.status).to.eq(200);
        const usageMetric = res.body.usage.ui_metric.console || []; // eslint-disable-line 
        expect(usageMetric).to.deep.include({
          key: 'GET_cat.indices',
          value: 63,
        });
      });
    });
  }
});
