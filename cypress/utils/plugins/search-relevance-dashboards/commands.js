/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { BACKEND_BASE_PATH } from '../../base_constants';

Cypress.Commands.add('enableSearchRelevanceWorkbench', () => {
  cy.request({
    method: 'PUT',
    url: `${BACKEND_BASE_PATH}/_cluster/settings`,
    body: {
      persistent: {
        'plugins.search_relevance.workbench_enabled': true,
      },
    },
    failOnStatusCode: false,
  });
});
