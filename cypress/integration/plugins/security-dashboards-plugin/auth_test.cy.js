/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

describe('Log in via OIDC', () => {
  const login = 'admin';
  const password = 'admin';

  const kcLogin = () => {
    cy.get('#kc-page-title').should('be.visible');
    cy.get('#username').type(login);
    cy.get('#password').type(password);
    cy.get('#kc-login').click();
  };

  const logout = () => {
    cy.get('#user-icon-btn').should('be.visible', { timeout: 15000 });
    cy.get('#user-icon-btn').click();
    cy.get('button[data-test-subj^="log-out-"]').click();
    cy.get('#kc-page-title').should('be.visible');
  };

  afterEach(async () => {
    logout();
  });

  it('Login to app/opensearch_dashboards_overview#/ when OIDC is enabled', () => {
    cy.visit('http://localhost:5601/app/opensearch_dashboards_overview#/');

    kcLogin();

    cy.get('#osdOverviewPageHeader__title').should('be.visible');

    cy.getCookie('security_authentication').should('exist');
    cy.clearCookies();
  });

  it('Login to app/dev_tools#/console when OIDC is enabled', () => {
    cy.visit('http://localhost:5601/app/dev_tools#/console');

    kcLogin();

    cy.get('button[data-test-subj="sendRequestButton"]').should('be.visible');

    cy.getCookie('security_authentication').should('exist');
    cy.clearCookies();
  });

  it('Login to Dashboard with Hash', () => {
    cy.visit(
      `http://localhost:5601/app/dashboards#/view/7adfa750-4c81-11e8-b3d7-01146121b73d?_g=(filters:!(),refreshInterval:(pause:!f,value:900000),time:(from:now-24h,to:now))&_a=(description:'Analyze%20mock%20flight%20data%20for%20OpenSearch-Air,%20Logstash%20Airways,%20OpenSearch%20Dashboards%20Airlines%20and%20BeatsWest',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),query:(language:kuery,query:''),timeRestore:!t,title:'%5BFlights%5D%20Global%20Flight%20Dashboard',viewMode:view)`
    );

    kcLogin();

    cy.get(
      '.euiHeader.euiHeader--default.euiHeader--fixed.primaryHeader'
    ).should('be.visible');

    cy.getCookie('security_authentication').should('exist');
    cy.clearCookies();
  });

  it('Tenancy persisted after logout in OIDC', () => {
    cy.visit('http://localhost:5601/app/opensearch_dashboards_overview#/');

    kcLogin();

    cy.get('#global').should('be.enabled');
    cy.get('#global').click({ force: true });

    cy.get('button[data-test-subj="confirm"]').click();

    cy.get('#osdOverviewPageHeader__title').should('be.visible');

    logout();

    kcLogin();

    cy.get('#user-icon-btn').should('be.visible');
    cy.get('#user-icon-btn').click();

    cy.get('#tenantName').should('have.text', 'Global');
  });
});
