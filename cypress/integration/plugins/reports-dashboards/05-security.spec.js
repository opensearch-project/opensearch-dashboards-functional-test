/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../utils/constants';

if (Cypress.env('SECURITY_ENABLED')) {
  describe('Reporting Security - Internal User with reports_full_access', () => {
    const username = 'reportuser';
    const password = 'TestPassword123!';
    const roleName = `reports_full_access_${Math.random()
      .toString(36)
      .substring(2, 10)}`;

    it('creates a new internal user', () => {
      cy.visit(`${BASE_PATH}/app/security-dashboards-plugin#/users`);
      cy.contains('Internal users');
      cy.get('a[href="#/users/create"]').click({ force: true });

      cy.get('input[data-test-subj="name-text"]').type(username);
      cy.get('input[data-test-subj="password"]').type(password);
      cy.get('input[data-test-subj="re-enter-password"]').type(password);
      cy.get('button').contains('Create').click();

      cy.contains(username).should('exist');
    });

    it('creates a new role with reports_full_access permissions', () => {
      Cypress.on('uncaught:exception', () => {
        return false;
      });

      cy.visit(`${BASE_PATH}/app/security-dashboards-plugin#/roles/create`);

      cy.get('input[data-test-subj="name-text"]').type(roleName);

      const permissions = [
        'cluster:admin/opendistro/reports/definition/create',
        'cluster:admin/opendistro/reports/definition/delete',
        'cluster:admin/opendistro/reports/definition/get',
        'cluster:admin/opendistro/reports/definition/list',
        'cluster:admin/opendistro/reports/definition/on_demand',
        'cluster:admin/opendistro/reports/definition/update',
        'cluster:admin/opendistro/reports/instance/get',
        'cluster:admin/opendistro/reports/instance/list',
        'cluster:admin/opendistro/reports/menu/download',
      ];

      permissions.forEach((perm) => {
        cy.get('input[data-test-subj="comboBoxSearchInput"]')
          .eq(0)
          .type(`${perm}{downArrow}{enter}`);
      });

      cy.get('button').contains('Create').click();
      cy.contains(roleName).should('exist');
    });

    it('maps the user to the reports_full_access role', () => {
      cy.visit(
        `${BASE_PATH}/app/security-dashboards-plugin#/roles/edit/${roleName}/mapuser`
      );
      cy.contains('Map users');

      cy.get('div[data-test-subj="comboBoxInput"]').type(username);
      cy.get('button[id="map"]').click();

      cy.contains(username).should('exist');
    });

    it.skip('verifies the user can access reporting', () => {
      cy.visit(`${BASE_PATH}/logout`);
      cy.visit(BASE_PATH);

      cy.get('input[name="username"]').type(username);
      cy.get('input[name="password"]').type(password);
      cy.get('button[type="submit"]').click();

      cy.visit(`${BASE_PATH}/app/reports-dashboards#/`);
      cy.contains('Reporting').should('exist');
      cy.get('#createReportHomepageButton').should('exist').click();
      cy.contains('Create new report').should('exist');
    });
  });
}
