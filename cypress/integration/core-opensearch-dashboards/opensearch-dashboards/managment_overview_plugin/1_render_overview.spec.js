/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../../utils/base_constants';

describe('Management overview rendering', () => {
  it('should show dev tools', function () {
    cy.visit(`${BASE_PATH}/app/opensearch_management_overview`);

    cy.getElementByTestId('link-dev_tools').should('exist').click();

    cy.url().should('contain', '/app/dev_tools');
  });

  it('should show dashboard management', function () {
    cy.visit(`${BASE_PATH}/app/opensearch_management_overview`);

    cy.getElementByTestId('link-management').should('exist').click();

    cy.url().should('contain', '/app/management');
  });
});
