/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);

describe('discover sidebar', () => {
  before(() => {
    cy.setAdvancedSetting({
      defaultIndex: 'logstash-*',
    });

    miscUtils.visitPage('app/data-explorer/discover#/');
    cy.waitForLoader();
  });

  describe('field filtering', function () {
    it('should reveal and hide the filter form when the toggle is clicked', function () {
      cy.getElementByTestId('toggleFieldFilterButton').click();
      cy.getElementByTestId('filterSelectionPanel').should('be.visible');

      cy.getElementByTestId('toggleFieldFilterButton').click();
      cy.getElementByTestId('filterSelectionPanel').should('not.be.visible');
    });
  });

  // Add a test to test the expanding and collapsing behavior of the sidebar once it is implemented
  // According to issue https://github.com/opensearch-project/OpenSearch-Dashboards/issues/4780
});
