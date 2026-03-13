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
import { CURRENT_TENANT } from '../../../../../utils/commands';

const commonUI = new CommonUI(cy);

// Wait time for UI interactions to complete
// This is needed because aggregation changes require time to process
const UI_WAIT_TIME = 500;

describe('table visualization data', () => {
  before(() => {
    CURRENT_TENANT.newTenant = 'global';
    cy.fleshTenantSettings();
    cy.deleteIndex(TABLE_INDEX_ID);
    cy.deleteIndexPattern(TABLE_INDEX_PATTERN);
    cy.bulkUploadDocs(TABLE_PATH_INDEX_DATA);
    cy.forceMergeSegments();
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
  });

  after(() => {
    cy.deleteIndex(TABLE_INDEX_ID);
    cy.deleteIndexPattern(TABLE_INDEX_PATTERN);
  });

  describe('Check Range aggregation and Percentage Col functions', () => {
    const expectedData = ['≥ 0 and < 20', '1,059', '≥ 20 and < 40', '2,236'];
    const expectedAverageData = [
      '≥ 0 and < 20',
      '1,059',
      '14.469',
      '≥ 20 and < 40',
      '2,236',
      '29.53',
    ];

    it('Should show correct range', () => {
      cy.tbAddBucketsAggregation();
      cy.tbSplitRows();
      cy.tbSetupRangeAggregation(
        'age',
        [
          ['0', '20'],
          ['20', '40'],
        ],
        2
      );
      cy.waitForLoader();
      cy.tbWaitForTableCellCount(expectedData.length);
      cy.tbGetTableDataFromVisualization().then((data) => {
        expect(data).to.deep.eq(expectedData);
      });
    });

    it('Should show correct average metrics', () => {
      cy.tbOpenDataPanel();
      cy.wait(UI_WAIT_TIME);
      cy.tbAddMetricsAggregation();
      cy.wait(UI_WAIT_TIME);
      cy.tbSelectAggregationType('Average', 3);
      cy.wait(UI_WAIT_TIME);
      cy.tbSelectAggregationField('age', 3);
      cy.wait(UI_WAIT_TIME);
      cy.tbUpdateAggregationSettings();
      cy.waitForLoader();
      cy.tbWaitForTableCellCount(expectedAverageData.length);
      cy.tbGetTableDataFromVisualization().then((data) => {
        expect(data).to.deep.eq(expectedAverageData);
      });
    });

    after(() => {
      cy.log('clean out all metrics and buckets aggregations');
      cy.tbRemoveAllAggregations(3);
      cy.tbUpdateAggregationSettings();
      cy.waitForLoader();
    });
  });

  describe('Check Average Pipeline aggregation', () => {
    it('Should show correct data when using average pipeline aggregation', () => {
      const expectedData = ['10,000', '128.2'];
      cy.tbAddMetricsAggregation();
      cy.wait(UI_WAIT_TIME);
      cy.tbSelectAggregationType('Average Bucket', 2);
      cy.wait(UI_WAIT_TIME);
      cy.tbSelectSubAggregationType('Terms', 2, 'buckets');
      cy.wait(UI_WAIT_TIME);
      cy.tbSelectSubAggregationField('age', 2, 'buckets');
      cy.wait(UI_WAIT_TIME);
      cy.tbSelectSubAggregationType('Count', 2, 'metrics');
      cy.wait(UI_WAIT_TIME);
      cy.tbUpdateAggregationSettings();
      cy.waitForLoader();
      cy.tbWaitForTableCellCount(expectedData.length);
      cy.tbGetTableDataFromVisualization().then((data) => {
        expect(data).to.deep.eq(expectedData);
      });
    });

    after(() => {
      cy.log('clean out all metrics and buckets aggregations');
      cy.tbRemoveAllAggregations(2);
      cy.tbUpdateAggregationSettings();
      cy.waitForLoader();
    });
  });

  describe('Check Date Histogram aggregation and filter functons', () => {
    it('Should show correct data for a data table with date histogram', () => {
      const expectedData = ['2021', '13', '2022', '9,987'];
      cy.tbAddBucketsAggregation();
      cy.tbSplitRows();
      cy.tbSetupDateHistogramAggregation('timestamp', 'Year', 2);
      cy.waitForLoader();
      cy.tbWaitForTableCellCount(expectedData.length);
      cy.tbGetTableDataFromVisualization().then((data) => {
        expect(data).to.deep.eq(expectedData);
      });
    });

    it('Should correctly filter for applied time filter on the main timefield', () => {
      commonUI.addFilterRetrySelection('timestamp', 'is', '2022-05-30');
      cy.waitForLoader();
      cy.tbWaitForTableCellCount(2);
      cy.tbGetTableDataFromVisualization().then((data) => {
        expect(data).to.deep.eq(['2022', '37']);
      });
      commonUI.removeFilter('timestamp');
      cy.waitForLoader();
      cy.wait(UI_WAIT_TIME);

      // Add range filter manually to ensure proper date format handling
      // Using explicit format to avoid timezone parsing issues in React 18
      cy.get('[data-test-subj="addFilter"]').click();
      cy.wait(UI_WAIT_TIME);

      // Select field
      cy.get('[data-test-subj="filterFieldSuggestionList"]')
        .find('[data-test-subj="comboBoxInput"]')
        .type('timestamp');
      cy.get(
        '[data-test-subj="comboBoxOptionsList filterFieldSuggestionList-optionsList"]'
      )
        .find('[title="timestamp"]')
        .click({ force: true });
      cy.wait(UI_WAIT_TIME);

      // Select operator
      cy.get('[data-test-subj="filterOperatorList"]')
        .find('[data-test-subj="comboBoxInput"]')
        .type('is between');
      cy.get(
        '[data-test-subj="comboBoxOptionsList filterOperatorList-optionsList"]'
      )
        .find('[title="is between"]')
        .click({ force: true });
      cy.wait(UI_WAIT_TIME);

      // Enter date values with full ISO format including timezone
      cy.get('[data-test-subj="filterParams"]').find('input').first().clear();
      cy.get('[data-test-subj="filterParams"]')
        .find('input')
        .first()
        .type('2022-05-30T00:00:00.000Z', { delay: 50 });
      cy.wait(UI_WAIT_TIME);
      cy.get('[data-test-subj="filterParams"]').find('input').last().clear();
      cy.get('[data-test-subj="filterParams"]')
        .find('input')
        .last()
        .type('2022-08-30T00:00:00.000Z', { delay: 50 });
      cy.wait(UI_WAIT_TIME);

      // Save filter
      cy.get('[data-test-subj="saveFilter"]').click();
      cy.waitForLoader();

      // Check the data
      cy.tbWaitForTableCellCount(2);
      cy.tbGetTableDataFromVisualization().then((data) => {
        cy.log('Actual table data:', JSON.stringify(data));
        expect(data).to.deep.eq(['2022', '3,370']);
      });
    });

    it('Should correctly filter for pinned filters', () => {
      commonUI.pinFilter('timestamp');
      cy.waitForLoader();
      cy.tbWaitForTableCellCount(2);
      cy.tbGetTableDataFromVisualization().then((data) => {
        expect(data).to.deep.eq(['2022', '3,370']);
      });
      commonUI.removeFilter('timestamp');
      cy.waitForLoader();
      cy.tbWaitForTableCellCount(4);
    });

    after(() => {
      cy.log('clean out all metrics and buckets aggregations');
      cy.tbRemoveAllAggregations(2);
      cy.tbUpdateAggregationSettings();
      cy.waitForLoader();
    });
  });

  describe('Check Terms aggregation and missing values', () => {
    it('Should show correct data before and after adding doc', () => {
      cy.waitForLoader();
      cy.tbWaitForTableCellCount(1);
      cy.tbGetTableDataFromVisualization().then((data) => {
        expect(data).to.deep.eq(['10,000']);
      });
      // add a doc with missing values
      cy.insertDocumentToIndex('vis-table', 10000, {
        timestamp: '2022-08-30T23:20:41.280Z',
        username: 'missing',
      });
      cy.forceMergeSegments();
      cy.reload();
      cy.waitForLoader();
      cy.tbWaitForTableCellCount(1);
      cy.tbGetTableDataFromVisualization().then((data) => {
        expect(data).to.deep.eq(['10,001']);
      });
    });

    it('Should group data in other', () => {
      const expectDataBeforeGroupInOther = [
        '79',
        '132',
        '54',
        '129',
        '33',
        '128',
        '31',
        '126',
        '57',
        '126',
      ];
      const expectDataAfterGroupInOther = [
        '79',
        '132',
        '54',
        '129',
        '33',
        '128',
        '31',
        '126',
        '57',
        '126',
        'Other',
        '9,359',
      ];
      cy.tbAddBucketsAggregation();
      cy.tbSplitRows();
      cy.tbSetupTermsAggregation('age', 'Descending', '5', 2);
      cy.waitForLoader();
      cy.tbWaitForTableCellCount(expectDataBeforeGroupInOther.length);
      cy.tbGetTableDataFromVisualization().then((data) => {
        expect(data).to.deep.eq(expectDataBeforeGroupInOther);
      });
      cy.tbToggleOtherBucket('true');
      cy.wait(UI_WAIT_TIME);
      cy.tbUpdateAggregationSettings();
      cy.waitForLoader();
      cy.tbWaitForTableCellCount(expectDataAfterGroupInOther.length);
      cy.tbGetTableDataFromVisualization().then((data) => {
        expect(data).to.deep.eq(expectDataAfterGroupInOther);
      });
    });

    it.skip('Should include missing data', () => {
      const expectDataBeforeMissing = [
        'Bryce88@gmail.com',
        '2',
        'Isaiah22@yahoo.com',
        '2',
        'Jake54@gmail.com',
        '2',
        'Linnea4@yahoo.com',
        '2',
        'Sherwood92@gmail.com',
        '2',
        '9,990',
      ];
      const expectDataAfterMissing = [
        'Bryce88@gmail.com',
        '2',
        'Isaiah22@yahoo.com',
        '2',
        'Jake54@gmail.com',
        '2',
        'Linnea4@yahoo.com',
        '2',
        'Sherwood92@gmail.com',
        '2',
        '9,991',
      ];
      cy.tbSelectAggregationField('email.keyword', 2);
      cy.wait(UI_WAIT_TIME);
      cy.tbUpdateAggregationSettings();
      cy.waitForLoader();
      cy.tbWaitForTableCellCount(expectDataBeforeMissing.length);
      cy.tbGetTableDataFromVisualization().then((data) => {
        expect(data).to.deep.eq(expectDataBeforeMissing);
      });
      cy.tbToggleMissingBucket('true');
      cy.wait(UI_WAIT_TIME);
      cy.tbUpdateAggregationSettings();
      cy.waitForLoader();
      cy.tbWaitForTableCellCount(expectDataAfterMissing.length);
      cy.tbGetTableDataFromVisualization().then((data) => {
        expect(data).to.deep.eq(expectDataAfterMissing);
      });
    });

    after(() => {
      cy.log('clean out all metrics and buckets aggregations');
      cy.tbRemoveAllAggregations(2);
      cy.tbUpdateAggregationSettings();
      cy.waitForLoader();
    });
  });
});
