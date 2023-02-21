/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AD_URL } from '../../../utils/constants';

context('Sample detectors', () => {
  // Helper fn that takes in a button test ID to determine
  // the sample detector to create
  const createSampleDetector = (createButtonDataTestSubj) => {
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
  };

  beforeEach(() => {
    cy.deleteAllIndices();
    cy.deleteADSystemIndices();
  });
  afterEach(() => {
    cy.deleteAllIndices();
    cy.deleteADSystemIndices();
  });

  it('HTTP response sample detector - create and delete', () => {
    createSampleDetector('createHttpSampleDetectorButton');
  });

  it('eCommerce sample detector - create and delete', () => {
    createSampleDetector('createECommerceSampleDetectorButton');
  });

  it('Host health sample detector - create and delete', () => {
    createSampleDetector('createHostHealthSampleDetectorButton');
  });
});
