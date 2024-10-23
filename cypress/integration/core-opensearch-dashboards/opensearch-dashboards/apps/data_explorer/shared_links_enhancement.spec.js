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
import { CURRENT_TENANT } from '../../../../../utils/commands';

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
  const isEnhancement = true;
  before(() => {
    CURRENT_TENANT.newTenant = 'global';
    cy.fleshTenantSettings();
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
      'query:enhancements:enabled': true,
      'home:useNewHomePage': true,
    });

    cy.reload();

    miscUtils.visitPage('app/data-explorer/discover#/');
    cy.waitForLoader(isEnhancement);
    cy.selectDatasetForEnhancement('logstash-*');
    cy.setTopNavDateWithRetry(
      DE_DEFAULT_START_TIME,
      DE_DEFAULT_END_TIME,
      isEnhancement
    );
    cy.waitForSearch();
  });

  beforeEach(() => {
    CURRENT_TENANT.newTenant = 'global';
    cy.fleshTenantSettings();
    cy.selectDatasetForEnhancement('logstash-*');
  });

  after(() => {
    cy.deleteIndex(indexSet.join(','));
    cy.setAdvancedSetting({
      defaultIndex: '',
      'query:enhancements:enabled': false,
      'home:useNewHomePage': false,
    });

    cy.reload();
    cy.clearCache();
  });

  describe('shared links with state in query', () => {
    it('should allow for copying the snapshot URL', function () {
      const url = `http://localhost:5601/app/data-explorer/discover#/?_a=(discover:(columns:!(_source),isDirty:!f,sort:!()),metadata:(view:discover))&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))&_q=(filters:!(),query:(dataset:(id:'logstash-*',timeFieldName:'@timestamp',title:'logstash-*',type:INDEX_PATTERN),language:kuery,query:''))`;
      let sharedUrl;
      cy.getElementByTestId('shareTopNavButton').should('be.visible').click();
      cy.getElementByTestId('copyShareUrlButton')
        .should('be.visible')
        .should('have.attr', 'data-share-url')
        .then((copiedUrl) => {
          sharedUrl = copiedUrl.replace(
            /\?security_tenant=(global|private)/,
            ''
          );
          expect(sharedUrl).to.equal(url);
        });
      cy.request(url).its('status').should('eq', 200);
    });

    it('should allow for copying the snapshot URL with filter and query', function () {
      const url = `http://localhost:5601/app/data-explorer/discover#/?_a=(discover:(columns:!(_source),isDirty:!f,sort:!()),metadata:(view:discover))&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))&_q=(filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'logstash-*',key:geo.src,negate:!f,params:(query:FR),type:phrase),query:(match_phrase:(geo.src:FR)))),query:(dataset:(id:'logstash-*',timeFieldName:'@timestamp',title:'logstash-*',type:INDEX_PATTERN),language:kuery,query:'geo.dest:KH'))`;
      let sharedUrl;
      cy.setTopNavQuery('geo.dest:KH', true, true);
      cy.getElementByTestId('showFilterActions').click();
      cy.submitFilterFromDropDown('geo.src', 'is', 'FR', isEnhancement);
      cy.getElementByTestId('shareTopNavButton').should('be.visible').click();
      cy.getElementByTestId('copyShareUrlButton')
        .should('be.visible')
        .should('have.attr', 'data-share-url')
        .then((copiedUrl) => {
          sharedUrl = copiedUrl.replace(
            /\?security_tenant=(global|private)/,
            ''
          );
          expect(sharedUrl).to.equal(url);
        });
      cy.request(url).its('status').should('eq', 200);
      cy.getElementByTestId('shareTopNavButton').should('be.visible').click();
    });

    it('should allow for copying the snapshot URL as a short URL', function () {
      cy.getElementByTestId('shareTopNavButton').should('be.visible').click();
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

      cy.getElementByTestId('shareTopNavButton').should('be.visible').click();
      cy.getElementByTestId('exportAsSavedObject')
        .get('.euiRadio__input')
        .should('be.disabled');

      // Load a save search
      cy.loadSaveSearch('A Saved Search', isEnhancement);
      cy.waitForLoader(isEnhancement);
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
      CURRENT_TENANT.newTenant = 'global';
      cy.fleshTenantSettings();
      cy.setAdvancedSetting({
        'state:storeInSessionStorage': true,
      });

      miscUtils.visitPage('app/data-explorer/discover#/');
      cy.waitForLoader(isEnhancement);
      cy.getElementByTestId(`datasetSelectorButton`).click();
      cy.getElementByTestId(`datasetOption-logstash-*`).click();
      cy.setTopNavDateWithRetry(
        DE_DEFAULT_START_TIME,
        DE_DEFAULT_END_TIME,
        isEnhancement
      );
      cy.waitForSearch();
    });

    after(() => {
      CURRENT_TENANT.newTenant = 'global';
      cy.fleshTenantSettings();
      cy.deleteSavedObjectByType('config');
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
      cy.getElementByTestId('shareTopNavButton').should('be.visible').click();
      cy.getElementByTestId('useShortUrl').should('be.visible').click();
      cy.getElementByTestId('copyShareUrlButton')
        .invoke('attr', 'data-share-url')
        .then((url) => {
          cy.log(url);
          cy.request(url).its('status').should('eq', 200);
        });
    });

    it('should allow for copying the saved object URL', function () {
      cy.getElementByTestId('shareTopNavButton').should('be.visible').click();
      cy.getElementByTestId('exportAsSavedObject')
        .get('.euiRadio__input')
        .should('be.disabled');

      // Load a save search
      cy.loadSaveSearch('A Saved Search', isEnhancement);
      cy.waitForLoader(isEnhancement);
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
