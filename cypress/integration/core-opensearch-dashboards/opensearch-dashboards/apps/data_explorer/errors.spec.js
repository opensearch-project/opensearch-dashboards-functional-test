/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    MiscUtils,
  } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { DX_DEFAULT_END_TIME, DX_DEFAULT_START_TIME } from '../../../../../utils/constants';

const miscUtils = new MiscUtils(cy);

describe('errors', () => {
    before(() => {
        // import invalid_scripted_field
        testFixtureHandler.importJSONMapping(
            'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/invalid_scripted_field/mappings.json.txt'
        );
      
        testFixtureHandler.importJSONDoc(
            'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/invalid_scripted_field/data.json.txt'
        );
        cy.setAdvancedSetting({ 
            defaultIndex: 'logstash-*',
         });

         miscUtils.visitPage('app/data-explorer/discover#/');
         cy.waitForLoader()

         cy.setTopNavDate(DX_DEFAULT_START_TIME, DX_DEFAULT_END_TIME)
         cy.waitForSearch()
    });

    describe('invalid scripted field error', function () {
        it('is rendered', function () {
         cy.getElementByTestId('painlessStackTrace')
           .should('be.visible')
        });
      });
})