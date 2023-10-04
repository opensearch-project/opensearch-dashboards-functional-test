/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CommonUI,
  MiscUtils,
} from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

/**
 * dashboard_sample_data test suite description:
 * 1) Visit the home page of opensearchdashboard, check key UI elements display
 * 2) add sample data of eCommerce, flights, web logs from tutorial page
 * 3) check each sample data dashboard key UI elements display
 */
export function dashboardSanityTests() {
  const commonUI = new CommonUI(cy);
  const miscUtils = new MiscUtils(cy);
  const baseURL = new URL(Cypress.config().baseUrl);
  // remove trailing slash
  const path = baseURL.pathname.replace(/\/$/, '');

  describe('dashboard sample data validation', () => {
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

      it('checking opensearch_dashboards_overview display', () => {
        // Check that opensearch_dashboards_overview is visable
        commonUI.checkElementExists(
          `a[href="${path}/app/opensearch_dashboards_overview"]`,
          1
        );
      });

      it('checking tutorial_directory display', () => {
        // Check that tutorial_directory is visable
        commonUI.checkElementExists(
          `a[href="${path}/app/home#/tutorial_directory"]`,
          2
        );
      });

      it('checking management display', () => {
        // Check that management is visable
        commonUI.checkElementExists(`a[href="${path}/app/management"]`, 1);
      });

      it('checking dev_tools display', () => {
        // Check that dev_tools is visable
        commonUI.checkElementExists(
          `a[href="${path}/app/dev_tools#/console"]`,
          2
        );
      });

      it('settings display', () => {
        // Check that settings is visable
        commonUI.checkElementExists(
          `a[href="${path}/app/management/opensearch-dashboards/settings#defaultRoute"]`,
          1
        );
      });

      it('checking feature_directory display', () => {
        // Check that feature_directory is visable
        commonUI.checkElementExists(
          `a[href="${path}/app/home#/feature_directory"]`,
          1
        );
      });

      it('checking navigation display', () => {
        // Check that navigation is visable
        commonUI.checkElementExists(
          'button[data-test-subj="toggleNavButton"]',
          1
        );
      });

      it('checking Help menu display', () => {
        // Check that Help menu is visable
        commonUI.checkElementExists('button[aria-label="Help menu"]', 1);
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

      describe('checking Visualize', () => {
        before(() => {
          // Go to the Visualize page
          miscUtils.visitPage('app/visualize#/');
        });

        after(() => {});

        it('checking visualizations list display', () => {
          commonUI.checkElementExists(
            'div[data-test-subj="itemsInMemTable"]',
            1
          );
        });

        it('checking search bar display', () => {
          commonUI.checkElementExists('input[placeholder="Search..."]', 1);
        });

        it('checking create visualization button display', () => {
          commonUI.checkElementExists(
            'button[data-test-subj="newItemButton"]',
            1
          );
        });
      });

      describe('checking discover', () => {
        before(() => {
          // Go to the Discover page
          miscUtils.visitPage('app/data-explorer/discover#/');
        });

        after(() => {});

        it('checking save query button display', () => {
          commonUI.checkElementExists(
            'button[data-test-subj="saved-query-management-popover-button"]',
            1
          );
        });

        it('checking query input display', () => {
          commonUI.checkElementExists(
            'textarea[data-test-subj="queryInput"]',
            1
          );
        });

        it('checking refresh button display', () => {
          commonUI.checkElementExists(
            'button[data-test-subj="querySubmitButton"]',
            1
          );
        });

        it('checking add filter button display', () => {
          commonUI.checkElementExists('button[data-test-subj="addFilter"]', 1);
        });

        it('checking index pattern switch button display', () => {
          cy.getElementByTestId('dataExplorerDSSelect').should('be.visible');
        });

        it('checking field filter display', () => {
          commonUI.checkElementExists(
            'button[data-test-subj="toggleFieldFilterButton"]',
            1
          );
        });
      });
    });

    describe('checking Dev Tools', () => {
      before(() => {
        // Go to the Dev Tools page
        miscUtils.visitPage('app/dev_tools#/console');
      });

      after(() => {});

      it('checking welcome panel display', () => {
        commonUI.checkElementExists('div[data-test-subj="welcomePanel"]', 1);
      });

      it('checking dismiss button display', () => {
        commonUI.checkElementExists(
          'button[data-test-subj="help-close-button"]',
          1
        );
      });

      it('checking console input area display', () => {
        commonUI.checkElementExists('div[data-test-subj="request-editor"]', 1);
      });

      it('checking console output area display', () => {
        commonUI.checkElementExists('div[data-test-subj="response-editor"]', 1);
      });
    });

    describe('checking stack management', () => {
      before(() => {
        // Go to the stack management page
        miscUtils.visitPage('app/management/');
      });

      after(() => {});

      it('checking Stack Management display', () => {
        // Check that Stack Management home is visable
        commonUI.checkElementExists('div[data-test-subj="managementHome"]', 1);
      });

      it('checking index patterns link display', () => {
        // Check that index patterns link is visable
        commonUI.checkElementExists('a[data-test-subj="indexPatterns"]', 1);
      });

      it('checking saved objects link display', () => {
        // Check that saved objects link is visable
        commonUI.checkElementExists('a[data-test-subj="objects"]', 1);
      });

      it('checking advance settings link display', () => {
        // Check that advance settings link is visable
        commonUI.checkElementExists('a[data-test-subj="settings"]', 1);
      });
    });
  });
}
