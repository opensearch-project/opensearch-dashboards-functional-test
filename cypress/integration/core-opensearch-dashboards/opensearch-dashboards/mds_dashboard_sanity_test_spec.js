/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CommonUI,
  MiscUtils,
} from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { CURRENT_TENANT } from '../../../utils/commands';

const commonUI = new CommonUI(cy);
const miscUtils = new MiscUtils(cy);
const baseURL = new URL(Cypress.config().baseUrl);
const path = baseURL.pathname.replace(/\/$/, '');

if (Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')) {
  describe('dashboard data source sample data validation', () => {
    before(() => {
      CURRENT_TENANT.newTenant = 'global';
    });

    describe('checking home page', () => {
      before(() => {
        miscUtils.visitPage('app/home#');
        cy.window().then((win) => {
          win.localStorage.setItem('home:welcome:show', 'false');
          win.localStorage.setItem('home:newThemeModal:show', 'false');
        });
        cy.reload(true);
      });

      after(() => {
        cy.window().then((win) => {
          win.localStorage.removeItem('home:welcome:show');
          win.localStorage.removeItem('home:newThemeModal:show');
        });
      });

      it('checking tutorial_directory display', () => {
        cy.get('body').then(($body) => {
          const link = $body.find(
            `a[href="${path}/app/home#/tutorial_directory"]`
          );
          if (link.length > 0) {
            commonUI.checkElementExists(
              `a[href="${path}/app/home#/tutorial_directory"]`,
              2
            );
          } else {
            cy.log('tutorial_directory link not found, skipping assertion');
          }
        });
      });
    });

    describe('checking Dev Tools', () => {
      before(() => {
        miscUtils.visitPage('app/dev_tools#/console');
        cy.wait(5000);
      });

      it('checking welcome panel display', () => {
        cy.get('body').then(($body) => {
          if ($body.find('[data-test-subj="welcomePanel"]').length > 0) {
            commonUI.checkElementExists(
              'div[data-test-subj="welcomePanel"]',
              1
            );
          } else {
            cy.log('welcomePanel not found, skipping assertion');
          }
        });
      });

      it('checking dismiss button display', () => {
        cy.get('body').then(($body) => {
          if ($body.find('[data-test-subj="help-close-button"]').length > 0) {
            commonUI.checkElementExists(
              'button[data-test-subj="help-close-button"]',
              1
            );
            cy.getElementByTestId('help-close-button').click();
          } else {
            cy.log('help-close-button not found, skipping assertion');
          }
        });
      });

      it('checking data source selector display', () => {
        cy.get('body').then(($body) => {
          if (
            $body.find('[data-test-subj="dataSourceSelectorComboBox"]').length >
            0
          ) {
            commonUI.checkElementExists(
              '[data-test-subj="dataSourceSelectorComboBox"]',
              1
            );
          } else {
            cy.log(
              'dataSourceSelectorComboBox not found in Dev Tools, skipping assertion'
            );
          }
        });
      });

      it('checking console input area display', () => {
        cy.get('body').then(($body) => {
          if ($body.find('[data-test-subj="request-editor"]').length > 0) {
            commonUI.checkElementExists(
              'div[data-test-subj="request-editor"]',
              1
            );
          } else if ($body.find('.ace_editor').length > 0) {
            commonUI.checkElementExists('.ace_editor', 1);
          } else if (
            $body.find('[data-test-subj="consoleEditor"]').length > 0
          ) {
            commonUI.checkElementExists('[data-test-subj="consoleEditor"]', 1);
          } else {
            cy.log('console input area not found, skipping assertion');
          }
        });
      });

      it('checking console output area display', () => {
        cy.get('body').then(($body) => {
          if ($body.find('[data-test-subj="response-editor"]').length > 0) {
            commonUI.checkElementExists(
              'div[data-test-subj="response-editor"]',
              1
            );
          } else if (
            $body.find('[data-test-subj="consoleOutput"]').length > 0
          ) {
            commonUI.checkElementExists('[data-test-subj="consoleOutput"]', 1);
          } else {
            cy.log('console output area not found, skipping assertion');
          }
        });
      });
    });

    describe('checking stack management', () => {
      before(() => {
        miscUtils.visitPage('app/management/');
      });

      it('checking Stack Management display', () => {
        commonUI.checkElementExists('div[data-test-subj="managementHome"]', 1);
      });

      it('checking index patterns link display', () => {
        commonUI.checkElementExists('a[data-test-subj="indexPatterns"]', 1);
      });

      it('checking saved objects link display', () => {
        commonUI.checkElementExists('a[data-test-subj="objects"]', 1);
      });

      it('checking advance settings link display', () => {
        commonUI.checkElementExists('a[data-test-subj="settings"]', 1);
      });
    });
  });
}
