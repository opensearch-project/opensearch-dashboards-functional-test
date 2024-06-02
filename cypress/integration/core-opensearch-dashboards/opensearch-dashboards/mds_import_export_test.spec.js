/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    CommonUI,
    MiscUtils,
  } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
  import { CURRENT_TENANT } from '../../../utils/commands';

  const commonUI = new CommonUI(cy);
  const miscUtils = new MiscUtils(cy);
  const baseURL = new URL(Cypress.config().baseUrl);
  // remove trailing slash
  const path = baseURL.pathname.replace(/\/$/, '');

  const disableLocalCluster = !!Cypress.env('DISABLE_LOCAL_CLUSTER');

  if (Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')) {
    describe('saved object migration', () => {
      before(() => {
        cy.deleteAllDataSources();
        CURRENT_TENANT.newTenant = 'global';
        let dataSourceId;
        let dataSourceTitle;
        // create data source
        cy.createDataSourceNoAuth().then((result) => {
          dataSourceId = result[0];
          dataSourceTitle = result[1];
          // prepare the the saved objects for import/export test
          cy.addSampleDataToDataSource(dataSourceTitle);
        });
      });

      after(() => {
        cy.removeSampleDataFromDataSource(dataSourceTitle);

        if (dataSourceId) {
          cy.deleteDataSource(dataSourceId);
        }
      });



      // describe('can export the saved object after adding sample data', () => {
      //   before(() => {
      //     // Go to the saved object page
      //     miscUtils.visitPage('app/management/opensearch-dashboards/objects');
      //     // cy.window().then((win) =>
      //     //   win.localStorage.setItem('home:welcome:show', false)
      //     // );
      //     cy.reload(true);
      //   });

      //   after(() => {
      //     cy.window().then((win) =>
      //       win.localStorage.removeItem('home:welcome:show')
      //     );
      //   });

      //   it('can export ecommerce revenue dashboards', () => {
      //     // // Check that tutorial_directory is visible
      //     // commonUI.checkElementExists(
      //     //   `a[href="${path}/app/home#/tutorial_directory"]`,
      //     //   2
      //     // );
      //     cy.viewData('ecommerce');
      //     commonUI.checkElementContainsValue(
      //       `span[title="[eCommerce] Revenue Dashboard_${dataSourceTitle}"]`,
      //       1,
      //       `\\[eCommerce\\] Revenue Dashboard_${dataSourceTitle}`
      //     );

      //     cy.contains('[eCommerce] Revenue Dashboard_${dataSourceTitle}').should('be.visible');
      //     //data-test-subj="checkboxSelectRow-722b74f0-b882-11e8-a6d9-e546fe2bba5f"
      //     cy.getElementByTestId(`checkboxSelectRow-${dataSourceId}`).check({ force: true })
      //     .should('be.checked');
      //     // Click the button next to Delete
      //     cy.contains('button', 'Export').click();
      //     // After clicking the Export button, there will be a panel displayed with export options, default option is chosen to include related objects
      //     // Need one more click on the Export button

      //     cy.contains('button', 'Export').click();

      //     cy.wait(1000);

      //      // Spy on the notifications.toasts.addSuccess method
      //     cy.window().then(win => {
      //       cy.spy(win.notifications.toasts, 'addSuccess').as('addSuccess');
      //     });

      //     // Call the function to show the success message
      //     cy.window().then(win => {
      //       win.showExportSuccessMessage(exportDetails);
      //     });

      //     // Assert that the success toast message is displayed
      //     cy.get('@addSuccess').should('be.calledWith', {
      //       title: 'Your file is downloading in the background'
      //     });
      //   });
      // });


      describe('import saved object test', () => {
        before(() => {
          // Go to the saved object page
          miscUtils.visitPage('app/management/opensearch-dashboards/objects');
          // cy.window().then((win) =>
          //   win.localStorage.setItem('home:welcome:show', false)
          // );
          cy.reload(true);
        });

        after(() => {
          cy.window().then((win) =>
            win.localStorage.removeItem('home:welcome:show')
          );
        });

        it('can import saved objects from ndjson file', () => {
          // // Check that tutorial_directory is visible
          // commonUI.checkElementExists(
          //   `a[href="${path}/app/home#/tutorial_directory"]`,
          //   2
          // );
          // cy.viewData('ecommerce');
          // commonUI.checkElementContainsValue(
          //   `span[title="[eCommerce] Revenue Dashboard_${dataSourceTitle}"]`,
          //   1,
          //   `\\[eCommerce\\] Revenue Dashboard_${dataSourceTitle}`
          // );

          // cy.contains('[eCommerce] Revenue Dashboard_${dataSourceTitle}').should('be.visible');
          // //data-test-subj="checkboxSelectRow-722b74f0-b882-11e8-a6d9-e546fe2bba5f"
          // cy.getElementByTestId(`checkboxSelectRow-${dataSourceId}`).check({ force: true })
          // .should('be.checked');
          // Click the button next to Delete
          cy.contains('button', 'Import').click();
          // cy.get('input[type="file"]').attachFile('dashboard/opensearch_dashboards/saved_objects_management/mds_log_objects.ndjson', { fileContent: 'mds_log_objects.ndjson' })
          // cy.get('[data-test-subj="comboBoxInput"]').click() // Open the dropdown
          cy.fixture('dashboard/opensearch_dashboards/saved_objects_management/mds_log_objects.ndjson').then(fileContent => {
            cy.get('input[type="file"]').attachFile({
              fileContent: fileContent,
              fileName: 'mds_log_objects.ndjson',
              mimeType: 'application/json'
            });
          });
          cy.selectFromDataSourceSelector(dataSourceTitle); // choose the data source that is created at the beginning of the test
          cy.get('#createNewCopiesDisabled').check();
          // Simulate clicking the import button
    cy.contains('Import').click();

    // Assuming there's a confirmation message after successful import
    cy.contains('Import successful').should('be.visible');

          // After clicking the Export button, there will be a panel displayed with export options, default option is chosen to include related objects
          // Need one more click on the Export button

          // cy.contains('button', 'Export').click();

          // cy.wait(1000);

          //  // Spy on the notifications.toasts.addSuccess method
          // cy.window().then(win => {
          //   cy.spy(win.notifications.toasts, 'addSuccess').as('addSuccess');
          // });

          // // Call the function to show the success message
          // cy.window().then(win => {
          //   win.showExportSuccessMessage(exportDetails);
          // });

          // // Assert that the success toast message is displayed
          // cy.get('@addSuccess').should('be.calledWith', {
          //   title: 'Your file is downloading in the background'
          // });
        });
      });



    });
  }
