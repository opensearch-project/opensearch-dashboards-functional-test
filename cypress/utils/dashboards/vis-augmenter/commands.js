/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { BASE_PATH } from '../../constants';

Cypress.Commands.add('getVisPanelByTitle', (title) =>
  cy.get(`[data-title="${title}"]`).parents('.embPanel').should('be.visible')
);

Cypress.Commands.add('openVisContextMenu', { prevSubject: true }, (panel) =>
  cy
    .wrap(panel)
    .find(`[data-test-subj="embeddablePanelContextMenuClosed"]`)
    .click()
    .then(() => cy.get('.euiContextMenu'))
);

Cypress.Commands.add(
  'clickVisPanelMenuItem',
  { prevSubject: 'optional' },
  (menu, text) =>
    (menu ? cy.wrap(menu) : cy.get('.euiContextMenu'))
      .find('button')
      .contains(text)
      .click()
      .then(() => cy.get('.euiContextMenu'))
);

Cypress.Commands.add('getMenuItems', { prevSubject: 'optional' }, (menu) =>
  (menu ? cy.wrap(menu) : cy.get('.euiContextMenu')).find('button')
);

Cypress.Commands.add('visitDashboard', (dashboardName) => {
  cy.visit(`${BASE_PATH}/app/dashboards`);
  cy.get('.euiFieldSearch').type(dashboardName);
  cy.wait(1000);
  cy.get('[data-test-subj="itemsInMemTable"]').contains(dashboardName).click({
    force: true,
  });
});
