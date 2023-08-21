/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DS_JSON,
  DS_JSON_2,
  DS_JSON_UNIQUE_VALUES,
  FORCE_CLICK_OPTS,
  TIMEOUT_OPTS,
} from '../../../../utils/dashboards/datasource-management-dashboards-plugin/constants';

const passwordFieldIdentifier =
  'input[type="password"][data-test-subj="updateDataSourceFormPasswordField"]';
const updatedPasswordIdentifier =
  'input[type="password"][data-test-subj="updateStoredPasswordUpdatedPasswordField"]';
const confirmUpdatedPasswordIdentifier =
  'input[type="password"][data-test-subj="updateStoredPasswordConfirmUpdatedPasswordField"]';

const typeInInputFieldAndBlur = (name, updatedText, identifier) => {
  const locator = identifier || `[name="${name}"]`;
  if (updatedText && updatedText.length) {
    cy.get(locator).clear().focus().type(updatedText).blur();
  } else {
    cy.get(locator).clear().focus().blur();
  }
};

const checkIfTableIsLoaded = () => {
  cy.contains('Rows per page', TIMEOUT_OPTS).should('exist');
};

const clickOnTableRowTitleColumnByValue = (value) => {
  cy.get('tbody > tr > td').contains(value).click(FORCE_CLICK_OPTS);
};

