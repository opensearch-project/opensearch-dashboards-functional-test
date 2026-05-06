/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

export const WorkspaceCopyTestCases = () => {
  const miscUtils = new MiscUtils(cy);
  const sourceWorkspaceName = 'source_workspace';
  const targetWorkspaceName = 'target_workspace';
  let sourceWorkspaceId;
  let targetWorkspaceId;

  const dataSourceTitle1 = 'no_auth_data_source_title_1';
  const dataSourceTitle2 = 'no_auth_data_source_title_2';
  let dataSourceId1;
  let dataSourceId2;

  const waitForTableStable = () => {
    cy.get('.euiLoadingSpinner', { timeout: 30000 }).should('not.exist');
    cy.getElementByTestId('savedObjectsTable')
      .should('be.visible')
      .find('.euiTableRow')
      .should('have.length.at.least', 1);
  };

  const verifyDuplicateModalContent = (expectedContent) => {
    cy.wait(1000);

    cy.getElementByTestId('savedObjectsDuplicateModal', { timeout: 30000 })
      .should('be.visible')
      .within(() => {
        cy.contains(expectedContent).should('be.visible');
        cy.getElementByTestId('duplicateConfirmButton').should('be.visible');

        cy.getElementByTestId('comboBoxToggleListButton', {
          timeout: 10000,
        }).click({ force: true });
      });

    cy.wait(500);
    cy.get('.euiFilterSelectItem', { timeout: 15000 })
      .contains(targetWorkspaceName)
      .should('be.visible')
      .click({ force: true });

    cy.wait(500);
  };

  const verifyDuplicateFunction = (expectedAssetCount, targetId) => {
    cy.getElementByTestId('duplicateConfirmButton').click({ force: true });

    cy.wait('@copyAssetsRequest').then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
      expect(interception.response.body.successCount).to.equal(
        expectedAssetCount
      );
    });

    const copyContent =
      expectedAssetCount > 1 ? 'assets copied' : 'asset copied';

    cy.get(
      '.euiFlyout[class*="euiFlyout--medium"], .euiFlyout:not(.context-nav-wrapper)',
      { timeout: 20000 }
    )
      .should('be.visible')
      .within(() => {
        cy.contains(targetWorkspaceName).should('be.visible');
        cy.contains(copyContent).should('be.visible');
        cy.contains(`${expectedAssetCount} Successful`).should('be.visible');
      });

    cy.get(
      '.euiFlyout[class*="euiFlyout--medium"] button[data-test-subj="euiFlyoutCloseButton"], .euiFlyout__closeButton',
      { timeout: 10000 }
    )
      .first()
      .click({ force: true });

    cy.wait(1000);

    miscUtils.visitPage(`w/${targetId}/app/objects`);
    waitForTableStable();

    cy.getElementByTestId('savedObjectsTable')
      .find('.euiTableRow')
      .should('have.length', expectedAssetCount);
  };

  const createTargetWorkspace = (dataSourceId) => {
    return cy
      .createWorkspace({
        name: targetWorkspaceName,
        features: ['use-case-observability'],
        settings: {
          permissions: {
            library_write: { users: [`${Cypress.env('username')}`] },
            write: { users: [`${Cypress.env('username')}`] },
          },
          dataSources: [dataSourceId],
        },
      })
      .then((value) => {
        targetWorkspaceId = value;
        return value;
      });
  };

  if (
    Cypress.env('WORKSPACE_ENABLED') &&
    Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')
  ) {
    before(() => {
      cy.deleteAllWorkspaces();
      cy.createDataSourceNoAuth({ title: dataSourceTitle1 }).then((result) => {
        dataSourceId1 = result[0];
      });
      cy.createDataSourceNoAuth({ title: dataSourceTitle2 }).then((result) => {
        dataSourceId2 = result[0];
      });

      cy.wrap(null)
        .should(() => {
          expect(dataSourceId1).to.not.be.undefined;
        })
        .then(() => {
          cy.createWorkspace({
            name: sourceWorkspaceName,
            features: ['use-case-observability'],
            settings: {
              permissions: {
                library_write: { users: [`${Cypress.env('username')}`] },
                write: { users: [`${Cypress.env('username')}`] },
              },
              dataSources: [dataSourceId1, dataSourceId2],
            },
          }).then((value) => {
            sourceWorkspaceId = value;
            cy.loadSampleDataForWorkspace(
              'ecommerce',
              sourceWorkspaceId,
              dataSourceId1
            );
          });
        });
    });

    after(() => {
      if (dataSourceId1) cy.deleteDataSource(dataSourceId1);
      if (dataSourceId2) cy.deleteDataSource(dataSourceId2);
      cy.deleteAllWorkspaces();
    });

    beforeEach(() => {
      cy.intercept('POST', '**/_duplicate_saved_objects').as(
        'copyAssetsRequest'
      );
    });

    afterEach(() => {
      cy.deleteWorkspaceByName(targetWorkspaceName);
    });

    describe('Copy function', () => {
      beforeEach(() => {
        createTargetWorkspace(dataSourceId1);
        miscUtils.visitPage(`w/${sourceWorkspaceId}/app/objects`);
        waitForTableStable();
      });

      it('should successfully copy all assets', () => {
        cy.getElementByTestId('duplicateObjects')
          .should('not.be.disabled')
          .click({ force: true });
        verifyDuplicateModalContent('14 assets');
        verifyDuplicateFunction(14, targetWorkspaceId);
      });

      it('should successfully copy single asset', () => {
        cy.getElementByTestId('savedObjectsTable')
          .find('.euiTableRow')
          .first()
          .find('[data-test-subj="euiCollapsedItemActionsButton"]')
          .click();

        cy.getElementByTestId('savedObjectsTableAction-duplicate')
          .should('be.visible')
          .click({ force: true });

        verifyDuplicateModalContent('Revenue Dashboard');
        cy.get('#includeReferencesDeep').uncheck({ force: true });
        verifyDuplicateFunction(1, targetWorkspaceId);
      });

      it('should successfully copy selected assets', () => {
        cy.wait(2000);

        cy.getElementByTestId('savedObjectsTable')
          .find('thead .euiCheckbox__input, thead .euiCheckbox')
          .first()
          .click({ force: true });
        cy.wait(1000);

        for (let i = 2; i < 14; i++) {
          cy.getElementByTestId('savedObjectsTable')
            .find('.euiTableRow .euiCheckbox__input')
            .eq(i)
            .click({ force: true });
          cy.wait(200);
        }

        cy.getElementByTestId('savedObjectsManagementDuplicate', {
          timeout: 10000,
        })
          .should('not.be.disabled')
          .click({ force: true });
        cy.wait(1000);

        cy.getElementByTestId('savedObjectsDuplicateModal', {
          timeout: 20000,
        }).should('be.visible');
      });
    });

    describe('Partial copy assets', () => {
      it('should handle missing data source case', () => {
        cy.loadSampleDataForWorkspace(
          'ecommerce',
          sourceWorkspaceId,
          dataSourceId2
        );

        createTargetWorkspace(dataSourceId2).then(() => {
          miscUtils.visitPage(`w/${sourceWorkspaceId}/app/objects`);
          cy.wait(3000);
          waitForTableStable();
          cy.wait(2000);

          cy.getElementByTestId('duplicateObjects')
            .should('not.be.disabled')
            .click({ force: true });
          cy.wait(3000);

          cy.getElementByTestId('savedObjectsDuplicateModal', {
            timeout: 30000,
          })
            .should('be.visible')
            .within(() => {
              cy.contains(/\d+/).should('be.visible');
              cy.getElementByTestId('duplicateConfirmButton').should(
                'be.visible'
              );
              cy.getElementByTestId('comboBoxToggleListButton', {
                timeout: 10000,
              }).click({ force: true });
            });
          cy.get('.euiFilterSelectItem', { timeout: 15000 })
            .contains(targetWorkspaceName)
            .should('be.visible')
            .click({ force: true });
          cy.wait(500);

          cy.getElementByTestId('duplicateConfirmButton').click({
            force: true,
          });

          cy.wait('@copyAssetsRequest');

          cy.get(
            '.euiFlyout[class*="euiFlyout--medium"], .euiFlyout:not(.context-nav-wrapper)',
            { timeout: 20000 }
          )
            .should('be.visible')
            .within(() => {
              cy.contains('Missing Data Source').should('be.visible');
              cy.contains('button', 'Copy remaining').click({ force: true });
            });

          cy.wait('@copyAssetsRequest')
            .its('response.statusCode')
            .should('eq', 200);

          cy.get(
            '.euiFlyout[class*="euiFlyout--medium"], .euiFlyout:not(.context-nav-wrapper)'
          ).contains(/\d+\s+Successful/);

          miscUtils.visitPage(`w/${targetWorkspaceId}/app/objects`);
          cy.wait(3000);
          waitForTableStable();
          cy.getElementByTestId('savedObjectsTable')
            .find('.euiTableRow')
            .should('have.length.at.least', 1);
        });
      });
    });
  }
};
