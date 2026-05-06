/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

export const WorkspaceCreateTestCases = () => {
  const miscUtils = new MiscUtils(cy);
  const workspaceName = 'test_workspace_az3RBx6cE';
  const MDSEnabled = Cypress.env('DATASOURCE_MANAGEMENT_ENABLED');

  const inputWorkspaceName = (workspaceName) => {
    const nameInputTestId = 'workspaceForm-workspaceDetails-nameInputText';
    // V9->V13 fix: Use type with selectall to clear, avoiding invoke() which causes DOM detachment in V13
    cy.getElementByTestId(nameInputTestId, { timeout: 30000 })
      .should('be.visible')
      .should('not.be.disabled')
      .type('{selectall}', { force: true });

    // V9->V13 fix: Delete selected text in separate command
    cy.getElementByTestId(nameInputTestId).type('{del}', { force: true });

    // V9->V13 fix: Re-query element and type new value
    cy.getElementByTestId(nameInputTestId)
      .should('have.value', '')
      .type(workspaceName, { force: true, delay: 0 });
  };

  const inputWorkspaceDescription = (description) => {
    const descriptionInputTestId =
      'workspaceForm-workspaceDetails-descriptionInputText';
    // V9->V13 fix: Use type with selectall to clear, avoiding invoke() which causes DOM detachment in V13
    cy.getElementByTestId(descriptionInputTestId, { timeout: 30000 })
      .should('be.visible')
      .should('not.be.disabled')
      .type('{selectall}', { force: true });

    // V9->V13 fix: Delete selected text in separate command
    cy.getElementByTestId(descriptionInputTestId).type('{del}', {
      force: true,
    });

    // V9->V13 fix: Re-query element and type new value
    cy.getElementByTestId(descriptionInputTestId)
      .should('have.value', '')
      .type(description, { force: true, delay: 0 });
  };

  const inputDataSourceWhenMDSEnabled = (dataSourceTitle) => {
    if (!MDSEnabled) {
      return;
    }
    cy.getElementByTestId('workspace-creator-dataSources-assign-button', {
      timeout: 30000,
    })
      .should('be.visible')
      .click({ force: true });

    // Wait for the associate modal to fully load and render data source list
    cy.getElementByTestId(
      'workspace-detail-dataSources-associateModal-save-button',
      { timeout: 30000 }
    ).should('exist');

    cy.get(`li[title="${dataSourceTitle}"]`, { timeout: 30000 })
      .should('be.visible')
      .click({ force: true });

    cy.getElementByTestId(
      'workspace-detail-dataSources-associateModal-save-button',
      { timeout: 30000 }
    )
      .should('be.visible')
      .click({ force: true });
  };

  if (Cypress.env('WORKSPACE_ENABLED')) {
    describe('Create workspace', () => {
      let dataSourceTitle;
      before(() => {
        cy.deleteWorkspaceByName(workspaceName);
        if (MDSEnabled) {
          cy.deleteAllDataSources();
          cy.createDataSourceNoAuth().then((result) => {
            dataSourceTitle = result[1];
          });
        }
      });

      beforeEach(() => {
        // Visit workspace create page
        miscUtils.visitPage('app/workspace_create');

        // Cypress V13 fix: Wait for page to load
        cy.contains('Create a workspace', { timeout: 60000 });

        cy.intercept('POST', '/api/workspaces').as('createWorkspaceRequest');
      });

      after(() => {
        cy.deleteWorkspaceByName(workspaceName);
        if (MDSEnabled) {
          cy.deleteAllDataSources();
        }
      });

      it('should successfully load the page', () => {
        cy.contains('Create a workspace', { timeout: 60000 }).should(
          'be.visible'
        );
      });

      describe('Create a workspace successfully', () => {
        it('should successfully create a workspace', () => {
          inputWorkspaceName(workspaceName);
          inputWorkspaceDescription('test_workspace_description.+~!');
          cy.getElementByTestId('workspaceUseCase-observability', {
            timeout: 30000,
          })
            .should('be.visible')
            .click({ force: true });
          inputDataSourceWhenMDSEnabled(dataSourceTitle);

          // Cypress V13 fix: Wait for button to be ready
          cy.getElementByTestId('workspaceForm-bottomBar-createButton', {
            timeout: 30000,
          })
            .should('be.visible')
            .should('exist')
            .should('not.be.disabled')
            .click({ force: true });

          let workspaceId;
          cy.wait('@createWorkspaceRequest').then((interception) => {
            expect(interception.response.statusCode).to.equal(200);
            workspaceId = interception.response.body.result.id;

            cy.location('pathname', { timeout: 6000 }).should(
              'include',
              `w/${workspaceId}/app`
            );

            const expectedWorkspace = {
              name: workspaceName,
              description: 'test_workspace_description.+~!',
              features: ['use-case-observability'],
            };
            cy.checkWorkspace(workspaceId, expectedWorkspace);
          });
        });

        it('should successfully create a workspace from home page', () => {
          cy.deleteWorkspaceByName(workspaceName);
          miscUtils.visitPage('app/workspace_initial');

          // Cypress V13 fix: Use alias for buttons
          cy.getElementByTestId(
            'workspace-initial-card-createWorkspace-button',
            { timeout: 30000 }
          )
            .should('be.visible')
            .click({ force: true });

          cy.getElementByTestId(
            'workspace-initial-button-create-observability-workspace',
            { timeout: 30000 }
          )
            .should('be.visible')
            .click({ force: true });

          // Cypress V13 fix: Wait for checkbox to be checked
          cy.contains('Observability')
            .first()
            .closest('.euiCheckableCard-isChecked')
            .should('exist');

          miscUtils.visitPage('app/workspace_initial');

          cy.getElementByTestId(
            'workspace-initial-useCaseCard-security-analytics-button-createWorkspace',
            { timeout: 30000 }
          )
            .should('be.visible')
            .click({ force: true });

          cy.contains('Security Analytics')
            .first()
            .closest('.euiCheckableCard-isChecked')
            .should('exist');

          inputWorkspaceName(workspaceName);
          inputDataSourceWhenMDSEnabled(dataSourceTitle);

          // Cypress V13 fix: Use alias for create button
          cy.getElementByTestId('workspaceForm-bottomBar-createButton', {
            timeout: 30000,
          })
            .should('be.visible')
            .should('exist')
            .should('not.be.disabled')
            .click({ force: true });

          let workspaceId;
          cy.wait('@createWorkspaceRequest').then((interception) => {
            expect(interception.response.statusCode).to.equal(200);
            workspaceId = interception.response.body.result.id;

            cy.location('pathname', { timeout: 6000 }).should(
              'include',
              `w/${workspaceId}/app`
            );

            const expectedWorkspace = {
              name: workspaceName,
              features: ['use-case-security-analytics'],
            };
            cy.checkWorkspace(workspaceId, expectedWorkspace);
          });
        });

        if (
          Cypress.env('SAVED_OBJECTS_PERMISSION_ENABLED') &&
          Cypress.env('SECURITY_ENABLED')
        ) {
          it('should successfully jump to collaborators page after creating a workspace', () => {
            cy.deleteWorkspaceByName(workspaceName);
            inputWorkspaceName(workspaceName);
            inputDataSourceWhenMDSEnabled(dataSourceTitle);

            // Cypress V13 fix: Use alias for checkbox
            cy.getElementByTestId('jumpToCollaboratorsCheckbox', {
              timeout: 30000,
            })
              .should('be.visible')
              .should('exist')
              .click({ force: true });

            cy.getElementByTestId('workspaceForm-bottomBar-createButton', {
              timeout: 30000,
            })
              .should('be.visible')
              .should('exist')
              .should('not.be.disabled')
              .click({ force: true });

            let workspaceId;
            cy.wait('@createWorkspaceRequest').then((interception) => {
              expect(interception.response.statusCode).to.equal(200);
              workspaceId = interception.response.body.result.id;

              cy.location('pathname', { timeout: 6000 }).should(
                'include',
                `w/${workspaceId}/app/workspace_collaborators`
              );
            });
          });

          it('should creating a workspace with privacy setting', () => {
            cy.deleteWorkspaceByName(workspaceName);
            inputWorkspaceName(workspaceName);
            inputDataSourceWhenMDSEnabled(dataSourceTitle);

            // V13 Fix: EUI radio buttons have an invisible <input> element.
            // We should use force: true and wait for visibility
            cy.get('#anyone-can-edit', { timeout: 30000 })
              .should('exist')
              .click({ force: true });

            // Cypress V13 fix: Use alias for checkbox
            cy.getElementByTestId('jumpToCollaboratorsCheckbox', {
              timeout: 30000,
            })
              .should('be.visible')
              .should('be.enabled')
              .click({ force: true });

            // Cypress V13 fix: Wait for button and use alias
            cy.getElementByTestId('workspaceForm-bottomBar-createButton', {
              timeout: 30000,
            })
              .should('be.visible')
              .should('exist')
              .should('not.be.disabled')
              .click({ force: true });

            let workspaceId;
            cy.wait('@createWorkspaceRequest').then((interception) => {
              expect(interception.response.statusCode).to.equal(200);
              workspaceId = interception.response.body.result.id;

              cy.location('pathname', { timeout: 6000 }).should(
                'include',
                `w/${workspaceId}/app/workspace_collaborators`
              );

              cy.contains('Anyone can edit').should('be.visible');
            });
          });
        }

        it('should correctly display the summary card', () => {
          inputWorkspaceName(workspaceName);
          inputWorkspaceDescription('test_workspace_description.+~!');
          cy.getElementByTestId('workspaceUseCase-essentials', {
            timeout: 30000,
          })
            .should('be.visible')
            .click({ force: true });
          inputDataSourceWhenMDSEnabled(dataSourceTitle);

          // Cypress V13 fix: Use alias for summary card
          cy.get('.workspaceCreateRightSidebar', { timeout: 30000 })
            .should('be.visible')
            .as('summaryCard')
            .within(() => {
              cy.contains(workspaceName).should('exist');
              cy.contains('test_workspace_description.+~!').should('exist');
              cy.contains('Essentials').should('exist');
              if (MDSEnabled) {
                cy.contains(dataSourceTitle).should('exist');
              }
            });
        });
      });

      describe('Validate workspace name and description', () => {
        it('workspace name is required', () => {
          // V9->V13 fix: Use selectall+del to clear, avoiding invoke() which causes DOM detachment in V13
          cy.getElementByTestId(
            'workspaceForm-workspaceDetails-nameInputText',
            { timeout: 30000 }
          )
            .should('not.be.disabled')
            .type('{selectall}', { force: true });

          cy.getElementByTestId(
            'workspaceForm-workspaceDetails-nameInputText',
            { timeout: 30000 }
          ).type('{del}', { force: true });

          // V9->V13 fix: Verify value is cleared
          cy.getElementByTestId(
            'workspaceForm-workspaceDetails-nameInputText',
            { timeout: 30000 }
          ).should('have.value', '');

          inputDataSourceWhenMDSEnabled(dataSourceTitle);

          // V9->V13 fix: Use alias for create button
          cy.getElementByTestId('workspaceForm-bottomBar-createButton', {
            timeout: 30000,
          })
            .should('be.visible')
            .should('exist')
            .click({ force: true });

          cy.contains('Enter a name.').should('exist');
        });

        it('workspace name is not valid', () => {
          inputWorkspaceName('./+');
          inputWorkspaceDescription('test_workspace_description');
          inputDataSourceWhenMDSEnabled(dataSourceTitle);

          // Cypress V13 fix: Use alias for create button
          cy.getElementByTestId('workspaceForm-bottomBar-createButton', {
            timeout: 30000,
          })
            .should('be.visible')
            .should('exist')
            .click({ force: true });

          cy.contains('Enter a valid name.').should('exist');
        });

        it('workspace name cannot use an existing name', () => {
          cy.deleteWorkspaceByName(workspaceName);
          cy.createWorkspace({
            name: workspaceName,
            features: ['use-case-observability'],
          });
          inputWorkspaceName(workspaceName);
          inputWorkspaceDescription('test_workspace_description');
          cy.getElementByTestId('workspaceUseCase-observability', {
            timeout: 30000,
          })
            .should('be.visible')
            .click({ force: true });
          inputDataSourceWhenMDSEnabled(dataSourceTitle);

          // Cypress V13 fix: Use alias for create button
          cy.getElementByTestId('workspaceForm-bottomBar-createButton', {
            timeout: 30000,
          })
            .should('be.visible')
            .should('exist')
            .click({ force: true });

          cy.contains('workspace name has already been used').should('exist');
        });
      });

      if (MDSEnabled) {
        describe('Create a workspace with associated data sources', () => {
          before(() => {
            cy.deleteWorkspaceByName(workspaceName);
          });

          it('should be exists inside workspace data source list', () => {
            // V9->V13 fix: Ensure intercept is set up before any actions
            cy.intercept('POST', '/api/workspaces').as(
              'createWorkspaceRequest'
            );

            inputWorkspaceName(workspaceName);
            inputWorkspaceDescription('test_workspace_description');
            cy.getElementByTestId('workspaceUseCase-observability', {
              timeout: 30000,
            })
              .should('be.visible')
              .click({ force: true });
            inputDataSourceWhenMDSEnabled(dataSourceTitle);

            // V9->V13 fix: Use alias for create button
            cy.getElementByTestId('workspaceForm-bottomBar-createButton', {
              timeout: 30000,
            })
              .should('be.visible')
              .should('exist')
              .should('not.be.disabled')
              .click({ force: true });

            // V9->V13 fix: Wait for request with longer timeout
            cy.wait('@createWorkspaceRequest', { timeout: 60000 })
              .then((interception) => {
                expect(interception.response.statusCode).to.equal(200);
                return interception.response.body.result.id;
              })
              .then((workspaceId) => {
                const dataSourcePathname = `w/${workspaceId}/app/dataSources`;
                miscUtils.visitPage(dataSourcePathname);
                cy.location('pathname', { timeout: 6000 }).should(
                  'include',
                  dataSourcePathname
                );
                cy.contains(dataSourceTitle).should('exist');
              });
          });
        });
      }

      if (
        Cypress.env('SAVED_OBJECTS_PERMISSION_ENABLED') &&
        Cypress.env('SECURITY_ENABLED')
      ) {
        describe('Create a workspace with permissions successfully', () => {
          before(() => {
            cy.deleteWorkspaceByName(workspaceName);
          });

          it('should successfully create a workspace with permissions', () => {
            // V9->V13 fix: Ensure intercept is set up before any actions
            cy.intercept('POST', '/api/workspaces').as(
              'createWorkspaceRequest'
            );

            inputWorkspaceName(workspaceName);
            inputWorkspaceDescription('test_workspace_description');
            cy.getElementByTestId('workspaceUseCase-observability', {
              timeout: 30000,
            })
              .should('be.visible')
              .click({ force: true });
            inputDataSourceWhenMDSEnabled(dataSourceTitle);

            // V9->V13 fix: Use alias for create button
            cy.getElementByTestId('workspaceForm-bottomBar-createButton', {
              timeout: 30000,
            })
              .should('be.visible')
              .should('exist')
              .should('not.be.disabled')
              .click({ force: true });

            let workspaceId;
            // V9->V13 fix: Wait for request with longer timeout
            cy.wait('@createWorkspaceRequest', { timeout: 60000 }).then(
              (interception) => {
                expect(interception.response.statusCode).to.equal(200);
                workspaceId = interception.response.body.result.id;
                cy.location('pathname', { timeout: 6000 }).should(
                  'include',
                  `w/${workspaceId}/app`
                );
                const expectedWorkspace = {
                  name: workspaceName,
                  description: 'test_workspace_description',
                  features: ['use-case-observability'],
                  permissions: {
                    write: {
                      users: [`${Cypress.env('username')}`],
                    },
                    library_write: {
                      users: [`${Cypress.env('username')}`],
                    },
                  },
                };
                cy.checkWorkspace(workspaceId, expectedWorkspace);
              }
            );
          });
        });
      }
    });
  }
};
