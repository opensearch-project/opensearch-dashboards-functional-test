/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    TestFixtureHandler,
    MiscUtils,
  } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { DX_DEFAULT_END_TIME, DX_DEFAULT_START_TIME } from '../../../../../utils/constants';

const miscUtils = new MiscUtils(cy);
const testFixtureHandler = new TestFixtureHandler(
    cy,
    Cypress.env('openSearchUrl')
  );

describe('test large strings', () => {
    before(() => {
        testFixtureHandler.importJSONMapping(
            'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/empty_opensearch_dashboards/mappings.json.txt'
        )

        testFixtureHandler.importJSONDoc(
            'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/empty_opensearch_dashboards/data.json.txt'
        )

        testFixtureHandler.importJSONMapping(
            'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/hamlet/mappings.json.txt'
        )

        testFixtureHandler.importJSONDoc(
            'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/hamlet/data.json.txt'
        )

        //Error: could not locate the index pattern 'testlargestring'
        cy.setAdvancedSetting({ 
            defaultIndex: 'testlargestring',
         });
    });

    it('verify the large string book present', function () {
        // Go to the Discover page
        miscUtils.visitPage('app/data-explorer/discover#/');
        cy.waitForLoader()
        
        const ExpectedDoc =
          'mybook:Project Gutenberg EBook of Hamlet, by William Shakespeare' +
          ' This eBook is for the use of anyone anywhere in the United States' +
          ' and most other parts of the world at no cost and with almost no restrictions whatsoever.' +
          ' You may copy it, give it away or re-use it under the terms of the' +
          ' Project Gutenberg License included with this eBook or online at www.gutenberg.org.' +
          ' If you are not located in the United States,' +
          ' you’ll have to check the laws of the country where you are' +
          ' located before using this ebook.' +
          ' Title: Hamlet Author: William Shakespeare Release Date: November 1998 [EBook #1524]' +
          ' Last Updated: December 30, 2017 Language: English Character set encoding:';
  
        
      });

      describe('test large data', function () {
        it('search Newsletter should show the correct hit count', function () {
            cy.log('test Newsletter keyword is searched');
            const expectedHitCount = '1';
            const query = 'Newsletter'
            cy.submitQuery(query)
            cy.verifyHitCount(expectedHitCount)
        });
  
        it('the search term Newsletter should be highlighted in the field data', function () {
          cy.log('Newsletter appears only once')
          const expectedMarkCount = '1'
          cy.verifyMarkCount(expectedMarkCount)
        });
      });
  
    //   after(() => {
    //     await opensearchArchiver.unload('index_pattern_with_encoded_id');
    //   });
})