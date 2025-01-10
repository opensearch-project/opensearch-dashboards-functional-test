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

  const verifyDuplicateModalContent = (expectedContent) => {
    cy.getElementByTestId('savedObjectsDuplicateModal')
      .should('exist')
      .within(() => {
        cy.contains(`Copy ${expectedContent} to another workspace?`).should(
          'exist'
        );
        cy.getElementByTestId('duplicateCancelButton').should('exist');
        cy.getElementByTestId('duplicateConfirmButton').should('exist');

        cy.get('#includeReferencesDeep').should('exist').should('be.checked');
        cy.get('.euiCheckbox__label').contains(
          'Copy the selected asset and any related assets (recommended).'
        );

        // Click workspace combo box button
        cy.getElementByTestId('comboBoxToggleListButton')
          .should('exist')
          .click();
      });
    cy.get('.euiFilterSelectItem')
      .should('be.visible')
      .should('have.length', 2)
      .within(() => {
        cy.contains(`${sourceWorkspaceName} (current)`).should('be.visible');
        cy.contains(targetWorkspaceName).should('be.visible').click();
      });
  };

  const verifyDuplicateFunction = (expectedAssetCount, targetWorkspaceId) => {
    cy.getElementByTestId('duplicateConfirmButton').click();
    cy.wait('@copyAssetsRequest').then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
      expect(interception.response.body.success).to.equal(true);
      expect(interception.response.body.successCount).to.equal(
        expectedAssetCount
      );
    });

    const copyContent =
      expectedAssetCount > 1
        ? `${expectedAssetCount} assets copied`
        : `${expectedAssetCount} asset copied`;
    cy.get('.euiFlyout')
      .should('be.visible')
      .within(() => {
        cy.contains('Copy assets to ' + targetWorkspaceName);
        cy.contains(copyContent);
        cy.contains(`${expectedAssetCount} Successful`);
      });

    miscUtils.visitPage(`w/${targetWorkspaceId}/app/objects`);

    cy.contains(`Manage and share assets for ${targetWorkspaceName}.`);

    cy.getElementByTestId('savedObjectsTable')
      .find('tbody')
      .get('.euiTableRow')
      .should('have.length', expectedAssetCount);
  };

  const createTargetWorkspace = (dataSourceId) => {
    cy.createWorkspace({
      name: targetWorkspaceName,
      features: ['use-case-observability'],
      settings: {
        permissions: {
          library_write: { users: ['%me%'] },
          write: { users: ['%me%'] },
        },
        dataSources: [dataSourceId],
      },
    }).then((value) => {
      targetWorkspaceId = value;
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
          expect(dataSourceId2).to.not.be.undefined;
        })
        .then(() => {
          cy.createWorkspace({
            name: sourceWorkspaceName,
            features: ['use-case-observability'],
            settings: {
              permissions: {
                library_write: { users: ['%me%'] },
                write: { users: ['%me%'] },
              },
              dataSources: [dataSourceId1, dataSourceId2],
            },
          }).then((value) => {
            sourceWorkspaceId = value;
            // Import ecommerce sample data to dataSourceId1 of source workspace.
            cy.loadSampleDataForWorkspace(
              'ecommerce',
              sourceWorkspaceId,
              dataSourceId1
            );
          });
        });
    });

    after(() => {
      cy.wrap(null).then(() => {
        if (dataSourceId1) {
          cy.deleteDataSource(dataSourceId1);
        }
        if (dataSourceId2) {
          cy.deleteDataSource(dataSourceId2);
        }
      });
      cy.deleteAllWorkspaces();
    });

    beforeEach(() => {
      cy.intercept(
        'POST',
        `/w/${sourceWorkspaceId}/api/workspaces/_duplicate_saved_objects`
      ).as('copyAssetsRequest');
    });

    afterEach(() => {
      cy.deleteWorkspaceByName(targetWorkspaceName);
    });

    describe('Copy function', () => {
      beforeEach(() => {
        createTargetWorkspace(dataSourceId1);
        miscUtils.visitPage(`w/${sourceWorkspaceId}/app/objects`);
      });

      it('should successfully copy all assets from source workspace to target workspace', () => {
        // should pop up copy modal when user click the copy all button
        cy.getElementByTestId('duplicateObjects').should('exist').click();
        verifyDuplicateModalContent('14 assets');
        verifyDuplicateFunction(14, targetWorkspaceId);
      });

      it('should successfully copy single asset from source workspace to target workspace', () => {
        // should pop up copy modal when user click the single copy button
        cy.getElementByTestId('savedObjectsTable')
          .should('exist')
          .within(() => {
            cy.getElementByTestId('euiCollapsedItemActionsButton')
              .first()
              .should('exist')
              .click();
          });
        cy.getElementByTestId('savedObjectsTableAction-duplicate')
          .should('exist')
          .click();
        verifyDuplicateModalContent(
          `[eCommerce] Revenue Dashboard_${dataSourceTitle1}`
        );
        cy.get('#includeReferencesDeep').uncheck({
          force: true,
        });
        verifyDuplicateFunction(1, targetWorkspaceId);
      });

      it('should successfully copy selected assets from source workspace to target workspace', () => {
        // should pop up copy modal when user click the copy to button
        cy.getElementByTestId('savedObjectsTable')
          .find('tbody')
          .find('.euiCheckbox__input')
          .each(($checkbox, index) => {
            if (index < 2) {
              cy.wrap($checkbox).check({ force: true });
            }
          });

        cy.getElementByTestId('savedObjectsManagementDuplicate')
          .should('exist')
          .click();
        verifyDuplicateModalContent('2 assets');
        verifyDuplicateFunction(14, targetWorkspaceId);
      });
    });

    describe('Partial copy assets', () => {
      before(() => {
        // Import ecommerce sample data to dataSourceId2 of source workspace.
        cy.loadSampleDataForWorkspace(
          'ecommerce',
          sourceWorkspaceId,
          dataSourceId2
        );
        createTargetWorkspace(dataSourceId2);
        miscUtils.visitPage(`w/${sourceWorkspaceId}/app/objects`);
      });

      it('should not copy assets to target workspace without assigning related data source', () => {
        cy.getElementByTestId('duplicateObjects').should('exist').click();
        cy.getElementByTestId('savedObjectsDuplicateModal')
          .find('[data-test-subj="comboBoxToggleListButton"]')
          .should('exist')
          .click();

        cy.get('.euiFilterSelectItem')
          .should('be.visible')
          .within(() => {
            cy.contains(targetWorkspaceName).should('be.visible').click();
          });

        cy.getElementByTestId('duplicateConfirmButton').click();

        cy.wait('@copyAssetsRequest').then((interception) => {
          expect(interception.response.statusCode).to.equal(200);
          expect(interception.response.body.success).to.equal(false);
          expect(interception.response.body.successCount).to.equal(15);
        });

        cy.get('.euiFlyout')
          .should('be.visible')
          .within(() => {
            cy.contains('Copy assets to ' + targetWorkspaceName);
            cy.contains('Missing Data Source');
            cy.contains(
              `The following assets can not be copied, some of the data sources they use are not associated with ${targetWorkspaceName}`
            );
            cy.contains('Copy remaining 15 asset').should('exist').click();
          });

        // should successfully copy remaining assets from source workspace to target workspace
        cy.wait('@copyAssetsRequest').then((interception) => {
          expect(interception.response.statusCode).to.equal(200);
          expect(interception.response.body.success).to.equal(true);
          expect(interception.response.body.successCount).to.equal(15);
        });
        cy.get('.euiFlyout')
          .should('be.visible')
          .within(() => {
            cy.contains('Copy assets to ' + targetWorkspaceName);
            cy.contains('15 assets copied');
            cy.contains('15 Successful');
          });
        miscUtils.visitPage(`w/${targetWorkspaceId}/app/objects`);

        cy.contains(`Manage and share assets for ${targetWorkspaceName}.`);

        cy.getElementByTestId('savedObjectsTable')
          .find('tbody')
          .get('.euiTableRow')
          .should('have.length', 15);
      });
    });
  }
};
