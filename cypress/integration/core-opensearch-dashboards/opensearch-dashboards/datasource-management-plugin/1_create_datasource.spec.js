/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import {
  OSD_TEST_DOMAIN_ENDPOINT_URL,
  OSD_INVALID_ENPOINT_URL,
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
    beforeEach(() => {
      // Visit OSD create page
      miscUtils.visitPage(
        'app/management/opensearch-dashboards/dataSources/create'
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
        cy.get('[name="dataSourceTitle"]').type('test_noauth');
        cy.get('[name="endpoint"]').type(OSD_TEST_DOMAIN_ENDPOINT_URL);
        cy.get('[data-test-subj="createDataSourceFormAuthTypeSelect"]').select(
          'no_auth'
        );
        cy.getElementByTestId('createDataSourceButton').click();

        cy.location('pathname', { timeout: 6000 }).should(
          'include',
          'app/management/opensearch-dashboards/dataSources'
        );
      });

      it('with basic auth and all required inputs', () => {
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
        cy.getElementByTestId('createDataSourceButton').click();

        cy.location('pathname', { timeout: 6000 }).should(
          'include',
          'app/management/opensearch-dashboards/dataSources'
        );
      });

      it('with sigV4 and all required inputs', () => {
        cy.get('[name="dataSourceTitle"]').type('test_sigv4');
        cy.get('[name="endpoint"]').type(OSD_TEST_DOMAIN_ENDPOINT_URL);
        cy.get('[data-test-subj="createDataSourceFormAuthTypeSelect"]').select(
          'sigv4'
        );
        cy.get('[data-test-subj="createDataSourceFormRegionField"]').type(
          REGION
        );
        cy.get('[data-test-subj="createDataSourceFormAccessKeyField"]').type(
          ACCESS_KEY
        );
        cy.get('[data-test-subj="createDataSourceFormSecretKeyField"]').type(
          SECRET_KEY
        );

        cy.getElementByTestId('createDataSourceButton').click();

        cy.location('pathname', { timeout: 6000 }).should(
          'include',
          'app/management/opensearch-dashboards/dataSources'
        );
      });

      it('with no auth and all inputs', () => {
        cy.get('[name="dataSourceTitle"]').type('test_noauth_with_all_Inputs');
        cy.get('[name="dataSourceDescription"]').type(
          'test if can create datasource with no auth successfully'
        );
        cy.get('[name="endpoint"]').type(OSD_TEST_DOMAIN_ENDPOINT_URL);
        cy.get('[data-test-subj="createDataSourceFormAuthTypeSelect"]').select(
          'no_auth'
        );
        cy.getElementByTestId('createDataSourceButton').click();

        cy.location('pathname', { timeout: 6000 }).should(
          'include',
          'app/management/opensearch-dashboards/dataSources'
        );
      });

      it('with basic auth and all inputs', () => {
        cy.get('[name="dataSourceTitle"]').type('test_auth_with_all_Inputs');
        cy.get('[name="dataSourceDescription"]').type(
          'test if can create datasource with basic auth successfully'
        );
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
        cy.getElementByTestId('createDataSourceButton').click();

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
        cy.get('[name="endpoint"]').type(OSD_INVALID_ENPOINT_URL).blur();
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

    describe('Create datasource button', () => {
      it('validate if create data source connection button is disabled when first visit this page', () => {
        miscUtils.visitPage(
          'app/management/opensearch-dashboards/dataSources/create'
        );
        cy.getElementByTestId('createDataSourceButton').should('be.disabled');
      });

      it('validate if create data source connection button is disabled when there is any field error', () => {
        cy.get('[name="dataSourceTitle"]').focus().blur();
        cy.get('input[name="dataSourceTitle"]:invalid').should(
          'have.length',
          1
        );
        cy.getElementByTestId('createDataSourceButton').should('be.disabled');
      });

      it('validate if create data source connection button is not disabled only if there is no any field error', () => {
        cy.get('[name="dataSourceTitle"]').type('test_create_button');
        cy.get('[name="endpoint"]').type(OSD_TEST_DOMAIN_ENDPOINT_URL);
        cy.get('[data-test-subj="createDataSourceFormAuthTypeSelect"]').select(
          'no_auth'
        );
        cy.getElementByTestId('createDataSourceButton').should(
          'not.be.disabled'
        );
      });
    });
  });
}
