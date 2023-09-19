/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import {
  DX_DEFAULT_END_TIME,
  DX_DEFAULT_START_TIME,
} from '../../../../../utils/constants';

const miscUtils = new MiscUtils(cy);

describe('test large strings', () => {
  before(() => {
    cy.setAdvancedSetting({
      defaultIndex: 'logstash-*',
    });

    miscUtils.visitPage('app/data-explorer/discover#/');
    cy.waitForLoader();
    cy.setTopNavDate(DX_DEFAULT_START_TIME, DX_DEFAULT_END_TIME);
    cy.waitForSearch();
  });

  describe('shared links with state in query', () => {
    it('should allow for copying the snapshot URL', function () {
      const url = `http://localhost:5601/app/data-explorer/discover#/?_a=(discover:(columns:!(_source),isDirty:!f,sort:!()),metadata:(indexPattern:'logstash-',view:discover))&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))&_q=(filters:!(),query:(language:kuery,query:''))`;
      cy.getElementByTestId('shareTopNavButton').should('be.visible').click();
      cy.getElementByTestId('copyShareUrlButton')
        .invoke('attr', 'data-share-url')
        //.should('eq', url)
        .then((url) => {
          cy.log(url);
          cy.request(url).its('status').should('eq', 200);
        });
    });

    it('should allow for copying the snapshot URL as a short URL', function () {
      cy.getElementByTestId('useShortUrl').should('be.visible').click();
      cy.getElementByTestId('copyShareUrlButton').should('be.visible');
    });

    it('should allow for copying the saved object URL', function () {
      cy.getElementByTestId('exportAsSavedObject')
        .get('.euiRadio__input')
        .should('be.disabled');

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
      cy.getElementByTestId('exportAsSavedObject')
        .get('.euiRadio__input')
        .should('be.disabled');

      // Load a save search
      cy.loadSaveSearch('A Saved Search');

      cy.getElementByTestId('shareTopNavButton').should('be.visible').click();
      cy.getElementByTestId('exportAsSavedObject').should('be.visible').click();
      cy.getElementByTestId('copyShareUrlButton').should('be.visible');
    });
  });
});
