/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CommonUI,
  MiscUtils,
} from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { CURRENT_TENANT } from '../../utils/commands';

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
    before(() => {
      CURRENT_TENANT.newTenant = 'global';
    });

    after(() => {});

    describe('checking home page', () => {
      before(() => {
        // Go to the home page
        miscUtils.visitPage('app/home#');
        cy.window().then((win) =>
          win.localStorage.setItem('home:welcome:show', false)
        );
        cy.reload(true);
        // Wait for page to fully load in v13
        cy.wait(5000);

        // Expand the navigation menu to reveal links
        cy.get('body', { timeout: 10000 }).then(($body) => {
          // Try to find the hamburger menu button
          const selectors = [
            '[data-test-subj="toggleNavButton"]',
            'button[aria-label="Toggle navigation"]',
            '.euiHeaderSectionItemButton',
            'button[class*="nav"]',
          ];

          for (const selector of selectors) {
            const $el = $body.find(selector);
            if ($el.length > 0 && $el.is(':visible')) {
              cy.wrap($el.first()).click({ force: true });
              cy.log(`Clicked navigation button with selector: ${selector}`);
              break;
            }
          }
        });

        // Wait for menu to expand
        cy.wait(3000);
      });

      after(() => {
        cy.window().then((win) =>
          win.localStorage.removeItem('home:welcome:show')
        );
      });

      // Helper function to go to home page, expand nav menu and find link
      const checkNavLinkExists = (href) => {
        // IMPORTANT: Re-visit home page to ensure we're on the correct page
        // (testIsolation: false means previous tests may have navigated elsewhere)
        miscUtils.visitPage('app/home#');
        cy.wait(3000);

        // Extract the path part without the base path
        const hrefWithoutBase = href.replace(path, '');

        // Try to expand the navigation menu
        cy.get('body').then(($body) => {
          const $navButton = $body.find('[data-test-subj="toggleNavButton"]');
          if ($navButton.length > 0 && $navButton.is(':visible')) {
            cy.wrap($navButton.first()).click({ force: true });
            cy.wait(3000);
          }
        });

        // Use attribute contains selector for partial match
        cy.get(`a[href*="${hrefWithoutBase}"]`, { timeout: 30000 }).should(
          'exist'
        );
      };

      it('checking opensearch_dashboards_overview display', () => {
        checkNavLinkExists(`${path}/app/opensearch_dashboards_overview`, 1);
      });

      it('checking tutorial_directory display', () => {
        // Use href without hash for matching
        checkNavLinkExists(`${path}/app/home/tutorial_directory`, 2);
      });

      it('checking management display', () => {
        checkNavLinkExists(`${path}/app/management`, 1);
      });

      it('checking dev_tools display', () => {
        // Use href without hash for matching
        checkNavLinkExists(`${path}/app/dev_tools/console`, 2);
      });

      it('settings display', () => {
        // Use href without hash for matching
        checkNavLinkExists(
          `${path}/app/management/opensearch-dashboards/settings`,
          1
        );
      });

      it('checking feature_directory display', () => {
        // Use href without hash for matching
        checkNavLinkExists(`${path}/app/home/feature_directory`, 1);
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
        // Ensure we're on the correct page before adding sample data
        miscUtils.visitPage('app/home#/tutorial_directory');
        cy.wait(5000);

        // Verify page loaded before adding sample data
        cy.get('body', { timeout: 30000 }).should('exist');

        // Close "New Enhanced Discover" popup if it appears
        cy.get('body').then(($body) => {
          // Try multiple possible selectors for the popup close button
          const closeSelectors = [
            'button:contains("Dismiss")',
            '[data-test-subj="dismissEnhancedDiscoverCallout"]',
            '[data-test-subj="euiFlyoutCloseButton"]',
            'button[aria-label="Close this dialog"]',
            '.euiFlyout .euiButton',
            'button:contains("Got it")',
          ];

          for (const selector of closeSelectors) {
            const $el = $body.find(selector);
            if ($el.length > 0 && $el.is(':visible')) {
              cy.wrap($el.first()).click({ force: true });
              cy.wait(1000);
              cy.log('Closed New Enhanced Discover popup');
              break;
            }
          }
        });

        // Try to add sample data with retry
        cy.get('body').then(($body) => {
          if (
            $body.find('[data-test-subj="addSampleDataSetecommerce"]')
              .length === 0
          ) {
            cy.log('Sample data buttons not found, refreshing page...');
            cy.reload();
            cy.wait(5000);
          }
        });

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
          cy.wait(3000);

          // Close "New Enhanced Discover" popup if it appears
          cy.get('body').then(($body) => {
            // Try multiple possible selectors for the popup close button
            const closeSelectors = [
              '[data-test-subj="dismissEnhancedDiscoverCallout"]',
              '[data-test-subj="euiFlyoutCloseButton"]',
              'button[aria-label="Close this dialog"]',
              '.euiFlyout .euiButton',
              'button:contains("Got it")',
              'button:contains("Dismiss")',
            ];

            for (const selector of closeSelectors) {
              const $el = $body.find(selector);
              if ($el.length > 0 && $el.is(':visible')) {
                cy.wrap($el.first()).click({ force: true });
                cy.wait(1000);
                cy.log('Closed New Enhanced Discover popup');
                break;
              }
            }
          });
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
        // Wait for page to fully load in v13
        cy.wait(8000);

        // Ensure page is fully loaded
        cy.get('body', { timeout: 30000 }).should('exist');
      });

      after(() => {});

      it('checking welcome panel display', () => {
        cy.wait(2000);
        commonUI.checkElementExists('div[data-test-subj="welcomePanel"]', 1);
      });

      it('checking dismiss button display', () => {
        cy.wait(2000);
        commonUI.checkElementExists(
          'button[data-test-subj="help-close-button"]',
          1
        );
      });

      it('checking console input area display', () => {
        cy.wait(2000);
        commonUI.checkElementExists('div[data-test-subj="request-editor"]', 1);
      });

      it('checking console output area display', () => {
        cy.wait(2000);
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
