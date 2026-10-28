/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function switchTenantTo(newTenant) {
  const switchId = Cypress._.uniqueId('tenantSwitch');
  const requestedTenant =
    newTenant === 'global'
      ? ''
      : newTenant === 'private'
      ? '__user__'
      : newTenant;
  let previousDocument;
  cy.document().then((document) => {
    previousDocument = document;
  });
  cy.intercept({
    method: 'GET',
    url: '/api/v1/auth/dashboardsinfo*',
  }).as(`${switchId}DashboardsInfo`);

  cy.intercept({
    method: 'GET',
    url: '/api/v1/configuration/account*',
  }).as(`${switchId}AccountInfo`);

  cy.getElementByTestId('account-popover').click({ force: true });
  cy.getElementByTestId('switch-tenants').click({ force: true });
  cy.wait([`@${switchId}AccountInfo`, `@${switchId}DashboardsInfo`]);

  if (['global', 'private'].includes(newTenant)) {
    cy.get('[id="' + newTenant + '"][name="tenantSwitchRadios"]').should(
      'be.enabled'
    );
    cy.get('.euiRadio__label[for="' + newTenant + '"]').click({
      force: true,
    });
  } else {
    cy.get('[id="custom"][name="tenantSwitchRadios"]').should('be.enabled');

    cy.getElementByTestId('tenant-switch-modal')
      .find('[data-test-subj="comboBoxInput"]')
      .click({ force: true });

    // typo in data-test-subj
    cy.getElementByTestId('comboBoxOptionsList ')
      .find(`[title="${newTenant}"]`)
      .click({ force: true });
  }

  cy.intercept({
    method: 'POST',
    url: '/api/v1/multitenancy/tenant*',
  }).as(`${switchId}Update`);
  cy.getElementByTestId('tenant-switch-modal')
    .find('[data-test-subj="confirm"]')
    .click({ force: true });

  cy.wait(`@${switchId}Update`).then(({ request, response }) => {
    expect(request.body.tenant).to.eq(requestedTenant);
    expect(response.statusCode).to.eq(200);
  });

  // Request counts do not prove a reload, especially when switching twice in one test.
  cy.document().should((document) => {
    expect(document).not.to.eq(previousDocument);
  });
  cy.getElementByTestId('account-popover').should('be.visible');
}
