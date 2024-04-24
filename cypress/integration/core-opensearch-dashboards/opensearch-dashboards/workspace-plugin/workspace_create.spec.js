/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../../utils/constants';

if (Cypress.env('WORKSPACE_ENABLED')) {
  let workspaceId;
  describe('Workspace CRUD APIs', () => {
    describe('Create a workspace', () => {
      it('should successfully create a worksapce', () => {
        const body = {
          attributes: {
            name: 'test_workspace',
            description: 'test_workspace_description',
          },
        };
        cy.request({
          method: 'POST',
          url: `${BASE_PATH}/api/workspaces`,
          headers: {
            'osd-xsrf': true,
          },
          body: body,
        }).as('createWorkspace');
        cy.get('@createWorkspace').should((res) => {
          workspaceId = res.body.result.id;
          expect(res.body.success).to.eql(true);
        });
      });
    });
    after(() => {
      cy.request({
        method: 'DELETE',
        url: `${BASE_PATH}/api/workspaces/${workspaceId}`,
        headers: {
          'osd-xsrf': true,
        },
      });
    });
  });
}
