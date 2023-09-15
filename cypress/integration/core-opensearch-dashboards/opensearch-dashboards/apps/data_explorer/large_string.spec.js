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
            defaultIndex: 'fe302d30-62df-11e9-ab97-9ded634d922e',
         });
    });

    it('verify the large string book present', function () {
        // Go to the Discover page
        miscUtils.visitPage('app/data-explorer/discover#/');
        cy.wait(60000)
        cy.waitForLoader()
        
        const ExpectedDoc =
          'Project Gutenberg EBook of Hamlet, by William Shakespeare\n\nThis eBook is for the use of anyone anywhere in the United States and\nmost other parts of the world at no cost and with almost no\nrestrictions whatsoever. You may copy it, give it away or re-use it\nunder the terms of the Project Gutenberg License included with this\neBook or online at www.gutenberg.org. If you are not located in the\nUnited States, you’ll have to check the laws of the country where you\nare located before using this ebook.'

          cy.get('[data-test-subj="dataGridRowCell"]:nth-child(3) span')
            .contains(ExpectedDoc)
            .then(($el) => {
                cy.log($el[0])
                cy.log($el[0].text())
                cy.contain
                expect($el[0].text()).to.include('Project Gutenberg')
            })
            
      });

      describe('test large data', function () {
        it('search Newsletter should show the correct hit count', function () {
            cy.log('test Newsletter keyword is searched');
            const expectedHitCount = '1';
            const query = 'Newsletter'
            cy.setTopNavQuery(query)
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