/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AD_URL } from '../../../utils/constants';

context('Overview page', () => {
  const validatePageElements = () => {
    cy.getElementByTestId('overviewTitle').should('exist');
    cy.getElementByTestId('createHttpSampleDetectorButton').should('exist');
    cy.getElementByTestId('createECommerceSampleDetectorButton').should(
      'exist'
    );
    cy.getElementByTestId('createHostHealthSampleDetectorButton').should(
      'exist'
    );
  };

  before(() => {
    cy.server();
  });

  it('Empty dashboard redirects to overview page', () => {
    cy.visit(AD_URL.DASHBOARD);
    cy.getElementByTestId('sampleDetectorButton').click();
    validatePageElements();
  });

  it('Empty detector list redirects to overview page', () => {
    cy.visit(AD_URL.DETECTOR_LIST);
    cy.getElementByTestId('sampleDetectorButton').click();
    validatePageElements();
  });

  it('Side nav AD button redirects to overview page', () => {
    cy.visit(AD_URL.DETECTOR_LIST);

    cy.get('.euiSideNav').contains('Anomaly detection').click();
    validatePageElements();
  });
});
