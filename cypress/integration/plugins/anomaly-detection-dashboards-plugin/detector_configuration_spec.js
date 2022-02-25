/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AD_URL,
  CREATE_SAMPLE_DETECTOR_TIMEOUT,
  getADConfigurationPageUrl,
} from '../../../utils/constants';

context('Detector configuration page', () => {
  // Create a sample detector and visit the config page
  before(() => {
    cy.server();
    cy.visit(AD_URL.OVERVIEW);
    cy.getElementByTestId('createHttpSampleDetectorButton').click();
    cy.visit(AD_URL.OVERVIEW);
    cy.getElementByTestId('viewSampleDetectorLink').click();
    cy.getElementByTestId('configurationsTab').click();
  });

  // Clean up created sample detector and index
  after(() => {
    cy.getElementByTestId('resultsTab').click();
    cy.getElementByTestId('stopAndStartDetectorButton').click();
    cy.getElementByTestId('detectorStateStopped').should('exist');
    cy.getElementByTestId('configurationsTab').click();

    cy.getElementByTestId('detectorIdCell').within(() => {
      cy.get('.euiText--medium')
        .invoke('text')
        .then((detectorId) => {
          cy.log('Deleting detector with ID: ' + detectorId);
          cy.deleteDetector(detectorId);
        });
    });

    cy.getElementByTestId('indexNameCell').within(() => {
      cy.get('.euiText--medium')
        .invoke('text')
        .then((indexName) => {
          cy.log('Deleting index with name: ' + indexName);
          cy.deleteIndex(indexName);
        });
    });
  });

  it('Empty dashboard redirects to overview page', () => {
    // TODO: add the different checks in here, or add new indiv tests, etc
    cy.getElementByTestId('detectorIdCell').should('exist');
  });
});
