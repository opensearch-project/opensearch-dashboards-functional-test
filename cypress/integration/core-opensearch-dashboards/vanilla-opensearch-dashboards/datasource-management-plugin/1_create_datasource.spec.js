import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);

describe('Create datasources', () => {
  beforeEach(() => {
    // visit OSD create page
    miscUtils.visitPage(
      'app/management/opensearch-dashboards/dataSources/create'
    );
  });

  it('should successfully load the page', () => {
    cy.contains(
      'A data source is an OpenSearch cluster endpoint (for now) to query against.',
      { timeout: 60000 }
    );
  });

  // No auth, with all required inputs, no optional description
  it('datasource can be created successfully with no Auth and all required inputs', () => {
    cy.get('[name="dataSourceTitle"]').type('test_noauth1');
    cy.get('[name="endpoint"]').type('https://test');
    cy.get('[data-test-subj="createDataSourceFormAuthTypeSelect"]').click();
    cy.get('[id="no_auth"]').click();
    cy.get('[type="submit"]').click();

    cy.location('pathname', { timeout: 6000 }).should(
      'include',
      'app/management/opensearch-dashboards/dataSources'
    );
  });

  // Basic auth, with all required inputs, no optional description
  it('datasource can be created successfully with basic Auth and all required inputs', () => {
    cy.get('[name="dataSourceTitle"]').type('test_auth1');
    cy.get('[name="endpoint"]').type('https://test');
    cy.get('[data-test-subj="createDataSourceFormUsernameField"]').type(
      'admin'
    );
    cy.get('[data-test-subj="createDataSourceFormPasswordField"]').type(
      'admin'
    );
    cy.get('[type="submit"]').click();

    cy.location('pathname', { timeout: 6000 }).should(
      'include',
      'app/management/opensearch-dashboards/dataSources'
    );
  });

  // No auth, with all inputs
  it('datasource can be created successfully with no Auth and all inputs', () => {
    cy.get('[name="dataSourceTitle"]').type('test_noauth2');
    cy.get('[name="dataSourceDescription"]').type(
      'test if can create datasource with no auth successfully'
    );
    cy.get('[name="endpoint"]').type('https://test');
    cy.get('[data-test-subj="createDataSourceFormAuthTypeSelect"]').click();
    cy.get('[id="no_auth"]').click();
    cy.get('[type="submit"]').click();

    cy.location('pathname', { timeout: 6000 }).should(
      'include',
      'app/management/opensearch-dashboards/dataSources'
    );
  });

  // Basic auth, with all inputs
  it('datasource can be created successfully with basic Auth and all inputs', () => {
    cy.get('[name="dataSourceTitle"]').type('test_auth2');
    cy.get('[name="dataSourceDescription"]').type(
      'test if can create datasource with basic auth successfully'
    );
    cy.get('[name="endpoint"]').type('https://test');
    cy.get('[data-test-subj="createDataSourceFormUsernameField"]').type(
      'admin'
    );
    cy.get('[data-test-subj="createDataSourceFormPasswordField"]').type(
      'admin'
    );
    cy.get('[type="submit"]').click();

    cy.location('pathname', { timeout: 6000 }).should(
      'include',
      'app/management/opensearch-dashboards/dataSources'
    );
  });

  // No auth, only Endpoint URL is missing
  it('datasource cannot be created with no Auth and missing Endpoint URL ', () => {
    cy.get('[name="dataSourceTitle"]').type('test_noEndPoint');
    cy.get('[data-test-subj="createDataSourceFormAuthTypeSelect"]').click();
    cy.get('[id="no_auth"]').click();
    cy.get('[type="submit"]').click();
    cy.get('[class="euiForm__error"]').should(
      'contain.text',
      'Endpoint is not valid'
    );
  });

  // No auth, only Endpoint URL is invalid format
  it('datasource cannot be created with no Auth and invalid Endpoint URL', () => {
    cy.get('[name="dataSourceTitle"]').type('test_invalidEndPoint');
    cy.get('[name="endpoint"]').type('test');
    cy.get('[data-test-subj="createDataSourceFormAuthTypeSelect"]').click();
    cy.get('[id="no_auth"]').click();
    cy.get('[type="submit"]').click();
    cy.get('[class="euiForm__error"]').should(
      'contain.text',
      'Endpoint is not valid'
    );
  });

  // Basic auth, no any input
  it('datasource cannot be created with basic Auth and no any input', () => {
    cy.get('[type="submit"]').click();

    cy.get('[class="euiForm__error"]').should(
      'contain.text',
      'Title must not be empty'
    );
    cy.get('[class="euiForm__error"]').should(
      'contain.text',
      'Endpoint is not valid'
    );
    cy.get('[class="euiForm__error"]').should(
      'contain.text',
      'Username should not be empty'
    );
    cy.get('[class="euiForm__error"]').should(
      'contain.text',
      'Password should not be empty'
    );
  });

  // No auth, no any input
  it('datasource cannot be created with no Auth and no any input', () => {
    cy.get('[data-test-subj="createDataSourceFormAuthTypeSelect"]').click();
    cy.get('[id="no_auth"]').click();
    cy.get('[type="submit"]').click();

    cy.get('[class="euiForm__error"]').should(
      'contain.text',
      'Title must not be empty'
    );
    cy.get('[class="euiForm__error"]').should(
      'contain.text',
      'Endpoint is not valid'
    );
  });
});
