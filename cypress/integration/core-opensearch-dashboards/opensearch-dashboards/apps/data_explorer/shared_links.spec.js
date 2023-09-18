/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);

describe('test large strings', () => {
  before(() => {
    cy.setAdvancedSetting({
      defaultIndex: 'logstash-*',
    });

    miscUtils.visitPage('app/data-explorer/discover#/');
    cy.waitForLoader();
  });

  describe('shared links with state in query', () => {
    it('should allow for copying the snapshot URL', function () {
      cy.getElementByTestId('shareTopNavButton').should('be.visible').click();
      cy.getElementByTestId('copyShareUrlButton').should('be.visible');
    });

    it('should allow for copying the snapshot URL as a short URL', function () {
      cy.getElementByTestId('useShortUrl').should('be.visible').click();
      cy.getElementByTestId('copyShareUrlButton').should('be.visible');
    });

    it('should allow for copying the saved object URL', function () {
      cy.getElementByTestId('useSnapshotUrl')
        .should('be.visible')
        .should('not.be.enabled');

      // Load a save search
      cy.loadSaveSearch('A Saved Search');

      cy.getElementByTestId('shareTopNavButton').should('be.visible').click();
      cy.getElementByTestId('exportAsSavedObject').should('be.visible').click();
      cy.getElementByTestId('copyShareUrlButton').should('be.visible');
    });
  });

  describe('shared links with state in sessionStorage', () => {
    before(() => {
      cy.setAdvancedSetting({
        storeStateInSessionStorage: true,
      });

      miscUtils.visitPage('app/data-explorer/discover#/');
      cy.waitForLoader();
    });

    after(() => {
      cy.setAdvancedSetting({
        storeStateInSessionStorage: false,
      });
    });

    it('should allow for copying the snapshot URL as a short URL', function () {
      cy.getElementByTestId('useShortUrl').should('be.visible').click();
      cy.getElementByTestId('copyShareUrlButton').should('be.visible');
    });

    it('should allow for copying the saved object URL', function () {
      cy.getElementByTestId('useSnapshotUrl')
        .should('be.visible')
        .should('not.be.enabled');

      // Load a save search
      cy.loadSaveSearch('A Saved Search');

      cy.getElementByTestId('shareTopNavButton').should('be.visible').click();
      cy.getElementByTestId('exportAsSavedObject').should('be.visible').click();
      cy.getElementByTestId('copyShareUrlButton').should('be.visible');
    });
  });
});
