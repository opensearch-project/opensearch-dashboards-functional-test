/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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

describe('Table visualization options', () => {
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
  });

  after(() => {
    cy.deleteIndex(TABLE_INDEX_ID);
    cy.deleteIndexPattern(TABLE_INDEX_PATTERN);
  });

  describe('Show percentage column', () => {
    const expectedData = ['≥ 0 and < 20', '1,059', '≥ 20 and < 40', '2,236'];
    const expectedDataWithPercentage = [
      '≥ 0 and < 20',
      '1,059',
      '32.14%',
      '≥ 20 and < 40',
      '2,236',
      '67.86%',
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
      cy.wait(500);
      cy.tbGetTableDataFromVisualization().then((data) => {
        expect(data).to.deep.eq(expectedData);
      });
    });

    it('Should show percentage columns', () => {
      cy.tbOpenOptionsPanel();
      cy.tbSelectPercentageColumn('Count');
      cy.tbUpdateAggregationSettings();
      cy.waitForLoader();
      cy.tbGetTableDataFromVisualization().then((data) => {
        expect(data).to.deep.eq(expectedDataWithPercentage);
      });
    });

    it('Should remove percentage columns', () => {
      cy.tbSelectPercentageColumn('Don’t show');
      cy.tbUpdateAggregationSettings();
      cy.waitForLoader();
      cy.tbGetTableDataFromVisualization().then((data) => {
        expect(data).to.deep.eq(expectedData);
      });
    });

    after(() => {
      cy.log('clean out all metrics and buckets aggregations');
      cy.tbOpenDataPanel();
      cy.tbRemoveAllAggregations(2);
      cy.tbUpdateAggregationSettings();
      cy.waitForLoader();
    });
  });

  describe('Show metrics for every bucket/level and partial', () => {
    const expectData = [
      'Cat',
      '79',
      '41',
      'Cat',
      '28',
      '40',
      'Dog',
      '31',
      '40',
      'Dog',
      '10',
      '39',
    ];
    const expectShowAllData = [
      'Cat',
      '2,500',
      '79',
      '41',
      'Cat',
      '2,500',
      '28',
      '40',
      'Dog',
      '2,500',
      '31',
      '40',
      'Dog',
      '2,500',
      '10',
      '39',
    ];
    const expectAverageData = [
      'Cat',
      '2,500',
      '54.986',
      '79',
      '41',
      '79',
      'Cat',
      '2,500',
      '54.986',
      '28',
      '40',
      '28',
      'Dog',
      '2,500',
      '54.799',
      '31',
      '40',
      '31',
      'Dog',
      '2,500',
      '54.799',
      '10',
      '39',
      '10',
    ];

    before(() => {
      cy.tbAddBucketsAggregation();
      cy.tbSplitRows();
      cy.tbSetupTermsAggregation('categories.keyword', 'Ascending', '2', 2);
      cy.waitForLoader();
      cy.tbAddBucketsAggregation();
      cy.tbSplitRows();
      cy.tbSetupTermsAggregation('age', 'Descending', '2', 3);
      cy.waitForLoader();
    });

    it('Should show correct data without showMetricsAtAllLevels', () => {
      cy.tbGetTableDataFromVisualization().then((data) => {
        expect(data).to.deep.eq(expectData);
      });
    });

    it('Should show correct data without showMetricsAtAllLevels even if showPartialRows is selected', () => {
      cy.tbOpenOptionsPanel();
      cy.tbToggleOptionByName('showPartialRows', 'true');
      cy.tbUpdateAggregationSettings();
      cy.waitForLoader();
      cy.tbGetTableDataFromVisualization().then((data) => {
        expect(data).to.deep.eq(expectData);
      });
    });

    it('Should show metrics on each level', () => {
      cy.tbOpenOptionsPanel();
      cy.tbToggleOptionByName('showMetricsAtAllLevels', 'true');
      cy.tbUpdateAggregationSettings();
      cy.waitForLoader();
      cy.tbGetTableDataFromVisualization().then((data) => {
        expect(data).to.deep.eq(expectShowAllData);
      });
    });

    it('Should show metrics other than count on each level', () => {
      cy.tbOpenDataPanel();
      cy.tbAddMetricsAggregation();
      cy.tbSelectAggregationType('Average', 4);
      cy.tbSelectAggregationField('age', 4);
      cy.tbUpdateAggregationSettings();
      cy.waitForLoader();
      cy.tbGetTableDataFromVisualization().then((data) => {
        expect(data).to.deep.eq(expectAverageData);
      });
    });

    after(() => {
      cy.log('clean out all metrics and buckets aggregations');
      cy.tbRemoveAllAggregations(4);
      cy.tbUpdateAggregationSettings();
      cy.waitForLoader();
    });
  });

  describe('Show Total', () => {
    before(() => {
      cy.tbAddBucketsAggregation();
      cy.tbSplitRows();
      cy.tbSetupTermsAggregation('categories.keyword', 'Descending', '3', 2);
      cy.waitForLoader();
    });

    it('Should not show total function if not enabled', () => {
      cy.tbOpenOptionsPanel();
      cy.getElementByTestId('showTotal')
        .invoke('attr', 'aria-checked')
        .should('eq', 'false');
    });

    it('Should show total function if enabled', () => {
      cy.tbOpenOptionsPanel();
      cy.tbToggleOptionByName('showTotal', 'true');
      cy.getElementByTestId('showTotal')
        .invoke('attr', 'aria-checked')
        .should('eq', 'true');
      cy.tbUpdateAggregationSettings();
      cy.waitForLoader();
    });

    it('Should show correct data if Count is selected', () => {
      const expectData = ['3', '3'];
      cy.tbSelectTotalFunctionByName('Count');
      cy.tbUpdateAggregationSettings();
      cy.waitForLoader();
      cy.tbGetTotalValueFromTable().then((data) => {
        expect(data).to.deep.eq(expectData);
      });
    });

    it('Should show correct data if Average is selected', () => {
      const expectData = ['', '2,500'];
      cy.tbSelectTotalFunctionByName('Average');
      cy.tbUpdateAggregationSettings();
      cy.waitForLoader();
      cy.tbGetTotalValueFromTable().then((data) => {
        expect(data).to.deep.eq(expectData);
      });
    });

    after(() => {
      cy.log('clean out all metrics and buckets aggregations');
      cy.tbOpenDataPanel();
      cy.tbRemoveAllAggregations(2);
      cy.tbUpdateAggregationSettings();
      cy.waitForLoader();
    });
  });
});
