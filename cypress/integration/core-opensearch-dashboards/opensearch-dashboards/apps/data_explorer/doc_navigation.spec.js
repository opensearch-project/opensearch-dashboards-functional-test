/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    MiscUtils,
  } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);

describe('doc link in discover', () => {
    beforeEach(() => {
        cy.setAdvancedSetting({ 
            defaultIndex: 'logstash-*',
         });

         miscUtils.visitPage(`app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`);
         cy.waitForLoader()
         cy.waitForSearch()
    });

    it('should open the doc view of the selected document', function () {
        cy.getElementByTestId(`docTableExpandToggleColumn-0`)
          .should('be.visible')
          .click()
        cy.getElementByTestId(`documentDetailFlyOut`)
          .should('be.visible')

        cy.getElementByTestId('docTableRowAction')
          .find('View single document')
          .click()
  
        cy.getElementByTestId('doc-hit')
          .should('be.visible')
      });

      it('if value is null, add filter should create a non-exist filter', function () {
        // Filter out special document
        cy.submitFilterFromDropDown('agent', 'is', 'Missing/Fields');
        cy.waitForSearch()
  
        cy.getElementByTestId(`docTableExpandToggleColumn-0`)
          .should('be.visible')
          .click()
        cy.getElementByTestId(`documentDetailFlyOut`)
          .should('be.visible')

        cy.getElementByTestId('tableDocViewRow-referer')
          .find(`[data-test-subj="addInclusiveFilterButton"]`)
          .click()

        cy.get('[data-test-subj~="filter-key-referer"]')
          .should('be.visible')
  
        cy.get('[data-test-subj~="filter-negated"]')
          .should('be.visible')
     
      });
})