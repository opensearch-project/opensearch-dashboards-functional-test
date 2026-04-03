/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../base_constants';

export const UiSettingsTestCases = () => {
  let ownerWorkspaceName = 'owner_workspace';

  let ownerWorkspaceId = '';
  let datasourceId1 = '';
  let datasourceId2 = '';

  const setupWorkspace = (workspaceName, datasourceId) => {
    return cy
      .createWorkspace({
        name: workspaceName,
        features: ['use-case-observability'],
        settings: {
          permissions: {
            library_write: { users: ['%me%'] },
            write: { users: ['%me%'] },
          },
          ...(datasourceId ? { dataSources: [datasourceId] } : {}),
        },
      })
      .then((value) => {
        cy.loadSampleDataForWorkspace('logs', value, datasourceId);
        cy.wrap(value);
      });
  };

  if (
    Cypress.env('WORKSPACE_ENABLED') &&
    Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')
  ) {
    describe('Workspace UI Settings', { testIsolation: false }, () => {
      before(() => {
        cy.deleteWorkspaceByName(ownerWorkspaceName);
        cy.deleteAllDataSources();
        cy.setAdvancedSetting({
          defaultDataSource: '',
        });

        cy.createDataSourceNoAuth().then((result) => {
          datasourceId1 = result[0];
          expect(datasourceId1).to.be.a('string').that.is.not.empty;
          setupWorkspace(ownerWorkspaceName, datasourceId1).then(
            (value) => (ownerWorkspaceId = value)
          );
        });
        cy.createDataSourceNoAuth().then((result) => {
          datasourceId2 = result[0];
          expect(datasourceId2).to.be.a('string').that.is.not.empty;
        });
      });

      after(() => {
        cy.removeSampleDataForWorkspace(
          'logs',
          ownerWorkspaceId,
          datasourceId1
        );
        cy.deleteWorkspaceByName(ownerWorkspaceName);
        cy.deleteAllDataSources();
        cy.setAdvancedSetting({
          defaultDataSource: '',
        });
      });

      describe('Default data source', () => {
        it('Default data source setting inside data source management page should work as expected', () => {
          cy.visit(`${BASE_PATH}/app/dataSources/${datasourceId1}`);
          // Cypress V13 fix: Wait for page to load
          cy.getElementByTestId('editSetDefaultDataSource', { timeout: 30000 })
            .should('be.visible')
            .should('be.enabled')
            .click({ force: true });
          cy.wait(1000);
          cy.getElementByTestId('editSetDefaultDataSource')
            .should('be.visible')
            .should('be.disabled');

          cy.visit(`${BASE_PATH}/app/dataSources/${datasourceId2}`);
          // Cypress V13 fix: Wait for page to load
          cy.getElementByTestId('editSetDefaultDataSource', { timeout: 30000 })
            .should('be.visible')
            .should('be.enabled')
            .click({ force: true });
          cy.wait(1000);
          cy.getElementByTestId('editSetDefaultDataSource')
            .should('be.visible')
            .should('be.disabled');

          cy.visit(`${BASE_PATH}/app/dataSources/${datasourceId1}`);
          // Cypress V13 fix: Wait for button to be enabled
          cy.getElementByTestId('editSetDefaultDataSource', { timeout: 30000 })
            .should('be.visible')
            .should('be.enabled');
        });

        it('Default data source setting inside application pages should work as expected', () => {
          cy.visit(`${BASE_PATH}/app/settings`);
          const inputSelector =
            '[data-test-subj="advancedSetting-editField-defaultDataSource"]';

          // Cypress V13 fix: Wait for page to fully load and element to be ready
          cy.get(inputSelector, { timeout: 60000 }).should('be.visible');
          cy.get(inputSelector).then(($input) => {
            if ($input.prop('disabled')) {
              cy.log('Input field is disabled and cannot be changed.');
            } else {
              // V13 fix: Use ACE Editor compatible input method
              // Avoid cy.clear() and cy.type() which can cause KeyboardEvent errors
              cy.get(inputSelector).then(($input) => {
                // Use native DOM manipulation to set value
                const nativeInput = $input[0];
                nativeInput.value = datasourceId1;
                // Trigger input event to notify React/Angular of change
                nativeInput.dispatchEvent(
                  new Event('input', { bubbles: true })
                );
                nativeInput.dispatchEvent(
                  new Event('change', { bubbles: true })
                );
              });

              // V13 fix: Wait for value to be set
              cy.get(inputSelector).should('have.value', datasourceId1);

              // V13 fix: Wait for save button with longer timeout and flexible strategy
              // The save button may appear after a delay
              cy.wait(2000);

              // V13 fix: Use contains to find save button, more reliable than data-test-subj
              cy.get('body').then(($body) => {
                // Try to find save button by data-test-subj first
                const $btn = $body.find(
                  '[data-test-subj="advancedSetting-saveButton"]'
                );
                if ($btn.length > 0 && $btn.is(':visible')) {
                  cy.wrap($btn).click({ force: true });
                } else {
                  // Fallback: look for button containing "Save" text
                  cy.contains('button', /Save/i, { timeout: 10000 })
                    .should('be.visible')
                    .click({ force: true });
                }
              });

              // V13 fix: Wait longer for save to complete
              cy.wait(3000);
              cy.get(inputSelector, { timeout: 60000 }).should(
                'have.value',
                datasourceId1
              );
            }
          });
        });
      });

      describe('Application settings', () => {
        it('CRUD operations inside application settings should work as expected', () => {
          cy.visit(`${BASE_PATH}/app/settings`);
          const switchSelector =
            '[data-test-subj="advancedSetting-editField-csv:quoteValues"]';

          // V9->V13 fix: Wait for page to fully load
          cy.get(switchSelector, { timeout: 60000 }).should('be.visible');

          cy.get(switchSelector).then(($switch) => {
            if ($switch.prop('disabled')) {
              cy.log('Switch is disabled and cannot be changed.');
            } else {
              const originalState = $switch.attr('aria-checked');
              const expectedState = originalState === 'true' ? 'false' : 'true';

              // V9->V13 fix: Click and immediately handle save button in single chain
              // Avoid storing DOM references that become stale in V13
              cy.get(switchSelector)
                .click({ force: true })
                .then(() => {
                  // V9->V13 fix: Use cy.contains to find save button by text, more reliable
                  // The save button appears after state change
                  cy.get('[data-test-subj="advancedSetting-saveButton"]', {
                    timeout: 10000,
                  })
                    .should('exist')
                    .should('be.visible')
                    .click({ force: true });
                });

              // V9->V13 fix: Wait for save and verify
              cy.wait(1500);
              cy.get(switchSelector, { timeout: 30000 }).should(
                'have.attr',
                'aria-checked',
                expectedState
              );
            }
          });
        });
      });

      describe('Default data source again', () => {
        it('Default data source setting inside application pages should work as expected', () => {
          cy.visit(`${BASE_PATH}/app/settings`);
          const inputSelector =
            '[data-test-subj="advancedSetting-editField-defaultDataSource"]';

          // V9->V13 fix: Wait for page to fully load
          cy.get(inputSelector, { timeout: 60000 }).should('be.visible');

          cy.get(inputSelector).then(($input) => {
            if ($input.prop('disabled')) {
              cy.log('Input field is disabled and cannot be changed.');
            } else {
              // V9->V13 fix: Chain input operations atomically without storing DOM refs
              // Use click() + type() pattern that works in V13
              cy.get(inputSelector)
                .click({ force: true })
                .type('{selectall}{del}', { force: true })
                .should('have.value', '');

              // V9->V13 fix: Re-query input before typing new value
              cy.get(inputSelector).type('newDataSource', {
                force: true,
                delay: 30,
              });

              // V9->V13 fix: Save button should appear after input change
              cy.get('[data-test-subj="advancedSetting-saveButton"]', {
                timeout: 10000,
              })
                .should('exist')
                .should('be.visible')
                .click({ force: true });

              // V9->V13 fix: Wait for save and verify
              cy.wait(1500);
              cy.get(inputSelector, { timeout: 30000 }).should(
                'have.value',
                'newDataSource'
              );
            }
          });
        });
      });

      describe('Default index pattern', () => {
        it('Default index pattern in index pattern list page should work as expected', () => {
          cy.visit(`${BASE_PATH}/w/${ownerWorkspaceId}/app/indexPatterns`);
          // Cypress V13 fix: Wait for page to load
          cy.contains('opensearch_dashboards_sample_data_logs', {
            timeout: 60000,
          })
            .should('be.visible')
            .click({ force: true });

          // Cypress V13 fix: Wait for button to be ready
          cy.getElementByTestId('setDefaultIndexPatternButton', {
            timeout: 30000,
          })
            .should('be.visible')
            .should('be.enabled')
            .click({ force: true });

          cy.get('div[data-test-subj="headerBadgeControl"]')
            .contains('span', 'Default')
            .should('exist');
        });

        it('Default index pattern in discover page should work as expected', () => {
          cy.visit(`${BASE_PATH}/w/${ownerWorkspaceId}/app/discover`);
          // Cypress V13 fix: Wait for page to load and element to be visible
          cy.get('div[data-test-subj="comboBoxInput"] span', { timeout: 60000 })
            .should('be.visible')
            .should('include.text', 'opensearch_dashboards_sample_data_logs');
        });
      });

      describe('Dismiss Get started', () => {
        it('Dismiss get started button in the top of each overview page should work as expected', () => {
          cy.visit(
            `${BASE_PATH}/w/${ownerWorkspaceId}/app/observability-overview/`
          );
          // Cypress V13 fix: Wait for page to load
          cy.get('div[data-test-subj="headerRightControl"]', { timeout: 30000 })
            .should('exist')
            .should('be.visible');

          cy.get('div[data-test-subj="headerRightControl"]')
            .contains('button', 'Dismiss Get started')
            .should('be.visible')
            .click({ force: true });

          cy.get('div[data-test-subj="headerRightControl"]')
            .contains('button', 'Dismiss Get started')
            .should('not.exist');
        });
      });
    });
  }
};
