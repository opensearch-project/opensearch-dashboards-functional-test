/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  TIMEOUT_OPTS,
  OSD_TEST_DOMAIN_ENDPOINT_URL,
} from '../../../../utils/dashboards/datasource-management-dashboards-plugin/constants';

const searchFieldIdentifier = 'input[type="search"]';
const tableHeadIdentifier = 'thead > tr > th';

if (Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')) {
  describe('Datasource Management: Table', () => {
    before(() => {
      // Visit Data Sources OSD
      cy.visitDataSourcesListingPage();
    });

    after(() => {
      // Clean up after all test are run
      cy.deleteAllDataSources();
    });

    it('should successfully load the page', () => {
      cy.contains(
        'Create and manage data source connections to help you retrieve data from multiple OpenSearch compatible sources.',
        TIMEOUT_OPTS
      );
    });

    describe('Empty State', () => {
      before(() => {
        // Clean up table before other tests run
        cy.deleteAllDataSources();
        cy.visitDataSourcesListingPage();
      });
      it('should show empty table state when no data sources are created yet', () => {
        cy.contains('No Data Source Connections have been created yet.').should(
          'exist'
        );
      });
    });

    describe('Sorting', () => {
      before(() => {
        // Create 25+ data sources that can be sorted alphabetically by using letters a-z
        for (let i = 97; i < 123; i++) {
          const char = String.fromCharCode(i);
          const dataSourceJSON = {
            attributes: {
              title: `ds_${char}`,
              description: `test ds_description_${char}`,
              endpoint: `${OSD_TEST_DOMAIN_ENDPOINT_URL}/${char}`,
              auth: {
                type: i % 2 ? 'username_password' : 'no_auth',
              },
            },
          };
          if (dataSourceJSON.attributes.auth.type === 'username_password') {
            dataSourceJSON.attributes.auth.credentials = {
              username: char,
              password: char,
            };
          }
          cy.createDataSource(dataSourceJSON);
        }
        cy.visitDataSourcesListingPage();
      });

      // Sort by title - by default
      it('should be sorted in ascending order on Datasource title column by default', () => {
        // Confirm we have ds_a in view and not ds_z
        cy.get('tbody > tr').should(($tr) => {
          expect($tr).to.have.length(10);
        });
        cy.contains('ds_a').should('exist');
        cy.contains('ds_z').should('not.exist');
      });

      // sort by description
      it('should be sorted in ascending/descending order on description column', () => {
        // case 1: Ascending order
        // Get the datasource table header and click it to sort ascending first
        cy.getColumnHeaderByNameAndClickForSorting(
          tableHeadIdentifier,
          'Description'
        );
        // Confirm we have "test ds_description_a" in view and not "test ds_description_z"
        cy.contains('test ds_description_a').should('exist');
        cy.contains('test ds_description_z').should('not.exist');

        // case 2: Descending order
        // Get the datasource table header and click it to sort descending
        cy.getColumnHeaderByNameAndClickForSorting(
          tableHeadIdentifier,
          'Description'
        );

        // Confirm we have "test ds_description_a" in view and not "test ds_description_z"
        cy.contains('test ds_description_a').should('not.exist');
        cy.contains('test ds_description_z').should('exist');
      });

      // sort Ascending by data source title
      it('should be sorted in ascending order by Datasource title', () => {
        // Get the datasource table header and click it to sort sscending first
        cy.getColumnHeaderByNameAndClickForSorting(
          tableHeadIdentifier,
          'Title'
        );

        // Confirm we have ds_a in view and not ds_z
        cy.contains('ds_a');
        cy.contains('ds_z').should('not.exist');
      });

      // sort descending by data source title
      it('should be sorted in descending order by Datasource title', () => {
        // Get the datasource table header and click it to sort descending first
        cy.getColumnHeaderByNameAndClickForSorting(
          tableHeadIdentifier,
          'Title'
        );

        // Confirm we have ds_z in view and not ds_a
        cy.contains('ds_z');
        cy.contains('ds_a').should('not.exist');

        // sort to ascending order for next steps
        cy.getColumnHeaderByNameAndClickForSorting(
          tableHeadIdentifier,
          'Title'
        );
      });
    });

    describe('Search', () => {
      // case 1: single match
      it('should be able to search for single match', () => {
        // Clear & Type in ds_z in search input
        cy.get(searchFieldIdentifier).focus().clear().type('ds_z');

        // Confirm we only see ds_z in table
        cy.get('tbody > tr').should(($tr) => {
          expect($tr, '1 row').to.have.length(1);
          expect($tr, 'item').to.contain('ds_z');
        });
      });
      // case 2: multiple match
      it('should be able to search for multiple matches', () => {
        // Type 'test' in search input
        cy.get(searchFieldIdentifier).focus().clear().type('test');

        // Confirm we only see one row table
        cy.get('tbody > tr').should(($tr) => {
          expect($tr, '1 row').to.have.length.above(1);
        });
      });
      // case 2.1: multiple match with different letter casing
      it('should be able to search even when letter casing is different', () => {
        // Clear & Type in test in search input
        cy.get(searchFieldIdentifier).focus().clear().type('TeSt');

        // Confirm we more than 1 rows
        cy.get('tbody > tr').should(($tr) => {
          expect($tr, '1 row').to.have.length.above(1);
        });
      });
      // case 3: No match
      it('should not display any rows when search finds NO MATCH', () => {
        // clear & Type in testNoMaTCH in search input
        cy.get(searchFieldIdentifier).focus().clear().type('testNoMaTCH');

        // Confirm we don't see any results
        cy.contains('No items found');
        // confirm pagination is not shown
        cy.contains('Rows Per Page').should('not.exist');

        cy.get(searchFieldIdentifier).focus().clear();
      });
      it('should show all rows when search is cleared', () => {
        cy.get(searchFieldIdentifier).focus().clear();
        // Confirm that only 10 rows are shown
        cy.get('tbody > tr').should(($tr) => {
          expect($tr).to.have.length(10);
        });
      });
    });

    describe('Pagination', () => {
      it('should successfully change rows per page & update no of pages', () => {
        // select 5 rows
        cy.getElementByTestId('tablePaginationPopoverButton').click();
        cy.get('.euiContextMenuItem__text').contains('5 rows').click();

        // Confirm that only 5 rows are shown
        cy.get('tbody > tr').should(($tr) => {
          expect($tr).to.have.length(5);
        });
        cy.get('li.euiPagination__item').should(($li) => {
          expect($li).to.have.length(6); // 6 pages
        });
        cy.getElementByTestId('pagination-button-next').should(
          'not.be.disabled'
        );
        cy.getElementByTestId('pagination-button-previous').should(
          'be.disabled'
        );

        // select 50 rows
        cy.getElementByTestId('tablePaginationPopoverButton').click();
        cy.get('.euiContextMenuItem__text').contains('50 rows').click();

        // Confirm that only 26 rows are shown
        cy.get('tbody > tr').should(($tr) => {
          expect($tr).to.have.length(26); // only 26 data sources created
        });
        cy.get('li.euiPagination__item').should(($li) => {
          expect($li).to.have.length(1); // 1 pages
        });
        cy.getElementByTestId('pagination-button-next').should('be.disabled');
        cy.getElementByTestId('pagination-button-previous').should(
          'be.disabled'
        );

        // select 25 rows
        cy.getElementByTestId('tablePaginationPopoverButton').click();
        cy.get('.euiContextMenuItem__text').contains('25 rows').click();

        // Confirm that only 25 rows are shown
        cy.get('tbody > tr').should(($tr) => {
          expect($tr).to.have.length(25);
        });
        cy.get('li.euiPagination__item').should(($li) => {
          expect($li).to.have.length(2); // 2 pages
        });

        // select 10 rows
        cy.getElementByTestId('tablePaginationPopoverButton').click();
        cy.get('.euiContextMenuItem__text').contains('10 rows').click();

        // Confirm that only 10 rows are shown
        cy.get('tbody > tr').should(($tr) => {
          expect($tr).to.have.length(10);
        });
        cy.get('li.euiPagination__item').should(($li) => {
          expect($li).to.have.length(3); // 3 pages
        });
      });

      it('should go navigate between pages using numbered buttons, next & previous arrows button on pagination', () => {
        cy.contains('ds_a').should('exist');
        cy.contains('ds_m').should('not.exist');

        // Next page
        cy.getElementByTestId('pagination-button-next').click();
        cy.contains('ds_a').should('not.exist');
        cy.contains('ds_m').should('exist');

        // Previous page
        cy.getElementByTestId('pagination-button-previous').click();
        cy.contains('ds_a').should('exist');
        cy.contains('ds_m').should('not.exist');

        // click on page numbers to navigate - last page
        cy.get('li.euiPagination__item').last().click();
        cy.contains('ds_a').should('not.exist');
        cy.contains('ds_z').should('exist');

        // click on page numbers to navigate - second page
        cy.get('li.euiPagination__item').eq(1).click();
        cy.contains('ds_m').should('exist');
        cy.contains('ds_a').should('not.exist');
        cy.contains('ds_z').should('not.exist');

        // click on page numbers to navigate - first page
        cy.get('li.euiPagination__item').first().click();
        cy.contains('ds_a').should('exist');
        cy.contains('ds_z').should('not.exist');
      });
    });
    describe('Selection & Deletion', () => {
      it('should not select any rows by default & delete button should be disabled', () => {
        cy.getElementByTestId('deleteDataSourceConnections').should(
          'be.disabled'
        );
        cy.getElementByTestId('deleteDataSourceConnections').should(
          'contain.text',
          'Delete  '
        );
      });

      it('should verify simple selection & un-selection of rows', () => {
        // Verify that delete button is disabled
        cy.getElementByTestId('deleteDataSourceConnections').should(
          'be.disabled'
        );
        // Select first 2 rows
        cy.get('tbody > tr > td.euiTableRowCellCheckbox [type="checkbox"]')
          .eq(0)
          .check();
        cy.get('tbody > tr > td.euiTableRowCellCheckbox [type="checkbox"]')
          .eq(1)
          .check();

        // Verify tha delete button is not disabled & displays expected text
        cy.getElementByTestId('deleteDataSourceConnections').should(
          'not.be.disabled'
        );
        cy.getElementByTestId('deleteDataSourceConnections').should(
          'contain.text',
          'Delete 2 connections'
        );

        // Un-select first two rows & Verify that delete button is disabled
        cy.get('tbody > tr > td.euiTableRowCellCheckbox [type="checkbox"]')
          .eq(0)
          .uncheck();
        cy.get('tbody > tr > td.euiTableRowCellCheckbox [type="checkbox"]')
          .eq(1)
          .uncheck();
        cy.getElementByTestId('deleteDataSourceConnections').should(
          'be.disabled'
        );
      });

      it('should select single row & perform delete', () => {
        cy.getElementByTestId('deleteDataSourceConnections').should(
          'be.disabled'
        );
        cy.contains('ds_a').should('exist');

        cy.get('tbody > tr > td.euiTableRowCellCheckbox [type="checkbox"]')
          .first()
          .check();

        cy.getElementByTestId('deleteDataSourceConnections').should(
          'contain.text',
          'Delete 1 connection'
        );

        // delete
        cy.getElementByTestId('deleteDataSourceConnections').click();
        cy.getElementByTestId('confirmModalConfirmButton').click();
        cy.contains('ds_a').should('not.exist');
        cy.getElementByTestId('deleteDataSourceConnections').should(
          'contain.text',
          'Delete  '
        );
      });

      it('should select multiple rows & perform delete', () => {
        cy.getElementByTestId('deleteDataSourceConnections').should(
          'be.disabled'
        );
        cy.contains('ds_b').should('exist');

        // select first 5 rows
        cy.get('tbody > tr > td.euiTableRowCellCheckbox [type="checkbox"]')
          .eq(0)
          .check();
        cy.get('tbody > tr > td.euiTableRowCellCheckbox [type="checkbox"]')
          .eq(1)
          .check();
        cy.get('tbody > tr > td.euiTableRowCellCheckbox [type="checkbox"]')
          .eq(2)
          .check();
        cy.get('tbody > tr > td.euiTableRowCellCheckbox [type="checkbox"]')
          .eq(3)
          .check();
        cy.get('tbody > tr > td.euiTableRowCellCheckbox [type="checkbox"]')
          .eq(4)
          .check();

        cy.getElementByTestId('deleteDataSourceConnections').should(
          'contain.text',
          'Delete 5 connections'
        );

        // delete
        cy.getElementByTestId('deleteDataSourceConnections').click();
        cy.getElementByTestId('confirmModalConfirmButton').click();
        cy.contains('ds_b').should('not.exist');
        cy.getElementByTestId('deleteDataSourceConnections').should(
          'contain.text',
          'Delete  '
        );
        cy.get('li.euiPagination__item').should(($li) => {
          expect($li).to.have.length(2); // 2 pages
        });
      });

      it('Select all rows should select only current page rows', () => {
        cy.getElementByTestId('checkboxSelectAll').check();
        cy.getElementByTestId('deleteDataSourceConnections').should(
          'contain.text',
          'Delete 10 connections'
        );
      });

      it('should lose selection when selection is made and sort happens', () => {
        // Select all rows
        cy.getElementByTestId('checkboxSelectAll').check();
        cy.getElementByTestId('deleteDataSourceConnections').should(
          'contain.text',
          'Delete 10 connections'
        );
        cy.getElementByTestId('deleteDataSourceConnections').should(
          'not.be.disabled'
        );

        // sort by description column
        cy.getColumnHeaderByNameAndClickForSorting(
          tableHeadIdentifier,
          'Description'
        );

        cy.getElementByTestId('deleteDataSourceConnections').should(
          'be.disabled'
        );
      });

      it('should lose selection when selection is made and pagination changes happens', () => {
        // Select all rows
        cy.getElementByTestId('checkboxSelectAll').check();
        cy.getElementByTestId('deleteDataSourceConnections').should(
          'contain.text',
          'Delete 10 connections'
        );
        cy.getElementByTestId('deleteDataSourceConnections').should(
          'not.be.disabled'
        );

        // Next page
        cy.getElementByTestId('pagination-button-next').click();

        cy.getElementByTestId('deleteDataSourceConnections').should(
          'be.disabled'
        );
      });

      it('should lose selection when selection is made and search happens', () => {
        // Select all rows
        cy.getElementByTestId('checkboxSelectAll').check();
        cy.getElementByTestId('deleteDataSourceConnections').should(
          'contain.text',
          'Delete 10 connections'
        );
        cy.getElementByTestId('deleteDataSourceConnections').should(
          'not.be.disabled'
        );

        // Clear & Type in ds_z in search input
        cy.get(searchFieldIdentifier).focus().clear().type('ds_z');

        cy.getElementByTestId('deleteDataSourceConnections').should(
          'be.disabled'
        );
      });
    });

    /* Create button*/
    describe('create button', () => {
      it('should navigate to create data source on button click', () => {
        cy.getElementByTestId('createDataSourceButton').first().click();
        cy.location('pathname').should(
          'eq',
          '/app/management/opensearch-dashboards/dataSources/create'
        );
      });
    });
  });
}
