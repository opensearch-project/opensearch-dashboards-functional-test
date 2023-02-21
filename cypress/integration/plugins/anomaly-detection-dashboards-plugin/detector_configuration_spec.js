/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AD_URL } from '../../../utils/constants';

context('Detector configuration page', () => {
  // Creating a sample detector and visiting the config page. Stopping the detector
  // for easier checks when editing detector
  before(() => {
    cy.deleteAllIndices();
    cy.deleteADSystemIndices();
    cy.visit(AD_URL.OVERVIEW);
    cy.getElementByTestId('createHttpSampleDetectorButton').click();
    cy.wait(10000);
    cy.visit(AD_URL.OVERVIEW);
    cy.getElementByTestId('viewSampleDetectorLink').click();
    cy.getElementByTestId('resultsTab').click();
    cy.getElementByTestId('stopAndStartDetectorButton').click();
    cy.getElementByTestId('detectorStateStopped').should('exist');
    cy.getElementByTestId('configurationsTab').click();
  });

  after(() => {
    cy.deleteAllIndices();
    cy.deleteADSystemIndices();
  });

  it('Redirect to edit detector settings from button', () => {
    cy.getElementByTestId('detectorSettingsHeader').should('exist');
    cy.getElementByTestId('modelConfigurationHeader').should('exist');
    cy.getElementByTestId('detectorJobsHeader').should('exist');

    cy.getElementByTestId('editDetectorSettingsButton').click();

    cy.getElementByTestId('defineOrEditDetectorTitle').should('exist');
    cy.go('back');

    cy.getElementByTestId('defineOrEditDetectorTitle').should('not.exist');
    cy.getElementByTestId('detectorSettingsHeader').should('exist');
    cy.getElementByTestId('modelConfigurationHeader').should('exist');
    cy.getElementByTestId('detectorJobsHeader').should('exist');
  });

  it('Redirect to edit model configuration from button', () => {
    cy.getElementByTestId('detectorSettingsHeader').should('exist');
    cy.getElementByTestId('modelConfigurationHeader').should('exist');
    cy.getElementByTestId('detectorJobsHeader').should('exist');

    cy.getElementByTestId('editModelConfigurationButton').click();

    cy.getElementByTestId('configureOrEditModelConfigurationTitle').should(
      'exist'
    );
    cy.go('back');

    cy.getElementByTestId('configureOrEditModelConfigurationTitle').should(
      'not.exist'
    );
    cy.getElementByTestId('detectorSettingsHeader').should('exist');
    cy.getElementByTestId('modelConfigurationHeader').should('exist');
    cy.getElementByTestId('detectorJobsHeader').should('exist');
  });

  it('Redirect to edit detector settings from dropdown', () => {
    cy.getElementByTestId('detectorSettingsHeader').should('exist');
    cy.getElementByTestId('modelConfigurationHeader').should('exist');
    cy.getElementByTestId('detectorJobsHeader').should('exist');

    cy.getElementByTestId('actionsButton').click();
    cy.getElementByTestId('editDetectorSettingsItem').click();

    cy.getElementByTestId('defineOrEditDetectorTitle').should('exist');
    cy.go('back');

    cy.getElementByTestId('defineOrEditDetectorTitle').should('not.exist');
    cy.getElementByTestId('detectorSettingsHeader').should('exist');
    cy.getElementByTestId('modelConfigurationHeader').should('exist');
    cy.getElementByTestId('detectorJobsHeader').should('exist');
  });

  it('Redirect to edit model configuration from dropdown', () => {
    cy.getElementByTestId('detectorSettingsHeader').should('exist');
    cy.getElementByTestId('modelConfigurationHeader').should('exist');
    cy.getElementByTestId('detectorJobsHeader').should('exist');

    cy.getElementByTestId('actionsButton').click();
    cy.getElementByTestId('editModelConfigurationItem').click();

    cy.getElementByTestId('configureOrEditModelConfigurationTitle').should(
      'exist'
    );
    cy.go('back');

    cy.getElementByTestId('configureOrEditModelConfigurationTitle').should(
      'not.exist'
    );
    cy.getElementByTestId('detectorSettingsHeader').should('exist');
    cy.getElementByTestId('modelConfigurationHeader').should('exist');
    cy.getElementByTestId('detectorJobsHeader').should('exist');
  });

  it('Delete detector from dropdown, redirects to detector list page', () => {
    cy.getElementByTestId('detectorSettingsHeader').should('exist');
    cy.getElementByTestId('modelConfigurationHeader').should('exist');
    cy.getElementByTestId('detectorJobsHeader').should('exist');

    cy.getElementByTestId('actionsButton').click();
    cy.getElementByTestId('deleteDetectorItem').click();
    cy.getElementByTestId('typeDeleteField').type('delete', { force: true });
    cy.getElementByTestId('confirmButton').click();

    cy.getElementByTestId('detectorListHeader').should('exist');
  });
});
