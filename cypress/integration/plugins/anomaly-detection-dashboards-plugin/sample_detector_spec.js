/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AD_URL,
} from '../../../utils/constants';

context('Sample detectors', () => {
  // Helper fn used in many of the below tests. Takes in a button test ID to determine
  // the sample detector to create/delete from the overview page
  const createAndDeleteSampleDetector = (createButtonDataTestSubj) => {
    cy.visit(AD_URL.OVERVIEW);

    cy.getElementByTestId('overviewTitle').should('exist');
    cy.getElementByTestId('viewSampleDetectorLink').should('not.exist');
    cy.getElementByTestId(createButtonDataTestSubj).click();
    cy.visit(AD_URL.OVERVIEW);

    // Check that the details page defaults to real-time, and shows detector is initializing
    cy.getElementByTestId('viewSampleDetectorLink').click();
    cy.getElementByTestId('detectorNameHeader').should('exist');
    cy.getElementByTestId('sampleIndexDetailsCallout').should('exist');
    cy.getElementByTestId('realTimeResultsHeader').should('exist');
    cy.getElementByTestId('detectorStateInitializing').should('exist');

    // Stop the detector so it can be deleted
    cy.getElementByTestId('stopAndStartDetectorButton').click();
    cy.getElementByTestId('detectorStateStopped').should('exist');

    // Visit configuration page to get the info to clean up detector and index
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
  };

  before(() => {
    cy.server();
  });

  it('HTTP response sample detector - create and delete', () => {
    createAndDeleteSampleDetector('createHttpSampleDetectorButton');
  });

  it('eCommerce sample detector - create and delete', () => {
    createAndDeleteSampleDetector('createECommerceSampleDetectorButton');
  });

  it('Host health sample detector - create and delete', () => {
    createAndDeleteSampleDetector('createHostHealthSampleDetectorButton');
  });
});
