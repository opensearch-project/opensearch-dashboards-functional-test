/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AD_URL } from '../../../utils/constants';

context('Overview page', () => {
  function validatePageElements() {
    cy.getElementByTestId('overviewTitle').should('exist');
    cy.getElementByTestId('createHttpSampleDetectorButton').should('exist');
    cy.getElementByTestId('createECommerceSampleDetectorButton').should(
      'exist'
    );
    cy.getElementByTestId('createHostHealthSampleDetectorButton').should(
      'exist'
    );
    cy.getElementByTestId('flyoutInfoButton').should('have.length', 3);
  }

  // Takes an index as an argument, to click on the n'th found flyout button
  function openAndCloseFlyout(flyoutButtonIndex) {
    cy.getElementByTestId('detectorDetailsHeader').should('not.exist');
    cy.getElementByTestId('indexDetailsHeader').should('not.exist');

    cy.getElementByTestId('flyoutInfoButton').eq(flyoutButtonIndex).click();

    cy.getElementByTestId('detectorDetailsHeader').should('exist');
    cy.getElementByTestId('indexDetailsHeader').should('exist');

    cy.getElementByTestId('euiFlyoutCloseButton').click();

    cy.getElementByTestId('detectorDetailsHeader').should('not.exist');
    cy.getElementByTestId('indexDetailsHeader').should('not.exist');
  }

  before(() => {
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

  context('Flyouts open and close', () => {
    it('HTTP responses sample detector', () => {
      cy.visit(AD_URL.OVERVIEW);
      validatePageElements();
      openAndCloseFlyout(0);
    });

    it('eCommerce sample detector', () => {
      cy.visit(AD_URL.OVERVIEW);
      validatePageElements();
      openAndCloseFlyout(1);
    });

    it('Host health sample detector', () => {
      cy.visit(AD_URL.OVERVIEW);
      validatePageElements();
      openAndCloseFlyout(2);
    });
  });
});
