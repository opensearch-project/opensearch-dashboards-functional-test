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

describe('saved queries saved objects', () => {
    before(() => {
        cy.setAdvancedSetting({ 
            defaultIndex: 'logstash-*',
         });
         
        // Go to the Discover page
        miscUtils.visitPage('app/data-explorer/discover#/');

        // Set time filter
        const fromTime = 'Sep 20, 2015 @ 08:00:00.000';
        const toTime = 'Sep 21, 2015 @ 08:00:00.000';
        cy.setTopNavDate(fromTime, toTime)

        // Set up query and filter
        cy.submitQuery('response:200')
        cy.submitFilterFromDropDown('extension.raw', 'is one of', 'jpg')

        cy.waitForLoader();
    });
  
    //   after(async () => {
    //     await opensearchArchiver.unload('index_pattern_with_encoded_id');
    //   });

    describe('saved query management component functionality', function () {
        before
    
        it('should expand the detail flyout when the toggle icon is clicked', function () {
          cy.getElementByTestId(`docTableExpandToggleColumn-${rowToInspect-1}`)
            .should('be.visible')
            .click()
          cy.getElementByTestId(`documentDetailFlyOut`)
            .should('be.visible')
        });
  
        it('should show the detail panel actions', function () {
            cy.get('[data-test-id="docTableRowAction"]')
              .should(`have.length`, 2)
        });
      });
})