if (Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')) {
  describe('Datasource Management: Update', () => {
    before(() => {
      // Clean up before creating new data sources for testing
      cy.deleteAllDataSources();
      // Create
      cy.createDataSource(DS_JSON);
      cy.createDataSource(DS_JSON_2);
      cy.visitDataSourcesListingPage();
    });
    after(() => {
      // Clean up after all test are run
      cy.deleteAllDataSources();
    });

    it('should successfully load the listing page & have 2 records in table', () => {
      cy.contains(
        'Create and manage data source connections to help you retrieve data from multiple OpenSearch compatible sources.'
      );
      // Confirm we have 2 rows in the table
      cy.get('tbody > tr').should(($tr) => {
        expect($tr).to.have.length(2);
      });
    });

    describe('navigate to details page using various ways', () => {
      let detailsPageURL = '';
      it("should navigate to details page on table row datasource 'title' click", () => {
        clickOnTableRowTitleColumnByValue(DS_JSON_2.attributes.title);
        cy.get('[name="dataSourceTitle"]').should(
          'have.value',
          DS_JSON_2.attributes.title
        );
        cy.location('pathname').then((pathname) => {
          detailsPageURL = pathname;
        });
      });
      it('should navigate to details page by URL successfully', () => {
        cy.visitDataSourcesListingPage();
        cy.visit(detailsPageURL);
        cy.get('[name="dataSourceTitle"]').should(
          'have.value',
          DS_JSON_2.attributes.title
        );
      });
      it('should navigate to details page by URL and show error when id is invalid', () => {
        cy.visitDataSourcesListingPage();
        cy.visit(`${detailsPageURL}64fa3`);
        cy.get('[name="dataSourceTitle"]').should('not.exist');
      });
    });

    describe('validation: Originally datasource credential type is "No Authentication"', () => {
      before(() => {
        cy.visitDataSourcesListingPage();
        checkIfTableIsLoaded();
        clickOnTableRowTitleColumnByValue(DS_JSON.attributes.title);
        cy.get('[name="dataSourceTitle"]').should('exist');
      });
      it('should make sure that title field is required & does not accept duplicates', () => {
        /* Required */
        typeInInputFieldAndBlur('dataSourceTitle', '', '');
        cy.get('input[name="dataSourceTitle"]:invalid').should(
          'have.length',
          1
        );
        cy.getElementByTestId('datasource-edit-saveButton').should(
          'be.disabled'
        );

        /* No error - on original title */
        typeInInputFieldAndBlur(
          'dataSourceTitle',
          DS_JSON.attributes.title,
          ''
        );
        cy.get('input[name="dataSourceTitle"]:valid').should('have.length', 1);
        cy.getElementByTestId('datasource-edit-saveButton').should('not.exist');

        /* Duplicate */
        typeInInputFieldAndBlur(
          'dataSourceTitle',
          DS_JSON_2.attributes.title,
          ''
        );
        cy.get('input[name="dataSourceTitle"]:invalid').should(
          'have.length',
          1
        );
        cy.contains('This title is already in use').should('exist');
        cy.getElementByTestId('datasource-edit-saveButton').should(
          'be.disabled'
        );

        /* No error - unique value */
        typeInInputFieldAndBlur(
          'dataSourceTitle',
          DS_JSON_UNIQUE_VALUES.attributes.title,
          ''
        );
        cy.get('input[name="dataSourceTitle"]:valid').should('have.length', 1);
        cy.getElementByTestId('datasource-edit-saveButton').should(
          'be.enabled'
        );
      });
      it('should make sure that description field is optional', () => {
        typeInInputFieldAndBlur('dataSourceDescription', '', '');
        cy.get('input[name="dataSourceDescription"]:valid').should(
          'have.length',
          1
        );
        cy.getElementByTestId('datasource-edit-saveButton').should(
          'be.enabled'
        );
      });
      it('should make sure that endpoint field is disabled in all scenarios', () => {
        // credential: Username & password
        cy.get('[data-test-subj="editDataSourceSelectAuthType"]').select(
          'username_password'
        );
        cy.get('input[name="endpoint"]').should('be.disabled');
        cy.get('input[name="endpoint"]').should(
          'have.value',
          DS_JSON.attributes.endpoint
        );

        // credential: No Authentication
        cy.get('[data-test-subj="editDataSourceSelectAuthType"]').select(
          'no_auth'
        );
        cy.get('input[name="endpoint"]').should('be.disabled');
        cy.get('input[name="endpoint"]').should(
          'have.value',
          DS_JSON.attributes.endpoint
        );

        // credential: sigv4
        cy.get('[data-test-subj="editDataSourceSelectAuthType"]').select(
          'sigv4'
        );
        cy.get('input[name="endpoint"]').should('be.disabled');
        cy.get('input[name="endpoint"]').should(
          'have.value',
          DS_JSON.attributes.endpoint
        );
      });
      it('should make sure that username field is required for credential: Username & password & hidden when credential: No Authentication', () => {
        // credential: Username & password
        cy.get('[data-test-subj="editDataSourceSelectAuthType"]').select(
          'username_password'
        );
        cy.get('input[name="datasourceUsername"]').should('exist');
        cy.get('input[name="datasourceUsername"]').should('be.empty');

        /* Required */
        typeInInputFieldAndBlur('datasourceUsername', '', '');
        cy.get('input[name="datasourceUsername"]:invalid').should(
          'have.length',
          1
        );

        /* Valid */
        typeInInputFieldAndBlur(
          'datasourceUsername',
          DS_JSON_UNIQUE_VALUES.attributes.auth.credentials.username,
          ''
        );
        cy.get('input[name="datasourceUsername"]:valid').should(
          'have.length',
          1
        );

        // credential: No Authentication
        cy.get('[data-test-subj="editDataSourceSelectAuthType"]').select(
          'no_auth'
        );
        cy.get('input[name="datasourceUsername"]').should('not.exist');
      });
      it('should make sure that password field is required', () => {
        // credential: Username & password
        cy.get('[data-test-subj="editDataSourceSelectAuthType"]').select(
          'username_password'
        );
        cy.getElementByTestId('editDatasourceUpdatePasswordBtn').should(
          'not.exist'
        );
        cy.get(passwordFieldIdentifier).should('exist');
        cy.get(passwordFieldIdentifier).should('have.value', '');

        /* Required */
        typeInInputFieldAndBlur('', '', passwordFieldIdentifier);
        cy.get('input[type="password"]:invalid').should('have.length', 1);

        /* Valid */
        typeInInputFieldAndBlur(
          '',
          DS_JSON_UNIQUE_VALUES.attributes.auth.credentials.password,
          passwordFieldIdentifier
        );
        cy.get('input[type="password"]:valid').should('have.length', 1);

        // credential: No Authentication
        cy.get('[data-test-subj="editDataSourceSelectAuthType"]').select(
          'no_auth'
        );
        cy.get(passwordFieldIdentifier).should('not.exist');
      });
    });
    describe('bottom bar: Cancel & Save Changes', () => {
      it('should clear all changes by clicking on cancel changes button', () => {
        cy.get('[name="dataSourceTitle"]').should(
          'have.value',
          DS_JSON_UNIQUE_VALUES.attributes.title
        );
        cy.get('[name="dataSourceDescription"]').should(
          'have.value',
          DS_JSON_UNIQUE_VALUES.attributes.description
        );
        cy.getElementByTestId('datasource-edit-cancelButton').should('exist');
        cy.getElementByTestId('datasource-edit-cancelButton').should(
          'be.enabled'
        );
        cy.getElementByTestId('datasource-edit-cancelButton').click();
        cy.get('[name="dataSourceTitle"]').should(
          'have.value',
          DS_JSON.attributes.title // original value
        );
        cy.get('[name="dataSourceDescription"]').should(
          'have.value',
          DS_JSON.attributes.description // original value
        );
      });
      it('should change credential to "Username & Password" & save changes with valid form', () => {
        // credential: Username & password
        cy.get('[data-test-subj="editDataSourceSelectAuthType"]').select(
          'username_password'
        );
        // set username
        typeInInputFieldAndBlur(
          'datasourceUsername',
          DS_JSON_UNIQUE_VALUES.attributes.auth.credentials.username,
          ''
        );
        // set password
        typeInInputFieldAndBlur(
          '',
          DS_JSON_UNIQUE_VALUES.attributes.auth.credentials.password,
          passwordFieldIdentifier
        );
        cy.getElementByTestId('datasource-edit-saveButton')
          .should('be.enabled')
          .click();
        cy.getElementByTestId(
          'datasource-edit-saveButton',
          TIMEOUT_OPTS
        ).should('not.exist');
      });
      it('should verify that changes were updated successfully', () => {
        // credential: Username & password
        cy.get('[data-test-subj="editDataSourceSelectAuthType"]').should(
          'have.value',
          'username_password'
        );
        cy.get('[name="datasourceUsername"]').should(
          'have.value',
          DS_JSON_UNIQUE_VALUES.attributes.auth.credentials.username
        );
        cy.get(passwordFieldIdentifier).should('be.disabled');
        cy.getElementByTestId('editDatasourceUpdatePasswordBtn').should(
          'exist' // "Update Stored Password Button"
        );
      });
    });

    describe('validation: Originally datasource credential type is "Username & Password"', () => {
      it('should again make sure that title field is required & does not accept duplicates', () => {
        /* Required */
        typeInInputFieldAndBlur('dataSourceTitle', '', '');
        cy.get('input[name="dataSourceTitle"]:invalid').should(
          'have.length',
          1
        );
        cy.getElementByTestId('datasource-edit-saveButton').should(
          'be.disabled'
        );

        /* No error - on original title */
        typeInInputFieldAndBlur(
          'dataSourceTitle',
          DS_JSON.attributes.title,
          ''
        );
        cy.get('input[name="dataSourceTitle"]:valid').should('have.length', 1);
        cy.getElementByTestId('datasource-edit-saveButton').should('not.exist');

        /* Duplicate */
        typeInInputFieldAndBlur(
          'dataSourceTitle',
          DS_JSON_2.attributes.title,
          ''
        );
        cy.get('input[name="dataSourceTitle"]:invalid').should(
          'have.length',
          1
        );
        cy.contains('This title is already in use').should('exist');
        cy.getElementByTestId('datasource-edit-saveButton').should(
          'be.disabled'
        );

        /* No error - unique value */
        typeInInputFieldAndBlur(
          'dataSourceTitle',
          DS_JSON_UNIQUE_VALUES.attributes.title,
          ''
        );
        cy.get('input[name="dataSourceTitle"]:valid').should('have.length', 1);
        cy.getElementByTestId('datasource-edit-saveButton').should(
          'be.enabled'
        );
      });
      it('should again make sure that description field is optional', () => {
        typeInInputFieldAndBlur('dataSourceDescription', '', '');
        cy.get('input[name="dataSourceDescription"]:valid').should(
          'have.length',
          1
        );
        cy.getElementByTestId('datasource-edit-saveButton').should(
          'be.enabled'
        );
      });
      it('should make sure that endpoint field is disabled in all scenarios', () => {
        // credential: No Authentication
        cy.get('[data-test-subj="editDataSourceSelectAuthType"]').select(
          'no_auth'
        );
        cy.get('input[name="endpoint"]').should('be.disabled');
        cy.get('input[name="endpoint"]').should(
          'have.value',
          DS_JSON.attributes.endpoint
        );

        // credential: Username & password
        cy.get('[data-test-subj="editDataSourceSelectAuthType"]').select(
          'username_password'
        );
        cy.get('input[name="endpoint"]').should('be.disabled');
        cy.get('input[name="endpoint"]').should(
          'have.value',
          DS_JSON.attributes.endpoint
        );
      });

      it('should make sure that username field is hidden when credential: No Authentication & required for credential: Username & password', () => {
        // credential: No Authentication
        cy.get('[data-test-subj="editDataSourceSelectAuthType"]').select(
          'no_auth'
        );
        cy.get('input[name="datasourceUsername"]').should('not.exist');

        // credential: Username & password
        cy.get('[data-test-subj="editDataSourceSelectAuthType"]').select(
          'username_password'
        );
        cy.get('input[name="datasourceUsername"]').should('exist');
        cy.get('input[name="datasourceUsername"]').should(
          'have.value',
          DS_JSON_UNIQUE_VALUES.attributes.auth.credentials.username
        );

        /* Required */
        typeInInputFieldAndBlur('datasourceUsername', '', '');
        cy.get('input[name="datasourceUsername"]:invalid').should(
          'have.length',
          1
        );

        /* Valid */
        typeInInputFieldAndBlur(
          'datasourceUsername',
          DS_JSON_UNIQUE_VALUES.attributes.auth.credentials.username,
          ''
        );
        cy.get('input[name="datasourceUsername"]:valid').should(
          'have.length',
          1
        );
      });
      it('should make sure that password field is disabled & Update stored password button is present', () => {
        // credential: No Authentication
        cy.get('[data-test-subj="editDataSourceSelectAuthType"]').select(
          'no_auth'
        );
        cy.get(passwordFieldIdentifier).should('not.exist');
        cy.getElementByTestId('editDatasourceUpdatePasswordBtn').should(
          'not.exist' // Update stored password button
        );

        // credential: Username & password
        cy.get('[data-test-subj="editDataSourceSelectAuthType"]').select(
          'username_password'
        );
        cy.getElementByTestId('editDatasourceUpdatePasswordBtn').should(
          'exist' // Update stored password button
        );
        cy.get(passwordFieldIdentifier).should('exist');
        cy.get(passwordFieldIdentifier).should('be.disabled');
      });
    });
    describe('validation: Update stores password modal', () => {
      it('should display update password modal', () => {
        cy.getElementByTestId('editDatasourceUpdatePasswordBtn').click({
          force: true,
        });
        cy.get('.euiModal').should('exist');
        cy.getElementByTestId('updateStoredPasswordConfirmBtn').should(
          'be.disabled'
        );
        cy.contains(
          'Update credential password to reflect accurate password to gain access to the endpoint.'
        ).should('exist');
      });
      it('should make sure "Updated Password" filed is required', () => {
        cy.get(updatedPasswordIdentifier).should('have.value', '');
        typeInInputFieldAndBlur('', '', updatedPasswordIdentifier);

        cy.get(`${updatedPasswordIdentifier}:invalid`).should('have.length', 1);
        typeInInputFieldAndBlur(
          '',
          DS_JSON_UNIQUE_VALUES.attributes.auth.credentials.password,
          updatedPasswordIdentifier
        );

        cy.get(`${updatedPasswordIdentifier}:valid`).should('have.length', 1);
      });
      it('should make sure that "Confirm Updated Password" filed is required & matches with Updated Password field', () => {
        cy.get(confirmUpdatedPasswordIdentifier).should('have.value', '');

        /* Required */
        typeInInputFieldAndBlur('', '', confirmUpdatedPasswordIdentifier);

        cy.get(`${confirmUpdatedPasswordIdentifier}:invalid`).should(
          'have.length',
          1
        );

        /* Passwords do not match */

        typeInInputFieldAndBlur('', 'test', confirmUpdatedPasswordIdentifier);
        cy.get(`${confirmUpdatedPasswordIdentifier}:invalid`).should(
          'have.length',
          1
        );
        cy.contains('Passwords do not match').should('exist');

        /* Matching passwords */
        typeInInputFieldAndBlur(
          '',
          DS_JSON_UNIQUE_VALUES.attributes.auth.credentials.password,
          confirmUpdatedPasswordIdentifier
        );
        cy.get(`${confirmUpdatedPasswordIdentifier}:valid`).should(
          'have.length',
          1
        );
        cy.get(`${confirmUpdatedPasswordIdentifier}:valid`).should(
          'have.length',
          1
        );
        cy.get(`${confirmUpdatedPasswordIdentifier}`)
          .invoke('val')
          .then((confirmPwd) => {
            cy.get(`${updatedPasswordIdentifier}`).should(
              'have.value',
              confirmPwd
            );
          });
        cy.contains('Passwords do not match').should('not.exist');

        cy.getElementByTestId('updateStoredPasswordConfirmBtn').should(
          'be.enabled'
        );
      });
    });
    describe('Cancel & update password from modal', () => {
      it('should close the update stored password modal', () => {
        cy.getElementByTestId('updateStoredPasswordCancelBtn').click({
          force: true,
        });
        cy.get('.euiModal').should('not.exist');
      });
      it('should not remember previous input for updated & confirm updated password fields', () => {
        cy.getElementByTestId('editDatasourceUpdatePasswordBtn').click({
          force: true,
        });
        cy.get(updatedPasswordIdentifier).should(
          'not.have.value',
          DS_JSON_UNIQUE_VALUES.attributes.auth.credentials.password
        );
        cy.get(confirmUpdatedPasswordIdentifier).should(
          'not.have.value',
          DS_JSON_UNIQUE_VALUES.attributes.auth.credentials.password
        );
      });
      it('should save valid updated stored password', () => {
        typeInInputFieldAndBlur(
          '',
          DS_JSON_UNIQUE_VALUES.attributes.auth.credentials.password,
          updatedPasswordIdentifier
        );
        typeInInputFieldAndBlur(
          '',
          DS_JSON_UNIQUE_VALUES.attributes.auth.credentials.password,
          confirmUpdatedPasswordIdentifier
        );
        cy.getElementByTestId('updateStoredPasswordConfirmBtn').should(
          'be.enabled'
        );
        cy.getElementByTestId('updateStoredPasswordConfirmBtn').click({
          force: true,
        });
        cy.get('.euiModal', TIMEOUT_OPTS).should('not.exist');
        cy.contains('Password updated successfully.', TIMEOUT_OPTS).should(
          'exist'
        );
      });
    });
    describe('bottom bar: Save Changes -> "Change Credential Type & few fields"', () => {
      it('should change credential to "No Authentication" & save changes with valid form', () => {
        // credential: No Authentication
        cy.get('[data-test-subj="editDataSourceSelectAuthType"]').select(
          'no_auth'
        );
        typeInInputFieldAndBlur(
          'dataSourceTitle',
          DS_JSON_UNIQUE_VALUES.attributes.title,
          ''
        );
        cy.getElementByTestId('datasource-edit-saveButton')
          .should('be.enabled')
          .click();
        cy.getElementByTestId(
          'datasource-edit-saveButton',
          TIMEOUT_OPTS
        ).should('not.exist');
      });
      it('should verify that changes were updated successfully', () => {
        cy.get('[name="dataSourceTitle"]').should(
          'have.value',
          DS_JSON_UNIQUE_VALUES.attributes.title
        );
        // credential: No Authentication
        cy.get('[data-test-subj="editDataSourceSelectAuthType"]').should(
          'have.value',
          'no_auth'
        );
        cy.get('[name="datasourceUsername"]').should('not.exist');
        cy.get(passwordFieldIdentifier).should('not.exist');
        cy.getElementByTestId('editDatasourceUpdatePasswordBtn').should(
          'not.exist' // "Update Stored Password Button"
        );
      });
    });

    describe(`Updating current datasource auth type from "no auth" to "SigV4"`, () => {
      it('should change credential to "SigV4" & render only related fields', () => {
        // verify current auth type is "no auth"
        cy.get('[data-test-subj="editDataSourceSelectAuthType"]').should(
          'have.value',
          'no_auth'
        );
        cy.get('[data-test-subj="editDataSourceSelectAuthType"]').select(
          'sigv4'
        );

        // username & password fields should be hidden
        cy.get('input[name="datasourceUsername"]').should('not.exist');
        cy.get(passwordFieldIdentifier).should('not.exist');
        cy.getElementByTestId('editDatasourceUpdatePasswordBtn').should(
          'not.exist'
        );

        // SigV4 related fields should be visible
        cy.getElementByTestId('editDataSourceFormRegionField').should('exist');
        cy.getElementByTestId(
          'editDataSourceFormSigV4ServiceTypeSelect'
        ).should('have.value', 'es');
        cy.getElementByTestId('editDataSourceFormAccessKeyField').should(
          'exist'
        );
        cy.getElementByTestId('editDataSourceFormSecretKeyField').should(
          'exist'
        );
      });

      it('should make sure that region field is required', () => {
        cy.getElementByTestId('editDataSourceFormRegionField').should(
          'not.have.value'
        );
        typeInInputFieldAndBlur(
          '',
          '',
          '[data-test-subj="editDataSourceFormRegionField"]'
        );
        cy.get(
          'input[data-test-subj="editDataSourceFormRegionField"]:invalid'
        ).should('have.length', 1);
        cy.getElementByTestId('datasource-edit-saveButton').should(
          'be.disabled'
        );
      });
      it('should make sure that access key field is required', () => {
        cy.getElementByTestId('editDataSourceFormAccessKeyField').should(
          'not.have.value'
        );
        /* Required */
        typeInInputFieldAndBlur(
          '',
          '',
          '[data-test-subj="editDataSourceFormAccessKeyField"]'
        );
        cy.get(
          'input[data-test-subj="editDataSourceFormAccessKeyField"]:invalid'
        ).should('have.length', 1);
        cy.getElementByTestId('datasource-edit-saveButton').should(
          'be.disabled'
        );
      });
      it('should make sure that secret key field is required', () => {
        cy.getElementByTestId('editDataSourceFormSecretKeyField').should(
          'not.have.value'
        );
        /* Required */
        typeInInputFieldAndBlur(
          '',
          '',
          '[data-test-subj="editDataSourceFormSecretKeyField"]'
        );
        cy.get(
          'input[data-test-subj="editDataSourceFormSecretKeyField"]:invalid'
        ).should('have.length', 1);
        cy.getElementByTestId('datasource-edit-saveButton').should(
          'be.disabled'
        );
      });
    });

    describe('bottom bar: Save Changes -> "Change Credential Type to sigv4"', () => {
      it('should change credential to "SigV4" & save changes with valid form', () => {
        // credential: SigV4
        cy.get('[data-test-subj="editDataSourceSelectAuthType"]').select(
          'sigv4'
        );
        // set region
        typeInInputFieldAndBlur(
          '',
          DS_JSON_UNIQUE_VALUES.attributes.auth.credentials.region,
          '[data-test-subj="editDataSourceFormRegionField"]'
        );
        // set access key
        typeInInputFieldAndBlur(
          '',
          DS_JSON_UNIQUE_VALUES.attributes.auth.credentials.accessKey,
          '[data-test-subj="editDataSourceFormAccessKeyField"]'
        );

        // set secret key
        typeInInputFieldAndBlur(
          '',
          DS_JSON_UNIQUE_VALUES.attributes.auth.credentials.secretKey,
          '[data-test-subj="editDataSourceFormSecretKeyField"]'
        );

        // set service type
        cy.getElementByTestId(
          'editDataSourceFormSigV4ServiceTypeSelect'
        ).select(DS_JSON_UNIQUE_VALUES.attributes.auth.credentials.service);

        cy.getElementByTestId('datasource-edit-saveButton')
          .should('be.enabled')
          .click();
        cy.getElementByTestId(
          'datasource-edit-saveButton',
          TIMEOUT_OPTS
        ).should('not.exist');
      });
      it('should verify that changes were updated successfully', () => {
        cy.get('[data-test-subj="editDataSourceSelectAuthType"]').should(
          'have.value',
          'sigv4'
        );
        cy.getElementByTestId('editDataSourceFormRegionField').should(
          'have.value',
          DS_JSON_UNIQUE_VALUES.attributes.auth.credentials.region
        );
        cy.getElementByTestId(
          'editDataSourceFormSigV4ServiceTypeSelect'
        ).should(
          'have.value',
          DS_JSON_UNIQUE_VALUES.attributes.auth.credentials.service
        );
        cy.getElementByTestId('editDataSourceFormAccessKeyField').should(
          'be.disabled'
        );
        cy.getElementByTestId('editDataSourceFormSecretKeyField').should(
          'be.disabled'
        );
        cy.getElementByTestId('editDatasourceUpdateAwsCredentialBtn').should(
          'exist'
        );
      });
    });

    describe('delete datasource', () => {
      it('should open delete confirmation modal on click of trash icon', () => {
        cy.getElementByTestId('editDatasourceDeleteIcon')
          .should('exist')
          .click(FORCE_CLICK_OPTS);

        cy.getElementByTestId(
          'editDatasourceDeleteConfirmModal',
          TIMEOUT_OPTS
        ).should('exist');
        cy.getElementByTestId('confirmModalCancelButton').should('exist');
        cy.getElementByTestId('confirmModalConfirmButton').should('exist');
        cy.contains(
          'Any objects created using data from these sources, including Index Patterns, Visualizations, and Observability Panels, will be impacted.'
        ).should('exist');
        cy.contains('This action cannot be undone.').should('exist');
      });
      it('should close delete confirmation modal on cancel button click without deleting the datasource', () => {
        cy.getElementByTestId('confirmModalCancelButton')
          .should('exist')
          .click(FORCE_CLICK_OPTS);
        cy.getElementByTestId('editDatasourceDeleteConfirmModal').should(
          'not.exist'
        );
        cy.get('[name="dataSourceTitle"]').should(
          'have.value',
          DS_JSON_UNIQUE_VALUES.attributes.title
        );
      });
      it('should delete the datasource & navigate back to listing screen on click delete button on modal', () => {
        cy.getElementByTestId('editDatasourceDeleteIcon')
          .should('exist')
          .click(FORCE_CLICK_OPTS);

        cy.getElementByTestId('editDatasourceDeleteConfirmModal').should(
          'exist'
        );

        cy.getElementByTestId('confirmModalConfirmButton')
          .should('exist')
          .click(FORCE_CLICK_OPTS);
        cy.location('pathname', TIMEOUT_OPTS).should(
          'equal',
          '/app/management/opensearch-dashboards/dataSources'
        );
        checkIfTableIsLoaded();
        cy.get('tbody > tr').should(($tr) => {
          expect($tr).to.have.length(1);
        });
      });
    });
  });
}
