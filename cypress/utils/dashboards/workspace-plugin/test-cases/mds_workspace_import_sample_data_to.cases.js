/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const MDSEnabled = Cypress.env('DATASOURCE_MANAGEMENT_ENABLED');

export const WorkspaceImportSampleDataTestCases = () => {
  if (Cypress.env('WORKSPACE_ENABLED')) {
    describe('import sample data to workspace', () => {
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

      beforeEach(() => {
        cy.visit(`/w/${workspaceId}/app/import_sample_data`);
        if (MDSEnabled) {
          cy.selectTopRightNavigationDataSource(dataSourceTitle, dataSourceId);
        }
      });

      it('should show Add data buttons if sample data not installed', () => {
        cy.getElementByTestId('addSampleDataSetecommerce').should('be.visible');
        cy.getElementByTestId('addSampleDataSetflights').should('be.visible');
        cy.getElementByTestId('addSampleDataSetlogs').should('be.visible');
      });

      it('should show remove buttons after sample data installed', () => {
        cy.getElementByTestId('addSampleDataSetecommerce').click();
        cy.getElementByTestId('addSampleDataSetflights').click();
        cy.getElementByTestId('addSampleDataSetlogs').click();

        cy.getElementByTestId('removeSampleDataSetecommerce').should(
          'be.visible'
        );
        cy.getElementByTestId('removeSampleDataSetflights').should(
          'be.visible'
        );
        cy.getElementByTestId('removeSampleDataSetlogs').should('be.visible');

        cy.getElementByTestId('removeSampleDataSetecommerce').click();
        cy.getElementByTestId('removeSampleDataSetflights').click();
        cy.getElementByTestId('removeSampleDataSetlogs').click();
      });

      it('should be able to visit ecommerce dashboard', () => {
        cy.getElementByTestId('addSampleDataSetecommerce').click();

        cy.getElementByTestId('launchSampleDataSetecommerce')
          .should('be.visible')
          .click();

        cy.location('href').should(
          'include',
          `/w/${workspaceId}/app/dashboards`
        );
        cy.getElementByTestId('headerAppActionMenu').should(
          'contain',
          getTitleWithDataSource('[eCommerce] Revenue Dashboard')
        );
        cy.get(
          `[data-title="${getTitleWithDataSource(
            '[eCommerce] Total Revenue'
          )}"]`
        ).should('not.contain', 'No results found');
        cy.visit(`/w/${workspaceId}/app/import_sample_data`);

        if (MDSEnabled) {
          cy.selectTopRightNavigationDataSource(dataSourceTitle, dataSourceId);
        }
        cy.getElementByTestId('removeSampleDataSetecommerce').click();
      });

      it('should be able to visit flights dashboards', () => {
        cy.getElementByTestId('addSampleDataSetflights').click();

        cy.getElementByTestId('launchSampleDataSetflights')
          .should('be.visible')
          .click();

        cy.location('href').should(
          'include',
          `/w/${workspaceId}/app/dashboards`
        );
        cy.getElementByTestId('headerAppActionMenu').should(
          'contain',
          getTitleWithDataSource('[Flights] Global Flight Dashboard')
        );
        cy.get(
          `[data-title="${getTitleWithDataSource('[Flights] Flight Delays')}"]`
        ).should('not.contain', 'No results found');
        cy.visit(`/w/${workspaceId}/app/import_sample_data`);

        if (MDSEnabled) {
          cy.selectTopRightNavigationDataSource(dataSourceTitle, dataSourceId);
        }
        cy.getElementByTestId('removeSampleDataSetflights').click();
      });

      it('should be able to visit logs dashboards', () => {
        cy.getElementByTestId('addSampleDataSetlogs').click();

        cy.getElementByTestId('launchSampleDataSetlogs')
          .should('be.visible')
          .click();

        cy.location('href').should(
          'include',
          `/w/${workspaceId}/app/dashboards`
        );
        cy.getElementByTestId('headerAppActionMenu').should(
          'contain',
          getTitleWithDataSource('[Logs] Web Traffic')
        );
        cy.get(
          `[data-title="${getTitleWithDataSource(
            '[Logs] Unique Visitors vs. Average Bytes'
          )}"]`
        ).should('not.contain', 'No results found');
        cy.visit(`/w/${workspaceId}/app/import_sample_data`);

        if (MDSEnabled) {
          cy.selectTopRightNavigationDataSource(dataSourceTitle, dataSourceId);
        }
        cy.getElementByTestId('removeSampleDataSetlogs').click();
      });
    });
  }
};
