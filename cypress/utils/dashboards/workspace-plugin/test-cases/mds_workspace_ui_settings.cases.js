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
    describe('Workspace UI Settings', () => {
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
          cy.getElementByTestId('editSetDefaultDataSource')
            .should('be.exist')
            .should('be.enabled')
            .click({ force: true });
          cy.wait(1000);
          cy.getElementByTestId('editSetDefaultDataSource')
            .should('be.exist')
            .should('be.disabled');

          cy.visit(`${BASE_PATH}/app/dataSources/${datasourceId2}`);

          cy.getElementByTestId('editSetDefaultDataSource')
            .should('be.exist')
            .should('be.enabled')
            .click({ force: true });
          cy.wait(1000);
          cy.getElementByTestId('editSetDefaultDataSource')
            .should('be.exist')
            .should('be.disabled');

          cy.visit(`${BASE_PATH}/app/dataSources/${datasourceId1}`);
          cy.getElementByTestId('editSetDefaultDataSource')
            .should('be.exist')
            .should('be.enabled');
        });

        it('Default data source setting inside application pages should work as expected', () => {
          cy.visit(`${BASE_PATH}/app/settings`);
          cy.get(
            '[data-test-subj="advancedSetting-editField-defaultDataSource"]'
          ).then(($input) => {
            if ($input.prop('disabled')) {
              cy.log('Input field is disabled and cannot be changed.');
            } else {
              cy.wrap($input).clear().type(datasourceId1);
              cy.get('[data-test-subj="advancedSetting-saveButton"]').click();
              cy.wrap($input).should('have.value', datasourceId1);
            }
          });
        });
      });

      describe('Application settings', () => {
        it('CRUD operations inside application settings should work as expected', () => {
          cy.visit(`${BASE_PATH}/app/settings`);

          cy.get(
            '[data-test-subj="advancedSetting-editField-csv:quoteValues"]'
          ).then(($switch) => {
            if ($switch.prop('disabled')) {
              cy.log('Switch is disabled and cannot be changed.');
            } else if ($switch.attr('aria-checked') === 'true') {
              cy.wrap($switch).click();
              cy.get('[data-test-subj="advancedSetting-saveButton"]').click();
              cy.get($switch).should('have.attr', 'aria-checked', 'false');
            } else {
              cy.log('The switch is already on.');
            }
          });
        });
      });

      describe('Default data source', () => {
        it('Default data source setting inside application pages should work as expected', () => {
          cy.visit(`${BASE_PATH}/app/settings`);
          cy.get(
            '[data-test-subj="advancedSetting-editField-defaultDataSource"]'
          ).then(($input) => {
            if ($input.prop('disabled')) {
              cy.log('Input field is disabled and cannot be changed.');
            } else {
              cy.wrap($input).clear().type('newDataSource');
              cy.get('[data-test-subj="advancedSetting-saveButton"]').click();
              cy.wrap($input).should('have.value', 'newDataSource');
            }
          });
        });
      });

      describe('Default index pattern', () => {
        it('Default index pattern in index pattern list page should work as expected', () => {
          cy.visit(`${BASE_PATH}/w/${ownerWorkspaceId}/app/indexPatterns`);
          cy.contains('opensearch_dashboards_sample_data_logs').click();
          cy.getElementByTestId('setDefaultIndexPatternButton')
            .should('be.exist')
            .should('be.enabled')
            .click();
          cy.get('div[data-test-subj="headerBadgeControl"]')
            .contains('span', 'Default')
            .should('exist');
        });

        it('Default index pattern in discover page should work as expected', () => {
          cy.visit(`${BASE_PATH}/w/${ownerWorkspaceId}/app/discover`);
          cy.get('div[data-test-subj="comboBoxInput"] span').should(
            'include.text',
            'opensearch_dashboards_sample_data_logs'
          );
        });
      });

      describe('Dismiss Get started', () => {
        it('Dismiss get started button in the top of each overview page should work as expected', () => {
          cy.visit(
            `${BASE_PATH}/w/${ownerWorkspaceId}/app/observability-overview/`
          );
          cy.get('div[data-test-subj="headerRightControl"]').should('exist');
          cy.get('div[data-test-subj="headerRightControl"]')
            .contains('button', 'Dismiss Get started')
            .click();
          cy.get('div[data-test-subj="headerRightControl"]')
            .contains('button', 'Dismiss Get started')
            .should('not.exist');
        });
      });
    });
  }
};
