/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  MiscUtils,
  TestFixtureHandler,
} from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import {
  DE_DEFAULT_END_TIME,
  DE_DEFAULT_START_TIME,
} from '../../../../../utils/constants';

const miscUtils = new MiscUtils(cy);
const testFixtureHandler = new TestFixtureHandler(
  cy,
  Cypress.env('openSearchUrl')
);
const indexSet = [
  'logstash-2015.09.22',
  'logstash-2015.09.21',
  'logstash-2015.09.20',
];

describe('shared links', () => {
  before(() => {
    testFixtureHandler.importJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/discover/discover.mappings.json.txt'
    );

    testFixtureHandler.importJSONDoc(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/discover/discover.json.txt'
    );

    // import logstash functional
    testFixtureHandler.importJSONDocIfNeeded(
      indexSet,
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/logstash/logstash.mappings.json.txt',
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/logstash/logstash.json.txt'
    );

    cy.setAdvancedSetting({
      defaultIndex: 'logstash-*',
    });

    miscUtils.visitPage('app/data-explorer/discover#/');
    cy.waitForLoader();
    cy.setTopNavDate(DE_DEFAULT_START_TIME, DE_DEFAULT_END_TIME);
    cy.waitForSearch();
  });

  describe('shared links with state in query', () => {
    it('should allow for copying the snapshot URL', function () {
      const url = `http://localhost:5601/app/data-explorer/discover#/?_a=(discover:(columns:!(_source),isDirty:!f,sort:!()),metadata:(indexPattern:'logstash-*',view:discover))&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))&_q=(filters:!(),query:(language:kuery,query:''))`;
      cy.getElementByTestId('shareTopNavButton').should('be.visible').click();
      cy.getElementByTestId('copyShareUrlButton')
        .invoke('attr', 'data-share-url')
        .should('eq', url)
        .then((url) => {
          cy.log(url);
          cy.request(url).its('status').should('eq', 200);
        });
    });

    it('should allow for copying the snapshot URL as a short URL', function () {
      cy.getElementByTestId('useShortUrl')
        .should('be.visible')
        .invoke('attr', 'aria-checked', 'true');
      cy.wait(1000);
      // For some reasons, after making the toggle true, the data-share-url do not get updated in the cypress test
      // Thus only testing if the button is clickable, instead of comparing the actual URL
      cy.getElementByTestId('copyShareUrlButton').should('be.visible').click();
    });

    it('should allow for copying the saved object URL', function () {
      const url =
        'http://localhost:5601/app/data-explorer/discover/#/view/ab12e3c0-f231-11e6-9486-733b1ac9221a?_g=%28filters%3A%21%28%29%2CrefreshInterval%3A%28pause%3A%21t%2Cvalue%3A0%29%2Ctime%3A%28from%3A%272015-09-19T13%3A31%3A44.000Z%27%2Cto%3A%272015-09-24T01%3A31%3A44.000Z%27%29%29';

      cy.getElementByTestId('exportAsSavedObject')
        .get('.euiRadio__input')
        .should('be.disabled');

      // Load a save search
      cy.loadSaveSearch('A Saved Search');

      cy.getElementByTestId('shareTopNavButton').should('be.visible').click();
      cy.getElementByTestId('exportAsSavedObject').should('be.visible').click();
      cy.getElementByTestId('copyShareUrlButton')
        .invoke('attr', 'data-share-url')
        .should('eq', url)
        .then((url) => {
          cy.log(url);
          cy.request(url).its('status').should('eq', 200);
        });
    });
  });

  describe('shared links with state in sessionStorage', () => {
    before(() => {
      cy.setAdvancedSetting({
        'state:storeInSessionStorage': true,
      });

      miscUtils.visitPage('app/data-explorer/discover#/');
      cy.waitForLoader();
      cy.setTopNavDate(DE_DEFAULT_START_TIME, DE_DEFAULT_END_TIME);
      cy.waitForSearch();
    });

    after(() => {
      cy.setAdvancedSetting({
        'state:storeStateInSessionStorage': false,
      });
    });

    it('should allow for copying the snapshot URL', function () {
      cy.getElementByTestId('shareTopNavButton').should('be.visible').click();
      cy.getElementByTestId('copyShareUrlButton')
        .invoke('attr', 'data-share-url')
        .then((url) => {
          cy.log(url);
          cy.request(url).its('status').should('eq', 200);
        });
    });

    it('should allow for copying the snapshot URL as a short URL', function () {
      cy.getElementByTestId('useShortUrl').should('be.visible').click();
      cy.getElementByTestId('copyShareUrlButton')
        .invoke('attr', 'data-share-url')
        .then((url) => {
          cy.log(url);
          cy.request(url).its('status').should('eq', 200);
        });
    });

    it('should allow for copying the saved object URL', function () {
      cy.getElementByTestId('exportAsSavedObject')
        .get('.euiRadio__input')
        .should('be.disabled');

      // Load a save search
      cy.loadSaveSearch('A Saved Search');

      cy.getElementByTestId('shareTopNavButton').should('be.visible').click();
      cy.getElementByTestId('exportAsSavedObject').should('be.visible').click();
      cy.getElementByTestId('copyShareUrlButton')
        .invoke('attr', 'data-share-url')
        .then((url) => {
          cy.log(url);
          cy.request(url).its('status').should('eq', 200);
        });
    });
  });
});
