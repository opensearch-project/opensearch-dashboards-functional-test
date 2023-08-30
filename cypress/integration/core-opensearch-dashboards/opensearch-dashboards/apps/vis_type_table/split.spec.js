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

// TODO: https://github.com/opensearch-project/opensearch-dashboards-functional-test/issues/699
describe.skip('Split table', () => {
  const expectDataInitial = [
    [
      'Cat',
      '10,045',
      '1',
      'Cat',
      '10,096',
      '1',
      'Hawk',
      '17,505',
      '1',
      'Hawk',
      '17,644',
      '1',
    ],
    [
      'Dog',
      '12,518',
      '1',
      'Dog',
      '12,520',
      '1',
      'Cat',
      '10,195',
      '1',
      'Cat',
      '10,217',
      '1',
    ],
    [
      'Hawk',
      '17,529',
      '1',
      'Hawk',
      '17,597',
      '1',
      'Rabbit',
      '15,015',
      '1',
      'Rabbit',
      '15,194',
      '1',
    ],
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
  });

  it('Should have a splitted table in rows', () => {
    cy.tbAddBucketsAggregation();
    cy.tbSplitTables();
    cy.tbSplitTablesInRows();
    cy.tbSetupTermsAggregation('age', 'Descending', '3', 2);
    cy.waitForLoader();
    cy.tbToggleOpenEditor(2, 'false');
    cy.tbAddBucketsAggregation();
    cy.tbSplitRows();
    cy.tbSetupTermsAggregation('categories.keyword', 'Descending', '2', 3);
    cy.waitForLoader();
    cy.tbToggleOpenEditor(3, 'false');
    cy.tbAddBucketsAggregation();
    cy.tbSplitRows();
    cy.tbSetupTermsAggregation('salary', 'Descending', '2', 4);
    cy.tbToggleOpenEditor(4, 'false');
    cy.waitForLoader();
    cy.tbGetAllTableDataFromVisualization(3).then((data) => {
      expect(data).to.deep.eq(expectDataInitial);
    });
  });

  it('Should filter for value in all tables', () => {
    const expectDataAfterFilter = [
      ['Hawk', '17,591', '1', 'Hawk', '17,602', '1'],
      ['Hawk', '17,544', '1', 'Hawk', '17,648', '1'],
      ['Hawk', '17,503', '1', 'Hawk', '17,515', '1'],
    ];
    cy.tbClickTableCellAction(3, 2, 0, 'filter for');
    cy.waitForLoader();
    cy.tbGetAllTableDataFromVisualization(3).then((data) => {
      expect(data).to.deep.eq(expectDataAfterFilter);
    });
    cy.get('[aria-label="Delete"]').click();
    cy.waitForLoader();
    cy.tbGetAllTableDataFromVisualization(3).then((data) => {
      expect(data).to.deep.eq(expectDataInitial);
    });
    cy.tbClickTableCellAction(3, 2, 0, 'expand');
    cy.tbClickFilterFromExpand('filter for');
    cy.waitForLoader();
    cy.tbGetAllTableDataFromVisualization(3).then((data) => {
      expect(data).to.deep.eq(expectDataAfterFilter);
    });
    cy.get('[aria-label="Delete"]').click();
    cy.waitForLoader();
    cy.tbGetAllTableDataFromVisualization(3).then((data) => {
      expect(data).to.deep.eq(expectDataInitial);
    });
  });

  it('Should filter out value in all tables', () => {
    const expectDataAfterFilter = [
      [
        'Dog',
        '12,518',
        '1',
        'Dog',
        '12,520',
        '1',
        'Cat',
        '10,195',
        '1',
        'Cat',
        '10,217',
        '1',
      ],
      [
        'Rabbit',
        '15,032',
        '1',
        'Rabbit',
        '15,044',
        '1',
        'Cat',
        '10,007',
        '1',
        'Cat',
        '10,085',
        '1',
      ],
      [
        'Cat',
        '10,045',
        '1',
        'Cat',
        '10,096',
        '1',
        'Rabbit',
        '15,007',
        '1',
        'Rabbit',
        '15,140',
        '1',
      ],
    ];
    cy.tbClickTableCellAction(3, 2, 0, 'filter out');
    cy.waitForLoader();
    cy.tbGetAllTableDataFromVisualization(3).then((data) => {
      expect(data).to.deep.eq(expectDataAfterFilter);
    });
    cy.get('[aria-label="Delete"]').click();
    cy.waitForLoader();
    cy.tbGetAllTableDataFromVisualization(3).then((data) => {
      expect(data).to.deep.eq(expectDataInitial);
    });
    cy.tbClickTableCellAction(3, 2, 0, 'expand');
    cy.tbClickFilterFromExpand('filter out');
    cy.waitForLoader();
    cy.tbGetAllTableDataFromVisualization(3).then((data) => {
      expect(data).to.deep.eq(expectDataAfterFilter);
    });
    cy.get('[aria-label="Delete"]').click();
    cy.waitForLoader();
    cy.tbGetAllTableDataFromVisualization(3).then((data) => {
      expect(data).to.deep.eq(expectDataInitial);
    });
  });

  it('Should show metrics for split bucket when using showMetricsAtAllLevels', () => {
    const expectData = [
      [
        'Cat',
        '41',
        '10,045',
        '1',
        'Cat',
        '41',
        '10,096',
        '1',
        'Hawk',
        '34',
        '17,505',
        '1',
        'Hawk',
        '34',
        '17,644',
        '1',
      ],
      [
        'Dog',
        '37',
        '12,518',
        '1',
        'Dog',
        '37',
        '12,520',
        '1',
        'Cat',
        '32',
        '10,195',
        '1',
        'Cat',
        '32',
        '10,217',
        '1',
      ],
      [
        'Hawk',
        '35',
        '17,529',
        '1',
        'Hawk',
        '35',
        '17,597',
        '1',
        'Rabbit',
        '35',
        '15,015',
        '1',
        'Rabbit',
        '35',
        '15,194',
        '1',
      ],
    ];
    cy.tbOpenOptionsPanel();
    cy.tbToggleOptionByName('showMetricsAtAllLevels', 'true');
    cy.tbUpdateAggregationSettings();
    cy.waitForLoader();
    cy.tbGetAllTableDataFromVisualization(3).then((data) => {
      expect(data).to.deep.eq(expectData);
    });
  });

  it('Should update a splitted table in columns', () => {
    const expectData = [
      [
        'Cat',
        '41',
        '10,045',
        '1',
        'Cat',
        '41',
        '10,096',
        '1',
        'Hawk',
        '34',
        '17,505',
        '1',
        'Hawk',
        '34',
        '17,644',
        '1',
      ],
      [
        'Dog',
        '37',
        '12,518',
        '1',
        'Dog',
        '37',
        '12,520',
        '1',
        'Cat',
        '32',
        '10,195',
        '1',
        'Cat',
        '32',
        '10,217',
        '1',
      ],
    ];
    cy.tbOpenDataPanel();
    cy.tbToggleOpenEditor(2, 'true');
    cy.tbSplitTablesInColumns();
    cy.tbSetupTermsAggregation('age', 'Descending', '2', 2);
    cy.waitForLoader();
    cy.get('[class="visTable"]').should('exist');
    cy.tbGetAllTableDataFromVisualization(2).then((data) => {
      expect(data).to.deep.eq(expectData);
    });
  });

  it('Should sort column in all tables', () => {
    const expectData = [
      [
        'Cat',
        '41',
        '10,045',
        '1',
        'Cat',
        '41',
        '10,096',
        '1',
        'Hawk',
        '34',
        '17,505',
        '1',
        'Hawk',
        '34',
        '17,644',
        '1',
      ],
      [
        'Cat',
        '32',
        '10,195',
        '1',
        'Cat',
        '32',
        '10,217',
        '1',
        'Dog',
        '37',
        '12,518',
        '1',
        'Dog',
        '37',
        '12,520',
        '1',
      ],
    ];
    cy.tbSelectSortColumn(1, 0, 'asc');
    cy.waitForLoader();
    cy.tbGetAllTableDataFromVisualization(2).then((data) => {
      expect(data).to.deep.eq(expectData);
    });
  });

  it('Should adjust column width in all tables', () => {
    cy.tbGetColumnWidth(0, 1, 't0col0WidthBefore').then((first) => {
      cy.tbGetColumnWidth(1, 1, 't1col0WidthBefore').then((second) => {
        expect(second).to.eq(first);
      });
    });
    cy.tbAdjustColumnWidth(4, 1, 1, -50);
    cy.tbGetColumnWidth(0, 1, 't0col0WidthAfter').then((first) => {
      cy.tbGetColumnWidth(1, 1, 't1col0WidthAfter').then((second) => {
        expect(second).to.eq(first);
      });
    });
    cy.get('@t0col0WidthAfter').then((after) => {
      cy.get('@t0col0WidthBefore').then((before) => {
        expect(before).equal(after + 50);
      });
    });
    cy.get('@t1col0WidthAfter').then((after) => {
      cy.get('@t1col0WidthBefore').then((before) => {
        expect(before).equal(after + 50);
      });
    });
  });

  after(() => {
    cy.deleteIndex(TABLE_INDEX_ID);
    cy.deleteIndexPattern(TABLE_INDEX_PATTERN);
  });
});
