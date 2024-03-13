/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../utils/constants';

if (Cypress.env('DASHBOARDS_WORKSPACE_ENABLED')) {
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
          expect(res.body.success).to.eql(true);
        });
      });
    });
  });
}
