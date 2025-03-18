/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  MiscUtils,
  TestFixtureHandler,
} from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { cloneDeep } from 'lodash';
import { CURRENT_TENANT } from '../../../../../utils/commands';

const miscUtils = new MiscUtils(cy);
const testFixtureHandler = new TestFixtureHandler(
  cy,
  Cypress.env('openSearchUrl')
);

const indexSet = [
  'logstash-2015.09.22',
  'logstash-2015.09.21',
  'logstash-2015.09.20',
];

// Setting up the page
describe('discover_table', () => {
  before(() => {
    // import logstash functional
    CURRENT_TENANT.newTenant = 'global';
    testFixtureHandler.importJSONDocIfNeeded(
      indexSet,
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/logstash/logstash.mappings.json.txt',
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/logstash/logstash.json.txt'
    );

    testFixtureHandler.importJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/discover/discover.mappings.json.txt'
    );

    testFixtureHandler.importJSONDoc(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/discover/discover.json.txt'
    );

    testFixtureHandler.importJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/index_with_nested_field/mappings.json.txt'
    );

    testFixtureHandler.importJSONDoc(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/index_with_nested_field/data.json.txt'
    );

    cy.setAdvancedSetting({
      defaultIndex: 'logstash-*',
    });

    // Go to the Discover page
    miscUtils.visitPage(
      `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
    );
    cy.waitForSearch();
  });

  describe('auto line wrapping in legacy table', () => {
    it('auto line wrapping in legacy table', function () {
      // last element is _scrore if there is wrapping this field won't be present
      // So we check for the presence of the _score element in the legacy table

      cy.get('.euiDescriptionList__title').should('contain.text', '_score');
    });
  });

  describe('expand multiple documents in legacy table', () => {
    before(() => {
      cy.wait(2000); // Intentional Wait to account for low performant env
    });

    it('checks if multiple documents can be expanded in legacy table', function () {
      // expanding a document in the table
      cy.get('[data-test-subj="docTableExpandToggleColumn"]')
        .find('[type="button"]')
        .eq(2)
        .click();

      // expanding a document in the table
      cy.get('[data-test-subj="docTableExpandToggleColumn"]')
        .find('[type="button"]')
        .eq(3)
        .click();

      // checking the number of exapnded documents visible on screen
      cy.get('[data-test-subj="tableDocViewRow-_index"]').should(
        'have.length',
        2
      );
    });
  });

  describe('data source selector', () => {
    before(() => {
      // Creating additional index patterns
      // logstash index pattern

      cy.createIndexPattern(
        'logstash-sample-1',
        {
          title: 'logstash-sample-1*',
          timeFieldName: 'timestamp',
        },
        {
          securitytenant: ['global'],
        }
      );
      cy.createIndexPattern(
        'logstash-sample-2',
        {
          title: 'logstash-sample-2*',
          timeFieldName: 'timestamp',
        },
        {
          securitytenant: ['global'],
        }
      );
      cy.wait(5000); // Intentional Wait
      cy.reload();
    });
    it('check data source selector options are ordered', function () {
      const indexPatterns = [];

      cy.get('[data-test-subj="comboBoxSearchInput"]')
        .type('l')
        .then(() => {
          cy.get('[type="DEFAULT_INDEX_PATTERNS"]')
            .each((res) => {
              indexPatterns.push(res.text());
            })
            .then(() => {
              const sortedIndexPatterns = cloneDeep(indexPatterns);
              sortedIndexPatterns.sort();

              console.log(sortedIndexPatterns);

              cy.wrap(indexPatterns).should('deep.equal', sortedIndexPatterns);
            });
        });
    });

    it('check filtering in data source selector ', function () {
      cy.get('[data-test-subj="comboBoxSearchInput"]')
        .clear()
        .type('logstash-sample')
        .then(() => {
          cy.get('[type="DEFAULT_INDEX_PATTERNS"]').should('have.length', 2);
        });
    });

    after(() => {
      cy.deleteIndexPattern('logstash-sample-1');
      cy.deleteIndexPattern('logstash-sample-2');
    });
  });

  describe('Infinity Scroll in legacy table', () => {
    before(() => {
      miscUtils.visitPage(
        `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
      );
      cy.waitForSearch();
    });
    describe('Legacy Table', () => {
      it.skip('check scroll down adds 50 entries at a time', function () {
        // Each row of the table has 2 instance of docTableExpandToggleColumn element
        // Therefore row count is half of the count of docTableExpandToggleColumn element
        cy.get('[data-test-subj="docTableExpandToggleColumn"]').should(
          'have.length',
          100
        );

        // scrolling to the end
        cy.get('[data-test-subj="discoverDocTableFooter"]')
          .scrollIntoView({ duration: 1000 })
          .then(() => {
            cy.get('[data-test-subj="docTableExpandToggleColumn"]').should(
              'have.length',
              200
            );
          });
      });

      it.skip('check maximum number of documents loaded', function () {
        // Scrolling the page 11 times including the previous scroll
        for (let i = 0; i < 10; i++) {
          cy.get('[data-test-subj="discoverDocTableFooter"]').scrollIntoView({
            duration: 100,
          });
          cy.wait(300); // Intentional Wait
        }

        // scrolling to the end
        cy.get('[data-test-subj="docTableExpandToggleColumn"]').should(
          'have.length',
          1000
        );
      });

      it('check functionality of Back to top button', function () {
        cy.get('[data-test-subj="discoverDocTableFooter"]')
          .scrollIntoView({ duration: 1000 })
          .then(() => {
            cy.get('[data-test-subj="docTableField"]')
              .contains('Sep 22, 2015 @ 16:50:13.253')
              .should('not.be.visible');

            cy.get('[type="button"]')
              .contains('Back to top.')
              .click()
              .then(() => {
                // First row should be visible if we navigated to top
                cy.get('[data-test-subj="docTableField"]')
                  .contains('Sep 22, 2015 @ 16:50:13.253')
                  .should('be.visible');
              });
          });
      });
    });
  });
  describe('AutoSize table', () => {
    describe('Legacy Table', () => {
      it('check table Auto Size with change in time range', function () {
        cy.get('[data-test-subj="docTableExpandToggleColumn"]')
          .its('length')
          .then((noEntries) => {
            cy.setTopNavDate(
              'Sep 22, 2015 @ 14:00:00.000',
              'Sep 22, 2015 @ 14:05:00.000'
            );
            cy.verifyHitCount('2'); // Intentional Wait
            cy.get('[data-test-subj="docTableExpandToggleColumn"]')
              .its('length')
              .should('be.lessThan', noEntries);
          });
      });

      it('check table Auto Size with filter', function () {
        cy.setTopNavDate(
          'Sep 22, 2015 @ 14:00:00.000',
          'Sep 22, 2015 @ 18:00:00.000'
        );
        cy.waitForLoader(); // Intentional Wait
        cy.get('[aria-label="Toggle row details"]')
          .its('length')
          .then((noEntries) => {
            cy.get('[data-test-subj="field-extension-showDetails"]')
              .click()
              .then(() => {
                cy.get('[data-test-subj="plus-extension-gif"]')
                  .click()
                  .then(() => {
                    cy.verifyHitCount('1'); // Intentional Wait
                    cy.get('[aria-label="Toggle row details"]')
                      .its('length')
                      .should('be.lessThan', noEntries);
                  });
              });
          });
      });

      after(() => {
        miscUtils.visitPage(
          `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
        );
        cy.waitForSearch();
      });
    });
  });

  after(() => {
    cy.reload();
    cy.deleteIndexPattern('nestedindex');
    cy.deleteIndex('nestedindex');
    cy.clearCache();
    miscUtils.visitPage(
      `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
    );
    cy.waitForSearch();
  });
});

describe('Saved Queries', () => {
  it('check creating saved query', () => {
    // Creating a saved Query
    miscUtils.visitPage(
      `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
    );
    cy.waitForSearch();

    cy.get('[data-test-subj="saved-query-management-popover-button"]').click();

    cy.get('[data-test-subj="saved-query-management-save-button"]')
      .click()
      .then(() => {
        cy.get('[data-test-subj="saveQueryFormTitle"]')
          .clear()
          .type('Sample Saved Query');

        cy.get('[data-test-subj="savedQueryFormSaveButton"]').click();
      });

    // Verifiy the saved Query
    cy.get('[data-test-subj="saved-query-management-popover-button"]').click();

    cy.get('[type="button"]').should('contain.text', 'Sample Saved Query');
  });

  it('check deleting saved query', () => {
    if (Cypress.env('SECURITY_ENABLED')) {
      miscUtils.visitPage(
        `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
      );
      cy.waitForLoader();
      cy.waitForSearch();
    } else {
      cy.reload();
    }
    cy.get('[data-test-subj="saved-query-management-popover-button"]').click();

    cy.get('[class="euiListGroupItem__button"]').trigger('mouseover');

    cy.get(
      '[data-test-subj="delete-saved-query-Sample Saved Query-button"]'
    ).click({ force: true });

    cy.get('[data-test-subj="confirmModalConfirmButton"]').click({
      force: true,
    });

    cy.get('[data-test-subj="saved-query-management-popover-button"]').click();

    cy.get('[type="button"]').should('not.contain.text', 'Sample Saved Query');
  });
});

describe('Saved Search Embeddables', () => {
  describe('Legacy Table', () => {
    before(() => {
      miscUtils.visitPage(
        `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
      );
      cy.waitForSearch();
      cy.get('[data-test-subj="discoverSaveButton"]')
        .click()
        .then(() => {
          cy.get('[data-test-subj="savedObjectTitle"]')
            .clear()
            .type('Legacy Saved Search');
          cy.get('[data-test-subj="confirmSaveSavedObjectButton"]').click();
        });
      cy.get('[data-test-subj="savedObjectSaveModal"]').should('not.exist');
    });
    it('check adding legacy table saved search embeddable in dashboard', function () {
      // navigate to dashboard page
      miscUtils.visitPage(
        `/app/dashboards#/create?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
      );
      // click on add
      cy.get('[data-test-subj="dashboardAddPanelButton"]').click();
      cy.get('[data-test-subj="savedObjectTitleLegacy-Saved-Search"]').click();
      cy.get('[data-test-subj="euiFlyoutCloseButton"]').click();
      cy.get('[data-test-subj="docTableHeader-@timestamp"]').should(
        'be.visible'
      );
      cy.get('[data-test-subj="docTableHeader-_source"]').should('be.visible');
    });

    it('check sort order is retained in legacy table saved search embeddable', function () {
      cy.get('[data-test-subj="docTableField"]')
        .eq(0)
        .invoke('text')
        .then((firstDate) => {
          cy.get('[data-test-subj="docTableField"]')
            .eq(2)
            .invoke('text')
            .then((secondDate) => {
              expect(new Date(secondDate)).lessThan(new Date(firstDate));
            });
        });
    });
  });

  after(() => {
    cy.deleteSavedObjectByType('search');
  });
});
