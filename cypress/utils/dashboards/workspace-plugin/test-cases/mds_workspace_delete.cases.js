/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { BASE_PATH } from '../../../base_constants';

export const WorkspaceDeleteTestCases = () => {
  const miscUtils = new MiscUtils(cy);
  const workspace1Name = 'test_workspace_320sdfouAz';
  let workspace1Description = 'This is a workspace1 description.';
  const workspace2Name = 'test_workspace_321sdfouAz';
  let workspace2Description = 'This is a workspace2 description.';

  let workspace1Id;
  let workspace2Id;

  if (Cypress.env('WORKSPACE_ENABLED')) {
    describe('Delete Workspace(s) in 2 ways in workspace list page', () => {
      before(() => {
        cy.deleteWorkspaceByName(workspace1Name);
        cy.deleteWorkspaceByName(workspace2Name);
      });
      beforeEach(() => {
        cy.createWorkspace({
          name: workspace1Name,
          description: workspace1Description,
          features: ['use-case-observability'],
          settings: {
            permissions: {
              library_write: { users: ['%me%'] },
              write: { users: ['%me%'] },
            },
          },
        }).then((value) => {
          workspace1Id = value;
          cy.intercept('DELETE', `/api/workspaces/${workspace1Id}`).as(
            'deleteWorkspace1Request'
          );
        });

        cy.createWorkspace({
          name: workspace2Name,
          description: workspace2Description,
          features: ['use-case-search'],
          settings: {
            permissions: {
              library_write: { users: ['%me%'] },
              write: { users: ['%me%'] },
            },
          },
        }).then((value) => {
          workspace2Id = value;
          cy.intercept('DELETE', `/api/workspaces/${workspace2Id}`).as(
            'deleteWorkspace2Request'
          );
        });
        // Visit workspace list page
        miscUtils.visitPage(`/app/workspace_list`);
      });

      afterEach(() => {
        cy.deleteWorkspaceByName(workspace1Name);
        cy.deleteWorkspaceByName(workspace2Name);
      });

      describe('delete a workspace successfully using action buttons', () => {
        it('should successfully load delete button and show delete modal when clicking action button', () => {
          cy.contains(workspace1Name).should('be.visible');
          cy.getElementByTestId(`checkboxSelectRow-${workspace1Id}`)
            .parents('tr')
            .within(() => {
              cy.getElementByTestId('euiCollapsedItemActionsButton').click();
            });
          cy.getElementByTestId('workspace-list-delete-icon').should(
            'be.visible'
          );
          cy.getElementByTestId('workspace-list-delete-icon').click();
          cy.contains('Delete workspace').should('be.visible');
          cy.contains(
            'The following workspace will be permanently deleted. This action cannot be undone'
          ).should('be.visible');
          cy.contains(workspace1Name).should('be.visible');
          cy.getElementByTestId('delete-workspace-modal-input').type('delete');
          cy.getElementByTestId('delete-workspace-modal-confirm').click();
          cy.wait('@deleteWorkspace1Request').then((interception) => {
            expect(interception.response.statusCode).to.equal(200);
          });
          cy.location('pathname').should('include', 'app/workspace_list');
          cy.contains('workspaces deleted successfully').should('be.visible');
          cy.contains(workspace1Name).should('not.exist');
        });
      });

      describe('delete workspace(s) successfully using multi-deletion button', () => {
        it('should successfully show multi-deletion button and perform deletion when choosing one workspace', () => {
          cy.contains(workspace1Name).should('be.visible');
          cy.getElementByTestId(`checkboxSelectRow-${workspace1Id}`).click();
          cy.getElementByTestId('multi-deletion-button').should('be.visible');
          cy.getElementByTestId('multi-deletion-button').click();
          cy.contains('Delete workspace').should('be.visible');
          cy.contains(
            'The following workspace will be permanently deleted. This action cannot be undone'
          ).should('be.visible');
          cy.contains(workspace1Name).should('be.visible');
          cy.getElementByTestId('delete-workspace-modal-input').type('delete');
          cy.getElementByTestId('delete-workspace-modal-confirm').click();
          cy.wait('@deleteWorkspace1Request').then((interception) => {
            expect(interception.response.statusCode).to.equal(200);
          });
          cy.location('pathname').should('include', 'app/workspace_list');
          cy.contains('workspaces deleted successfully').should('be.visible');
          cy.contains(workspace1Name).should('not.exist');
        });

        it('should successfully delete all', () => {
          cy.contains(workspace1Name).should('be.visible');
          cy.contains(workspace2Name).should('be.visible');
          cy.getElementByTestId('checkboxSelectAll').click();
          cy.getElementByTestId('multi-deletion-button').should('be.visible');
          cy.getElementByTestId('multi-deletion-button').click();
          cy.contains('Delete workspace').should('be.visible');
          cy.contains(
            'The following workspace will be permanently deleted. This action cannot be undone'
          ).should('be.visible');
          cy.contains(workspace1Name).should('be.visible');
          cy.contains(workspace2Name).should('be.visible');
          cy.getElementByTestId('delete-workspace-modal-input').type('delete');
          cy.getElementByTestId('delete-workspace-modal-confirm').click();
          cy.wait('@deleteWorkspace1Request').then((interception) => {
            expect(interception.response.statusCode).to.equal(200);
          });
          cy.location('pathname').should('include', 'app/workspace_list');
          cy.contains('workspaces deleted successfully').should('be.visible');
          cy.contains(workspace1Name).should('not.exist');
          cy.contains(workspace2Name).should('not.exist');
        });
      });
    });

    describe('Workspace deletion in workspace detail page', () => {
      before(() => {
        cy.deleteWorkspaceByName(workspace1Name);
        cy.createWorkspace({
          name: workspace1Name,
          description: workspace1Description,
          features: ['use-case-observability'],
          settings: {
            permissions: {
              library_write: { users: ['%me%'] },
              write: { users: ['%me%'] },
            },
          },
        }).then((value) => {
          workspace1Id = value;
        });
      });

      beforeEach(() => {
        cy.intercept(
          'DELETE',
          `/w/${workspace1Id}/api/workspaces/${workspace1Id}`
        ).as('deleteWorkspace1Request');
        // Visit workspace detail page
        miscUtils.visitPage(`w/${workspace1Id}/app/workspace_detail`);
      });

      it('should delete workspace in workspace detail page', () => {
        cy.getElementByTestId('workspace-detail-delete-button').click();
        cy.contains('Delete workspace').should('be.visible');
        cy.contains(workspace1Name).should('be.visible');
        cy.getElementByTestId('delete-workspace-modal-input').type(
          workspace1Name
        );
        cy.getElementByTestId('delete-workspace-modal-confirm').click();
        cy.wait('@deleteWorkspace1Request').then((interception) => {
          expect(interception.response.statusCode).to.equal(200);
        });
        cy.contains('workspaces deleted successfully').should('be.visible');
        cy.location('pathname').should('include', 'app/workspace_list');
        cy.contains(workspace1Name).should('not.exist');
      });
    });

    describe('Delete workspace with saved objects cleanup verification', () => {
      const testWorkspaceName = 'test_workspace_saved_objects_cleanup';
      let testWorkspaceId;
      let datasourceId = '';

      before(() => {
        cy.deleteWorkspaceByName(testWorkspaceName);

        if (Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')) {
          cy.createDataSourceNoAuth().then((result) => {
            datasourceId = result[0];
            expect(datasourceId).to.be.a('string').that.is.not.empty;
          });
        }
      });

      beforeEach(() => {
        cy.createWorkspace({
          name: testWorkspaceName,
          description: 'Test workspace for saved objects cleanup verification',
          features: ['use-case-observability'],
          settings: {
            permissions: {
              library_write: { users: ['%me%'] },
              write: { users: ['%me%'] },
            },
            ...(datasourceId ? { dataSources: [datasourceId] } : {}),
          },
        }).then((value) => {
          testWorkspaceId = value;
        });
      });

      afterEach(() => {
        cy.deleteWorkspaceByName(testWorkspaceName);
      });

      after(() => {
        if (Cypress.env('DATASOURCE_MANAGEMENT_ENABLED') && datasourceId) {
          cy.deleteDataSource(datasourceId);
        }
      });

      it('should automatically delete saved objects when workspace is deleted', () => {
        // Add sample data to create saved objects in the workspace
        cy.loadSampleDataForWorkspace(
          'ecommerce',
          testWorkspaceId,
          datasourceId
        );

        // Verify saved objects exist in the workspace
        cy.visit(`${BASE_PATH}/w/${testWorkspaceId}/app/objects`);
        cy.getElementByTestId('savedObjectsTableRowTitle').should('exist');

        // Search for ecommerce sample data objects
        cy.getElementByTestId('savedObjectSearchBar')
          .type('opensearch_dashboards_sample_data_ecommerce{enter}')
          .trigger('search');

        // Verify we have saved objects
        cy.getElementByTestId('savedObjectsTableRowTitle').should(
          'have.length.greaterThan',
          0
        );

        // Get the saved object IDs that are associated with this workspace
        cy.request({
          url: `${BASE_PATH}/api/opensearch-dashboards/management/saved_objects/_find?workspaces=${testWorkspaceId}&page=1&perPage=100&type=index-pattern&type=visualization&type=dashboard&type=search&type=config`,
          headers: {
            'Osd-Xsrf': 'osd-fetch',
          },
        }).then((resp) => {
          const savedObjectsInWorkspace = resp.body.saved_objects;
          expect(savedObjectsInWorkspace).to.have.length.greaterThan(0);

          // Store the saved object IDs for verification after deletion
          const savedObjectIds = savedObjectsInWorkspace.map((obj) => ({
            type: obj.type,
            id: obj.id,
          }));

          // Delete the workspace
          cy.visit(`${BASE_PATH}/app/workspace_list`);
          cy.contains(testWorkspaceName).should('be.visible');

          // Find and click the delete button for this workspace
          cy.getElementByTestId(`checkboxSelectRow-${testWorkspaceId}`)
            .parents('tr')
            .within(() => {
              cy.getElementByTestId('euiCollapsedItemActionsButton').click();
            });

          cy.getElementByTestId('workspace-list-delete-icon').should(
            'be.visible'
          );
          cy.getElementByTestId('workspace-list-delete-icon').click();

          // Confirm deletion
          cy.contains('Delete workspace').should('be.visible');
          cy.getElementByTestId('delete-workspace-modal-input').type('delete');
          cy.getElementByTestId('delete-workspace-modal-confirm').click();

          // Wait for deletion to complete
          cy.contains('workspaces deleted successfully').should('be.visible');
          cy.contains(testWorkspaceName).should('not.exist');

          // Check each saved object to ensure it no longer exists
          savedObjectIds.forEach(({ type, id }) => {
            cy.request({
              method: 'GET',
              url: `${BASE_PATH}/api/saved_objects/${type}/${id}`,
              failOnStatusCode: false,
              headers: {
                'Osd-Xsrf': 'osd-fetch',
              },
            }).then((response) => {
              // The saved object should be deleted (404) or not accessible
              expect(response.status).to.be.oneOf([404, 403]);
            });
          });

          // Verify saved objects are not visible in global saved objects management
          cy.visit(`${BASE_PATH}/app/objects`);

          // Search for the ecommerce sample data that was in the deleted workspace
          cy.getElementByTestId('savedObjectSearchBar')
            .clear()
            .type('opensearch_dashboards_sample_data_ecommerce{enter}')
            .trigger('search');

          // Should not find any saved objects from the deleted workspace
          // (or significantly fewer if some were shared with other workspaces)
          cy.get('body').then(($body) => {
            if (
              $body.find('[data-test-subj="savedObjectsTableRowTitle"]')
                .length > 0
            ) {
              // If there are still some objects, they should not belong to the deleted workspace
              cy.getElementByTestId('savedObjectsTableRowTitle').each(($el) => {
                // Check that none of these objects have the deleted workspace ID
                cy.wrap($el).should('not.contain', testWorkspaceId);
              });
            } else {
              // No objects found, which is expected
              cy.get('[data-test-subj="savedObjectsTableRowTitle"]').should(
                'not.exist'
              );
            }
          });
        });
      });

      it('should delete workspace with multiple types of saved objects', () => {
        // Create an index pattern
        cy.request({
          method: 'POST',
          url: `${BASE_PATH}/w/${testWorkspaceId}/api/saved_objects/index-pattern`,
          headers: {
            'content-type': 'application/json;charset=UTF-8',
            'osd-xsrf': true,
          },
          body: JSON.stringify({
            attributes: {
              title: 'test-index-pattern-*',
              timeFieldName: '@timestamp',
            },
            references: [],
          }),
        }).then((indexPatternResp) => {
          const indexPatternId = indexPatternResp.body.id;

          // Create a visualization
          cy.request({
            method: 'POST',
            url: `${BASE_PATH}/w/${testWorkspaceId}/api/saved_objects/visualization`,
            headers: {
              'content-type': 'application/json;charset=UTF-8',
              'osd-xsrf': true,
            },
            body: JSON.stringify({
              attributes: {
                title: 'Test Visualization',
                visState: JSON.stringify({
                  title: 'Test Visualization',
                  type: 'histogram',
                  params: {},
                  aggs: [],
                }),
                uiStateJSON: '{}',
                description: '',
                version: 1,
                kibanaSavedObjectMeta: {
                  searchSourceJSON: JSON.stringify({
                    index: indexPatternId,
                    query: { match_all: {} },
                  }),
                },
              },
              references: [
                {
                  name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
                  type: 'index-pattern',
                  id: indexPatternId,
                },
              ],
            }),
          }).then((visualizationResp) => {
            const visualizationId = visualizationResp.body.id;

            // Create a dashboard
            cy.request({
              method: 'POST',
              url: `${BASE_PATH}/w/${testWorkspaceId}/api/saved_objects/dashboard`,
              headers: {
                'content-type': 'application/json;charset=UTF-8',
                'osd-xsrf': true,
              },
              body: JSON.stringify({
                attributes: {
                  title: 'Test Dashboard',
                  hits: 0,
                  description: 'Test dashboard for workspace deletion',
                  panelsJSON: JSON.stringify([
                    {
                      version: '7.9.0',
                      gridData: { x: 0, y: 0, w: 24, h: 15, i: '1' },
                      panelIndex: '1',
                      embeddableConfig: {},
                      panelRefName: 'panel_1',
                    },
                  ]),
                  optionsJSON: JSON.stringify({
                    useMargins: true,
                    syncColors: false,
                    hidePanelTitles: false,
                  }),
                  version: 1,
                  timeRestore: false,
                  kibanaSavedObjectMeta: {
                    searchSourceJSON: JSON.stringify({
                      query: { query: '', language: 'kuery' },
                      filter: [],
                    }),
                  },
                },
                references: [
                  {
                    name: 'panel_1',
                    type: 'visualization',
                    id: visualizationId,
                  },
                ],
              }),
            }).then((dashboardResp) => {
              const dashboardId = dashboardResp.body.id;

              // Verify all saved objects exist in the workspace
              cy.visit(`${BASE_PATH}/w/${testWorkspaceId}/app/objects`);
              cy.getElementByTestId('savedObjectsTableRowTitle').should(
                'have.length.greaterThan',
                2
              );

              // Delete the workspace
              cy.visit(`${BASE_PATH}/app/workspace_list`);
              cy.contains(testWorkspaceName).should('be.visible');

              cy.getElementByTestId(`checkboxSelectRow-${testWorkspaceId}`)
                .parents('tr')
                .within(() => {
                  cy.getElementByTestId(
                    'euiCollapsedItemActionsButton'
                  ).click();
                });

              cy.getElementByTestId('workspace-list-delete-icon').click();
              cy.contains('Delete workspace').should('be.visible');
              cy.getElementByTestId('delete-workspace-modal-input').type(
                'delete'
              );
              cy.getElementByTestId('delete-workspace-modal-confirm').click();

              cy.contains('workspaces deleted successfully').should(
                'be.visible'
              );

              // Verify all saved objects are deleted
              const savedObjectsToCheck = [
                { type: 'index-pattern', id: indexPatternId },
                { type: 'visualization', id: visualizationId },
                { type: 'dashboard', id: dashboardId },
              ];

              savedObjectsToCheck.forEach(({ type, id }) => {
                cy.request({
                  method: 'GET',
                  url: `${BASE_PATH}/api/saved_objects/${type}/${id}`,
                  failOnStatusCode: false,
                  headers: {
                    'Osd-Xsrf': 'osd-fetch',
                  },
                }).then((response) => {
                  expect(response.status).to.be.oneOf([404, 403]);
                });
              });
            });
          });
        });
      });
    });
  }
};
