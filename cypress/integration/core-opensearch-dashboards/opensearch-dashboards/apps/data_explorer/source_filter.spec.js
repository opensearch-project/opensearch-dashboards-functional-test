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
            'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/visualize_source-filters/mappings.json.txt'
        )

        testFixtureHandler.importJSONDoc(
            'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/visualize_source-filters/data.json.txt'
        )

        cy.setAdvancedSetting({ 
            defaultIndex: 'logstash-*',
         });

        // Go to the Discover page
        miscUtils.visitPage('app/data-explorer/discover#/');
        cy.waitForLoader()
    });

    it('should not get the field referer', function () {
          cy.get('[data-test-subj="dataGridRowCell"]:first-child')
          .then(($elElement) => {
            Cypress.log({
                $el: $elElement,
              });
          })

          cy.get('[data-test-subj="fieldList-field"]')
            .should('have.length', 5)

       
      }); 
    //   after(() => {
    //     await opensearchArchiver.unload('index_pattern_with_encoded_id');
    //   });
})