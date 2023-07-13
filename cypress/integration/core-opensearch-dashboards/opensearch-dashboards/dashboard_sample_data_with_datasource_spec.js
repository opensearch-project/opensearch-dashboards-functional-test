/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CommonUI,
  MiscUtils,
} from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const commonUI = new CommonUI(cy);
const miscUtils = new MiscUtils(cy);
const baseURL = new URL(Cypress.config().baseUrl);
// remove trailing slash
const path = baseURL.pathname.replace(/\/$/, '');

if (Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')) {
  describe('dashboard local cluster sample data validation', () => {
    before(() => {});

    after(() => {});

    describe('checking home page', () => {
      before(() => {
        // Go to the home page
        miscUtils.visitPage('app/home#');
        cy.window().then((win) =>
          win.localStorage.setItem('home:welcome:show', false)
        );
        cy.reload(true);
      });

      after(() => {
        cy.window().then((win) =>
          win.localStorage.removeItem('home:welcome:show')
        );
      });

      it('checking tutorial_directory display', () => {
        // Check that tutorial_directory is visible
        commonUI.checkElementExists(
          `a[href="${path}/app/home#/tutorial_directory"]`,
          2
        );
      });
    });

    describe('adding sample data', () => {
      before(() => {
        miscUtils.addSampleData();
      });

      after(() => {
        miscUtils.removeSampleData();
      });

      it('checking ecommerce dashboards displayed', () => {
        miscUtils.viewData('ecommerce');
        commonUI.checkElementContainsValue(
          'span[title="[eCommerce] Revenue Dashboard"]',
          1,
          '\\[eCommerce\\] Revenue Dashboard'
        );
        commonUI.checkElementContainsValue(
          'div[data-test-subj="markdownBody"] > h3',
          1,
          'Sample eCommerce Data'
        );
      });

      it('checking flights dashboards displayed', () => {
        miscUtils.viewData('flights');
        commonUI.checkElementContainsValue(
          'span[title="[Flights] Global Flight Dashboard"]',
          1,
          '\\[Flights\\] Global Flight Dashboard'
        );
        commonUI.checkElementContainsValue(
          'div[data-test-subj="markdownBody"] > h3',
          1,
          'Sample Flight data'
        );
      });

      it('checking web logs dashboards displayed', () => {
        miscUtils.viewData('logs');
        commonUI.checkElementContainsValue(
          'span[title="[Logs] Web Traffic"]',
          1,
          '\\[Logs\\] Web Traffic'
        );
        commonUI.checkElementContainsValue(
          'div[data-test-subj="markdownBody"] > h3',
          1,
          'Sample Logs Data'
        );
      });

      describe('checking index patterns', () => {
        before(() => {
          miscUtils.visitPage(
            'app/management/opensearch-dashboards/indexPatterns'
          );
        });

        after(() => {});

        it('checking ecommerce index patterns are added', () => {
          commonUI.checkElementContainsValue(
            'div[data-test-subj="indexPatternTable"]',
            1,
            'opensearch_dashboards_sample_data_ecommerce'
          );
        });

        it('checking flights index patterns are added', () => {
          commonUI.checkElementContainsValue(
            'div[data-test-subj="indexPatternTable"]',
            1,
            'opensearch_dashboards_sample_data_flights'
          );
        });

        it('checking web logs index patterns are added', () => {
          commonUI.checkElementContainsValue(
            'div[data-test-subj="indexPatternTable"]',
            1,
            'opensearch_dashboards_sample_data_logs'
          );
        });
      });

      describe('checking saved objects', () => {
        before(() => {
          miscUtils.visitPage('app/management/opensearch-dashboards/objects');
        });

        after(() => {});

        it('checking ecommerce object is saved', () => {
          commonUI.checkElementContainsValue(
            'div[data-test-subj="savedObjectsTable"]',
            1,
            'opensearch_dashboards_sample_data_ecommerce'
          );
        });

        it('checking flights object is saved', () => {
          commonUI.checkElementContainsValue(
            'div[data-test-subj="savedObjectsTable"]',
            1,
            'opensearch_dashboards_sample_data_flights'
          );
        });

        it('checking web logs object is saved', () => {
          commonUI.checkElementContainsValue(
            'div[data-test-subj="savedObjectsTable"]',
            1,
            'opensearch_dashboards_sample_data_logs'
          );
        });
      });
    });
  });
}
