/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import {
  OSD_TEST_DOMAIN_ENDPOINT_URL,
  OSD_INVALID_ENDPOINT_URL,
} from '../../../../utils/dashboards/datasource-management-dashboards-plugin/constants';

const miscUtils = new MiscUtils(cy);
// Get environment variables
const username = Cypress.env('username');
const password = Cypress.env('password');
const REGION = 'us-east-1';
const ACCESS_KEY = 'accessKey';
const SECRET_KEY = 'secretKey';

if (Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')) {
  describe('Create datasources', () => {
    before(() => {
      // Clean up before creating new data sources for testing
      cy.deleteAllDataSources();
    });
    beforeEach(() => {
      // Visit OSD create page
      miscUtils.visitPage(
        'app/management/opensearch-dashboards/dataSources/create'
      );

      cy.intercept('POST', '/api/saved_objects/data-source').as(
        'createDataSourceRequest'
      );
    });

    after(() => {
      // Clean up after all test are run
      cy.deleteAllDataSources();
    });

    it('should successfully load the page', () => {
      cy.contains(
        'Create a new data source connection to help you retrieve data from an external OpenSearch compatible source.',
        { timeout: 60000 }
      );
    });

    describe('Datasource can be created successfully', () => {
      it('with no auth and all required inputs', () => {
        cy.get('[data-test-subj="createDataSourceButton"]').should(
          'be.disabled'
        );
        cy.get('[name="dataSourceTitle"]').type('test_noauth');
        cy.get('[name="endpoint"]').type(OSD_TEST_DOMAIN_ENDPOINT_URL);
        cy.get('[data-test-subj="createDataSourceFormAuthTypeSelect"]').select(
          'no_auth'
        );
        cy.get('[data-test-subj="createDataSourceButton"]').should(
          'be.enabled'
        );
        cy.get('[name="dataSourceDescription"]').type(
          'cypress test no auth data source'
        );

        cy.get('[data-test-subj="createDataSourceButton"]').click();
        cy.wait('@createDataSourceRequest').then((interception) => {
          expect(interception.response.statusCode).to.equal(200);
        });
        cy.location('pathname', { timeout: 6000 }).should(
          'include',
          'app/management/opensearch-dashboards/dataSources'
        );
      });

      it('with basic auth and all required inputs', () => {
        cy.get('[data-test-subj="createDataSourceButton"]').should(
          'be.disabled'
        );
        cy.get('[name="dataSourceTitle"]').type('test_auth');
        cy.get('[name="endpoint"]').type(OSD_TEST_DOMAIN_ENDPOINT_URL);
        cy.get('[data-test-subj="createDataSourceFormAuthTypeSelect"]').select(
          'username_password'
        );
        cy.get('[data-test-subj="createDataSourceFormUsernameField"]').type(
          username
        );
        cy.get('[data-test-subj="createDataSourceFormPasswordField"]').type(
          password
        );
        cy.get('[data-test-subj="createDataSourceButton"]').should(
          'be.enabled'
        );
        cy.get('[name="dataSourceDescription"]').type(
          'cypress test basic auth data source'
        );
        cy.get('[data-test-subj="createDataSourceButton"]').click();
        cy.wait('@createDataSourceRequest').then((interception) => {
          expect(interception.response.statusCode).to.equal(200);
        });
        cy.location('pathname', { timeout: 6000 }).should(
          'include',
          'app/management/opensearch-dashboards/dataSources'
        );
      });

      it('with sigV4 and all required inputs to connect to OpenSearch Service', () => {
        cy.get('[data-test-subj="createDataSourceButton"]').should(
          'be.disabled'
        );
        cy.get('[name="dataSourceTitle"]').type('test_sigv4_es');
        cy.get('[name="endpoint"]').type(OSD_TEST_DOMAIN_ENDPOINT_URL);
        cy.get('[data-test-subj="createDataSourceFormAuthTypeSelect"]').select(
          'sigv4'
        );
        cy.get('[data-test-subj="createDataSourceFormRegionField"]').type(
          REGION
        );
        cy.get(
          '[data-test-subj="createDataSourceFormSigV4ServiceTypeSelect"]'
        ).select('es');
        cy.get('[data-test-subj="createDataSourceFormAccessKeyField"]').type(
          ACCESS_KEY
        );
        cy.get('[data-test-subj="createDataSourceFormSecretKeyField"]').type(
          SECRET_KEY
        );
        cy.get('[data-test-subj="createDataSourceButton"]').should(
          'be.enabled'
        );
        cy.get('[name="dataSourceDescription"]').type(
          'cypress test sigV4 data source'
        );

        cy.get('[data-test-subj="createDataSourceButton"]').click();
        cy.wait('@createDataSourceRequest').then((interception) => {
          expect(interception.response.statusCode).to.equal(200);
        });

        cy.location('pathname', { timeout: 6000 }).should(
          'include',
          'app/management/opensearch-dashboards/dataSources'
        );
      });

      it('with sigV4 and all required inputs to connect to OpenSearch Serverless Service', () => {
        cy.get('[data-test-subj="createDataSourceButton"]').should(
          'be.disabled'
        );
        cy.get('[name="dataSourceTitle"]').type('test_sigv4_aoss');
        cy.get('[name="endpoint"]').type(OSD_TEST_DOMAIN_ENDPOINT_URL);
        cy.get('[data-test-subj="createDataSourceFormAuthTypeSelect"]').select(
          'sigv4'
        );
        cy.get('[data-test-subj="createDataSourceFormRegionField"]').type(
          REGION
        );
        cy.get(
          '[data-test-subj="createDataSourceFormSigV4ServiceTypeSelect"]'
        ).select('aoss');
        cy.get('[data-test-subj="createDataSourceFormAccessKeyField"]').type(
          ACCESS_KEY
        );
        cy.get('[data-test-subj="createDataSourceFormSecretKeyField"]').type(
          SECRET_KEY
        );
        cy.get('[data-test-subj="createDataSourceButton"]').should(
          'be.enabled'
        );
        cy.get('[name="dataSourceDescription"]').type(
          'cypress test sigV4 data source (Serverless)'
        );

        cy.get('[data-test-subj="createDataSourceButton"]').click();
        cy.wait('@createDataSourceRequest').then((interception) => {
          expect(interception.response.statusCode).to.equal(200);
        });

        cy.location('pathname', { timeout: 6000 }).should(
          'include',
          'app/management/opensearch-dashboards/dataSources'
        );
      });
    });

    describe('Title validation', () => {
      it('validate that title is a required field', () => {
        cy.get('[name="dataSourceTitle"]').focus().blur();
        cy.get('input[name="dataSourceTitle"]:invalid').should(
          'have.length',
          1
        );
      });

      it('validate that title cannot use existing datasource name', () => {
        cy.get('[name="dataSourceTitle"]').type('test_auth').blur();
        cy.get('input[name="dataSourceTitle"]:invalid').should(
          'have.length',
          1
        );
        cy.contains('This title is already in use').should('exist');
      });

      it('validate that title field does not show any error if title is valid and unique', () => {
        cy.get('[name="dataSourceTitle"]').type('test_unique_title').blur();
        cy.get('input[name="dataSourceTitle"]:valid').should('have.length', 1);
      });
    });

    describe('Description validation', () => {
      it('validate that description field does not show any error if the field is empty', () => {
        cy.get('[name="dataSourceDescription"]').focus().blur();
        cy.get('input[name="dataSourceDescription"]:valid').should(
          'have.length',
          1
        );
      });

      it('validate that description field does not show any error if there is a description', () => {
        cy.get('[name="dataSourceDescription"]')
          .type('test description field')
          .blur();
        cy.get('input[name="dataSourceDescription"]:valid').should(
          'have.length',
          1
        );
      });
    });

    describe('Endpoint validation', () => {
      it('validate that endpoint is a required field', () => {
        cy.get('[name="endpoint"]').focus().blur();
        cy.get('input[name="endpoint"]:invalid').should('have.length', 1);
      });

      it('validate that endpoint field cannot use invalid format of URL', () => {
        cy.get('[name="endpoint"]').type(OSD_INVALID_ENDPOINT_URL).blur();
        cy.get('input[name="endpoint"]:invalid').should('have.length', 1);
      });

      it('validate that endpoint field does not show any error if URL is valid', () => {
        cy.get('[name="endpoint"]').type(OSD_TEST_DOMAIN_ENDPOINT_URL).blur();
        cy.get('input[name="endpoint"]:valid').should('have.length', 1);
      });
    });

    describe('Username validation', () => {
      it('validate that username field does not show when auth type is no auth', () => {
        cy.get('[data-test-subj="createDataSourceFormAuthTypeSelect"]').select(
          'no_auth'
        );
        cy.get('[data-test-subj="createDataSourceFormUsernameField"]').should(
          'not.exist'
        );
      });

      it('validate that username is a required field when auth type is username & password', () => {
        cy.get('[data-test-subj="createDataSourceFormAuthTypeSelect"]').select(
          'username_password'
        );
        cy.get('[data-test-subj="createDataSourceFormUsernameField"]')
          .focus()
          .blur();
        cy.get(
          'input[data-test-subj="createDataSourceFormUsernameField"]:invalid'
        ).should('have.length', 1);
      });

      it('validate that username field does not show any error when auth type is username & password and field is not empty', () => {
        cy.get('[data-test-subj="createDataSourceFormAuthTypeSelect"]').select(
          'username_password'
        );
        cy.get('[data-test-subj="createDataSourceFormUsernameField"]')
          .type(username)
          .blur();
        cy.get(
          'input[data-test-subj="createDataSourceFormUsernameField"]:valid'
        ).should('have.length', 1);
      });
    });

    describe('Password validation', () => {
      it('validate that password field does not show when auth type is no auth', () => {
        cy.get('[data-test-subj="createDataSourceFormAuthTypeSelect"]').select(
          'no_auth'
        );
        cy.get('[data-test-subj="createDataSourceFormPasswordField"]').should(
          'not.exist'
        );
      });

      it('validate that password is a required field when auth type is username & password', () => {
        cy.get('[data-test-subj="createDataSourceFormAuthTypeSelect"]').select(
          'username_password'
        );
        cy.get('[data-test-subj="createDataSourceFormPasswordField"]')
          .focus()
          .blur();
        cy.get(
          'input[data-test-subj="createDataSourceFormPasswordField"]:invalid'
        ).should('have.length', 1);
      });

      it('validate that password field does not show any error when auth type is username & password and field is not empty', () => {
        cy.get('[data-test-subj="createDataSourceFormAuthTypeSelect"]').select(
          'username_password'
        );
        cy.get('[data-test-subj="createDataSourceFormPasswordField"]')
          .type(password)
          .blur();
        cy.get(
          'input[data-test-subj="createDataSourceFormPasswordField"]:valid'
        ).should('have.length', 1);
      });
    });

    describe('SigV4 AuthType: fields validation', () => {
      it('validate that region is a required field', () => {
        cy.get('[data-test-subj="createDataSourceFormAuthTypeSelect"]').select(
          'sigv4'
        );
        cy.get('[data-test-subj="createDataSourceFormRegionField"]')
          .focus()
          .blur();
        cy.get(
          'input[data-test-subj="createDataSourceFormRegionField"]:invalid'
        ).should('have.length', 1);
      });

      it('validate that accessKey is a required field', () => {
        cy.get('[data-test-subj="createDataSourceFormAuthTypeSelect"]').select(
          'sigv4'
        );
        cy.get('[data-test-subj="createDataSourceFormAccessKeyField"]')
          .focus()
          .blur();
        cy.get(
          'input[data-test-subj="createDataSourceFormAccessKeyField"]:invalid'
        ).should('have.length', 1);
      });

      it('validate that secretKey is a required field', () => {
        cy.get('[data-test-subj="createDataSourceFormAuthTypeSelect"]').select(
          'sigv4'
        );
        cy.get('[data-test-subj="createDataSourceFormSecretKeyField"]')
          .focus()
          .blur();
        cy.get(
          'input[data-test-subj="createDataSourceFormSecretKeyField"]:invalid'
        ).should('have.length', 1);
      });

      it('validate that serviceName is a required field, and with default option rendered', () => {
        cy.get('[data-test-subj="createDataSourceFormAuthTypeSelect"]').select(
          'sigv4'
        );
        cy.get(
          '[data-test-subj="createDataSourceFormSigV4ServiceTypeSelect"]'
        ).should('have.value', 'es');
      });
    });

    describe('Cancel button and create data source button', () => {
      it('validate if create data source button is disabled when first visit this page', () => {
        miscUtils.visitPage(
          'app/management/opensearch-dashboards/dataSources/create'
        );
        cy.get('[data-test-subj="createDataSourceButton"]').should(
          'be.disabled'
        );
      });

      it('validate if create data source button is disabled when there is any field error', () => {
        cy.get('[name="dataSourceTitle"]').focus().blur();
        cy.get('input[name="dataSourceTitle"]:invalid').should(
          'have.length',
          1
        );
        cy.get('[data-test-subj="createDataSourceButton"]').should(
          'be.disabled'
        );
      });

      it('validate if create data source button is not disabled only if there is no any field error', () => {
        cy.get('[name="dataSourceTitle"]').type('test_create_button');
        cy.get('[name="endpoint"]').type(OSD_TEST_DOMAIN_ENDPOINT_URL);
        cy.get('[data-test-subj="createDataSourceFormAuthTypeSelect"]').select(
          'no_auth'
        );
        cy.get('[data-test-subj="createDataSourceButton"]').should(
          'not.be.disabled'
        );
      });

      it('cancel button should redirect to datasource listing page', () => {
        cy.get('[data-test-subj="cancelCreateDataSourceButton"]').click();
        cy.location('pathname', { timeout: 6000 }).should(
          'include',
          'app/management/opensearch-dashboards/dataSources'
        );
      });
    });
  });
}
