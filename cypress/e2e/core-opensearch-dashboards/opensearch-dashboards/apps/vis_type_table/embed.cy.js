/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommonUI } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import {
  BASE_PATH,
  TABLE_INDEX_ID,
  TABLE_PATH_INDEX_DATA,
  TABLE_INDEX_PATTERN,
  TABLE_PATH_SO_DATA,
  TABLE_BASIC_VIS_TITLE,
  TABLE_VIS_APP_PATH,
  TABLE_INDEX_START_TIME,
  TABLE_INDEX_END_TIME,
  toTestId,
} from '../../../../../utils/constants';

const commonUI = new CommonUI(cy);

/**
 * Embed test suite description:
 * Sometimes, we might want to embed a visualization in an iframe.
 * This suite is to test how an embedded table visualization works.
 * In this test suite, we have the following tests:
 * Test that a table visualization is loaded properly in embedded mode.
 * Test that table visualization can be filtered in embedded mode.
 * Test that table visualization can filter for value. There are two ways
 * to filter for value. First is to click the filter for button. Second is
 * to click the expand button then choose fiter for option. We test both ways.
 * Test that table visualization can filter out value. Same as filter for value.
 */

describe('table visualization in embedded mode', () => {
  const expectedData = [
    '0',
    '1,059',
    '20',
    '2,236',
    '40',
    '2,200',
    '60',
    '2,211',
    '80',
    '2,179',
    '100',
    '115',
  ];

  before(() => {
    cy.deleteIndex(TABLE_INDEX_ID);
    cy.deleteIndexPattern(TABLE_INDEX_PATTERN);
    cy.bulkUploadDocs(TABLE_PATH_INDEX_DATA);
    cy.importSavedObjects(TABLE_PATH_SO_DATA);
    // Load table visualization
    cy.visit(`${BASE_PATH}/app/visualize`);
    cy.get('input[type="search"]').type(`${TABLE_BASIC_VIS_TITLE}{enter}`);
    cy.get('.euiBasicTable-loading').should('not.exist'); // wait for the loading to stop
    cy.getElementByTestId(
      `visListingTitleLink-${toTestId(TABLE_BASIC_VIS_TITLE)}`
    )
      .should('exist')
      .click();
    cy.url().should('contain', TABLE_VIS_APP_PATH);
    cy.setTopNavDate(TABLE_INDEX_START_TIME, TABLE_INDEX_END_TIME);
    cy.waitForLoader();
    // Set a Histogram Aggregation
    // We will use this aggregation for all test case
    cy.tbAddBucketsAggregation();
    cy.tbSplitRows();
    cy.tbSetupHistogramAggregation('age', '20', 2);
    cy.url().then((url) => {
      let embedUrl = url + '&embed=true';
      cy.wrap(embedUrl).as('embedUrl');
    });
    cy.get('@embedUrl').then((url) => {
      expect(url).to.contain('&embed=true');
      cy.visit(url);
      cy.reload();
    });
  });

  //  after(() => {
  //    cy.deleteIndex(TABLE_INDEX_ID);
  //    cy.deleteIndexPattern(TABLE_INDEX_PATTERN);
  //  });

  it('Should open table vis in embedded mode', () => {
    cy.tbGetTableDataFromVisualization().then((data) => {
      expect(data).to.deep.eq(expectedData);
    });
  });

  it('Should allow to filter in embedded mode', () => {
    commonUI.addFilterRangeRetrySelection('age', 'is between', '10', '30');
    cy.reload();
    cy.tbGetTableDataFromVisualization().then((data) => {
      expect(data).to.deep.eq(['0', '1,059', '20', '1,114']);
    });
    commonUI.removeFilter('age');
    cy.reload();
    cy.tbGetTableDataFromVisualization().then((data) => {
      expect(data).to.deep.eq(expectedData);
    });
  });

  it('Should filter for value in embedded mode', () => {
    cy.tbClickTableCellAction(2, 0, 0, 'filter for', 0, true);
    cy.reload();
    cy.tbGetTableDataFromVisualization().then((data) => {
      expect(data).to.deep.eq(['0', '1,059']);
    });
    commonUI.removeFilter('age');
    cy.reload();
    cy.tbGetTableDataFromVisualization().then((data) => {
      expect(data).to.deep.eq(expectedData);
    });
    cy.tbClickTableCellAction(2, 0, 0, 'expand', 0, true);
    cy.tbClickFilterFromExpand('filter for');
    cy.reload();
    cy.tbGetTableDataFromVisualization().then((data) => {
      expect(data).to.deep.eq(['0', '1,059']);
    });
    commonUI.removeFilter('age');
    cy.reload();
    cy.tbGetTableDataFromVisualization().then((data) => {
      expect(data).to.deep.eq(expectedData);
    });
  });

  it('Should filter out value in embedded mode', () => {
    const expectedFilterOutData = [
      '20',
      '2,236',
      '40',
      '2,200',
      '60',
      '2,211',
      '80',
      '2,179',
      '100',
      '115',
    ];
    cy.tbClickTableCellAction(2, 0, 0, 'filter out', 0, true);
    cy.reload();
    cy.tbGetTableDataFromVisualization().then((data) => {
      expect(data).to.deep.eq(expectedFilterOutData);
    });
    commonUI.removeFilter('age');
    cy.reload();
    cy.tbGetTableDataFromVisualization().then((data) => {
      expect(data).to.deep.eq(expectedData);
    });
    cy.tbClickTableCellAction(2, 0, 0, 'expand', 0, true);
    cy.tbClickFilterFromExpand('filter out');
    cy.reload();
    cy.tbGetTableDataFromVisualization().then((data) => {
      expect(data).to.deep.eq(expectedFilterOutData);
    });
    commonUI.removeFilter('age');
    cy.reload();
    cy.tbGetTableDataFromVisualization().then((data) => {
      expect(data).to.deep.eq(expectedData);
    });
  });
});
