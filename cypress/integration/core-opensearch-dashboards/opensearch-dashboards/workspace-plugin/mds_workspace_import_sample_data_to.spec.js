/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const MDSEnabled = Cypress.env('DATASOURCE_MANAGEMENT_ENABLED');

export const WorkspaceImportSampleDataTestCases = () => {
  if (Cypress.env('WORKSPACE_ENABLED')) {
    describe('workspace import sample data', { testIsolation: false }, () => {
      let workspaceId;
      let dataSourceId;
      let dataSourceTitle;
      const workspaceName = `workspace-${new Date().getTime()}`;

      const getTitleWithDataSource = (title) => {
        if (!dataSourceTitle) {
          return title;
        }
        return `${title}_${dataSourceTitle}`;
      };

      before(() => {
        if (MDSEnabled) {
          cy.createDataSourceNoAuth()
            .then((result) => {
              dataSourceId = result[0];
              dataSourceTitle = result[1];
              return result;
            })
            .then((result) => {
              cy.createWorkspace({
                name: workspaceName,
                settings: MDSEnabled
                  ? {
                      dataSources: [result[0]],
                    }
                  : undefined,
              }).then((id) => {
                workspaceId = id;
              });
            });
        } else {
          cy.createWorkspace({
            name: workspaceName,
          }).then((id) => {
            workspaceId = id;
          });
        }
      });

      after(() => {
        if (workspaceId) {
          cy.deleteWorkspaceById(workspaceId);
        }
        if (MDSEnabled) {
          cy.deleteAllDataSources();
        }
      });

      describe('add and remove buttons', () => {
        beforeEach(() => {
          cy.visit(`/w/${workspaceId}/app/import_sample_data`);

          // V13 fix: Ensure the page is loaded before trying to select data source
          cy.getElementByTestId('addSampleDataSetecommerce').should(
            'be.visible'
          );

          if (MDSEnabled) {
            // V13 fix: The data source selector might take a moment to appear in the header
            cy.getElementByTestId('dataSourceSelectable', {
              timeout: 30000,
            }).should('be.visible');
            cy.selectTopRightNavigationDataSource(
              dataSourceTitle,
              dataSourceId
            );
          }
        });

        it('should show Add data buttons if sample data not installed', () => {
          cy.getElementByTestId('addSampleDataSetecommerce').should(
            'be.visible'
          );
          cy.getElementByTestId('addSampleDataSetflights').should('be.visible');
          cy.getElementByTestId('addSampleDataSetlogs').should('be.visible');
        });

        it('should show remove buttons after sample data installed', () => {
          cy.intercept(
            {
              pathname: '/w/**/api/sample_data/**',
              times: 3,
            },
            {
              statusCode: 200,
            }
          ).as('importSampleData');

          cy.getElementByTestId('addSampleDataSetecommerce').should(
            'be.visible'
          );
          cy.getElementByTestId('addSampleDataSetecommerce').click({
            force: true,
          });

          cy.wait('@importSampleData')
            .its('request.url')
            .should('include', 'ecommerce');

          cy.getElementByTestId('addSampleDataSetflights').should('be.visible');
          cy.getElementByTestId('addSampleDataSetflights').click({
            force: true,
          });

          cy.wait('@importSampleData')
            .its('request.url')
            .should('include', 'flights');

          cy.getElementByTestId('addSampleDataSetlogs').should('be.visible');
          cy.getElementByTestId('addSampleDataSetlogs').click({ force: true });

          cy.wait('@importSampleData')
            .its('request.url')
            .should('include', 'logs');

          cy.getElementByTestId('removeSampleDataSetecommerce').should(
            'be.visible'
          );
          cy.getElementByTestId('removeSampleDataSetflights').should(
            'be.visible'
          );
          cy.getElementByTestId('removeSampleDataSetlogs').should('be.visible');
        });
      });

      it('should be able to visit ecommerce dashboard', () => {
        cy.loadSampleDataForWorkspace('ecommerce', workspaceId, dataSourceId)
          .then(() => {
            cy.visit(`/w/${workspaceId}/app/import_sample_data`);

            cy.getElementByTestId('addSampleDataSetecommerce').should(
              'be.visible'
            );

            if (MDSEnabled) {
              cy.getElementByTestId('dataSourceSelectable', {
                timeout: 30000,
              }).should('be.visible');
              cy.selectTopRightNavigationDataSource(
                dataSourceTitle,
                dataSourceId
              );
            }

            cy.getElementByTestId('launchSampleDataSetecommerce').should(
              'be.visible'
            );
            cy.getElementByTestId('launchSampleDataSetecommerce').click({
              force: true,
            });

            cy.location('pathname', { timeout: 10000 }).should(
              'include',
              `/w/${workspaceId}/app/dashboards`
            );

            cy.getElementByTestId('headerAppActionMenu')
              .should('be.visible')
              .should(
                'contain',
                getTitleWithDataSource('[eCommerce] Revenue Dashboard')
              );

            cy.get(
              `[data-title="${getTitleWithDataSource(
                '[eCommerce] Total Revenue'
              )}"]`
            )
              .should('be.visible')
              .should('not.contain', 'No results found');
          })
          .then(() => {
            cy.removeSampleDataForWorkspace(
              'ecommerce',
              workspaceId,
              dataSourceId
            );
          });
      });
    });
  }
};
