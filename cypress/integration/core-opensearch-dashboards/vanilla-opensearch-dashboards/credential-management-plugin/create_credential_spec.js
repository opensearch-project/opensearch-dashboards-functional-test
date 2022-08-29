import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);

describe('Create credential', () => {
  before(() => {
    miscUtils.visitPage(
      'app/management/opensearch-dashboards/credentials/create'
    );
  });

  it('Create credential successfully', () => {
    cy.get('[name="credentialTitle"]').type('test credential');
    cy.get('[name="description"]').type('test credential');
    cy.get('[name="username"]').type('admin');
    cy.get('[name="password"]').type('admin');
    cy.get('[type="submit"]').click();

    cy.location('pathname', { timeout: 3000 }).should(
      'include',
      'app/management/opensearch-dashboards/credentials'
    );
  });
});
