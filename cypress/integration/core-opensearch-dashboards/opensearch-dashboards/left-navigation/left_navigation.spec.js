/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const isWorkspaceEnabled = Cypress.env('WORKSPACE_ENABLED');
const workspaceName = `test_nav_menu`;
const workspaceDescription =
  'This is a test workspace for left navigation menu.';
let workspaceId;

const createWorkspace = (feature) => {
  return cy
    .createWorkspace({
      name: `${workspaceName}_${feature}`,
      description: workspaceDescription,
      features: [`use-case-${feature}`],
    })
    .then((value) => {
      workspaceId = value;
      return value;
    });
};

if (isWorkspaceEnabled) {
  const validateWorkspaceNavMenu = (feature, callbackFn) => {
    createWorkspace(feature).then(() => {
      cy.visit(`w/${workspaceId}/app/discover`);
      // overview page should be loaded
      cy.get('.content').should('exist');

      // navigation menu should be hidden initially
      cy.get('.navGroupEnabledNavTopWrapper').should('not.exist');

      // top right navigation menu button should exist
      cy.get('.navToggleInLargeScreen').should('exist').click();

      // navigation should be expanded and display content correctly
      cy.get('.left-navigation-wrapper').within(() => {
        cy.contains(`${workspaceName}_${feature}`).should('exist');
        cy.get('.navGroupEnabledHomeIcon').should('exist');
        cy.get('input[type="search"]').should('exist');
        cy.contains(/Manage workspace/).should('exist');

        // additional assertion according to different type of workspace
        callbackFn();
      });
    });
  };

  const validateWorkspaceNavMenuSearch = (input, callbackFn) => {
    createWorkspace('all').then(() => {
      cy.visit(`w/${workspaceId}/app/all_overview`);

      // expand the navigation menu
      cy.get('.navToggleInLargeScreen').should('exist').click();

      cy.get('input[type="search"]').should('exist').click();
      cy.get('input[type="search"]').type(input);

      callbackFn();
    });
  };

  describe('Left navigation menu in workspace', () => {
    before(() => {
      cy.deleteAllWorkspaces();
    });

    afterEach(() => {
      if (workspaceId) {
        cy.deleteWorkspaceById(workspaceId);
      }
    });

    it('features are visible inside left navigation for analytics use case', () => {
      validateWorkspaceNavMenu('all', () => {
        cy.contains(/Visualize and report/).should('exist');
        cy.contains(/Observability/).should('exist');
        cy.contains(/Security Analytics/).should('exist');
        cy.contains(/Search/).should('exist');
        cy.contains(/Detect/).should('exist');
      });
    });

    it('features are visible inside left navigation for essentials use case', () => {
      validateWorkspaceNavMenu('essentials', () => {});
    });

    it('features are visible inside left navigation for search use case', () => {
      validateWorkspaceNavMenu('search', () => {
        cy.contains(/Visualize and report/).should('exist');
        // TODO: Move this to search relevance functional tests
        // Renamed to "Search relevance" in https://github.com/opensearch-project/dashboards-search-relevance/pull/533
        isWorkspaceEnabled && cy.contains(/Search relevance/).should('exist');
      });
    });

    it('features are visible inside left navigation for security analytics use case', () => {
      validateWorkspaceNavMenu('security-analytics', () => {
        cy.contains(/Visualize and report/).should('exist');
        cy.contains(/Threat detection/).should('exist');
        cy.contains(/Detect/).should('exist');
        cy.contains(/Alerting/).should('exist');
        cy.contains(/Anomaly Detection/).should('exist');
      });
    });

    it('features are visible inside left navigation for observability use case', () => {
      validateWorkspaceNavMenu('observability', () => {
        cy.contains(/Visualize and report/).should('exist');
        cy.contains(/Detect/).should('exist');
      });
    });

    it('verify workspace identification in navigation', () => {
      createWorkspace('all').then(() => {
        cy.visit(`w/${workspaceId}/app/all_overview`);
        // expand the navigation menu
        cy.get('.navToggleInLargeScreen').should('exist').click();
        cy.get('.bottom-container').within(() => {
          cy.get('div[id="workspaceDropdownMenu"]').should('exist').click();
        });

        // expect workspace menu to be expanded with current workspace name displayed
        cy.get('.workspaceMenuHeader').within(() => {
          cy.contains(`${workspaceName}_all`).should('exist');
        });
      });
    });

    it('navigation search should only search use case related features when inside a workspace', () => {
      validateWorkspaceNavMenuSearch('visu', () => {
        cy.getElementByTestId('search-result-panel').within(() => {
          cy.contains(/Visualizations/).should('exist');
        });
      });
    });

    it('navigation search should show be able to search dev tools and open it as modal', () => {
      validateWorkspaceNavMenuSearch('dev', () => {
        cy.getElementByTestId('search-result-panel').within(() => {
          cy.contains(/Dev Tools/).should('exist');
          cy.contains(/Console/)
            .should('exist')
            .click();
          cy.document().then((doc) => {
            // click on the page to remove welcome message
            cy.wrap(doc.body).click('center');
            // expect dev tool popover to be opened
            cy.wrap(doc.body)
              .contains(/Dev Tools/)
              .should('exist');
          });
        });
      });
    });
  });
}

describe('Left navigation menu', () => {
  before(() => {
    if (isWorkspaceEnabled) {
      cy.deleteAllWorkspaces();
    }
  });

  afterEach(() => {
    if (isWorkspaceEnabled && workspaceId) {
      cy.deleteWorkspaceById(workspaceId);
    }
  });

  it('collapsible menu sections', () => {
    const validateMenuSection = () => {
      // expand the navigation menu
      cy.get('.navToggleInLargeScreen').should('exist').click();

      // menu section should be able to expand/collapse, with inside items display/hide corectly
      cy.contains(/Visualizations/).should('exist');

      // collapse the menu section and expect content to be hidden
      cy.contains(/Visualize and report/)
        .should('exist')
        .click();
      cy.contains(/Visualizations/).should('not.exist');

      // expand the menu section and expect content to be visible
      cy.contains(/Visualize and report/)
        .should('exist')
        .click();
      cy.contains(/Visualizations/).should('exist');
    };
    if (isWorkspaceEnabled) {
      createWorkspace('all').then(() => {
        cy.visit(`w/${workspaceId}/app/all_overview`);
        validateMenuSection();
      });
    } else {
      cy.visit('app/home');
      validateMenuSection();
    }
  });

  it('navigation should remember state of expand in browser', () => {
    const validateMenuState = () => {
      cy.get('.navToggleInLargeScreen').should('exist').click(); // expand the menu

      cy.reload();
      // navigation menu should remain expanded after reload
      cy.get('.left-navigation-wrapper').within(() => {
        isWorkspaceEnabled &&
          cy.contains(`${workspaceName}_all`).should('exist');
        cy.get('.navGroupEnabledHomeIcon').should('exist');
        cy.get('input[type="search"]').should('exist');
        cy.get('.bottom-container-expanded').should('exist');
        cy.getElementByTestId('collapsibleNavShrinkButton')
          .should('exist')
          .click(); // collapse the menu
      });

      cy.reload();
      // navigation menu should remain collapsed after reload
      cy.get('.left-navigation-wrapper').find('.euiPanel').should('not.exist');
      cy.get('.left-navigation-wrapper').within(() => {
        isWorkspaceEnabled &&
          cy.contains(`${workspaceName}_all`).should('not.exist');
        cy.get('.navGroupEnabledHomeIcon').should('not.exist');
        cy.get('input[type="search"]').should('not.exist');
        cy.get('.bottom-container-expanded').should('not.exist');
      });
    };

    if (isWorkspaceEnabled) {
      createWorkspace('all').then(() => {
        cy.visit(`w/${workspaceId}/app/all_overview`);
        validateMenuState();
      });
    } else {
      cy.visit('app/home');
      validateMenuState();
    }
  });

  it('validate navigation history functionality', () => {
    const validateRecentHistory = () => {
      // expand the navigation menu
      cy.get('.navToggleInLargeScreen').should('exist').click();
      cy.contains(/Visualizations/)
        .should('exist')
        .click();

      let visualizationName;
      cy.getElementByTestId('itemsInMemTable').within(() => {
        cy.get('.euiLink')
          .first()
          .invoke('text')
          .then((text) => {
            visualizationName = text;
            // Click to the first visualization item
            cy.contains(visualizationName).click();
          });
      });

      // wait for the page to be loaded
      cy.get('.visualize').should('exist');
      cy.get('.headerRecentItemsButton--loadingIndicator').should('not.exist');

      // open recent history dialog
      cy.get('.headerRecentItemsButton').should('exist').click();
      cy.get('div[role="dialog"]').within(() => {
        // dialog displays correct visited content
        cy.contains(/Recent assets/).should('exist');
        cy.contains(visualizationName).should('exist');
      });

      // back to dashboard
      cy.get('.left-navigation-wrapper').within(() => {
        cy.contains(/Dashboards/)
          .should('exist')
          .click({ force: true });
      });

      // wait for the page to be loaded
      cy.get('.application').should('exist');
      cy.get('.headerRecentItemsButton--loadingIndicator').should('not.exist');

      // open recent history dialog again
      cy.get('.headerRecentItemsButton').should('exist').click();
      cy.get('div[role="dialog"]').within(() => {
        // click recent visited visualization in the dialog
        cy.contains(visualizationName).should('exist').click({ force: true });
      });

      // should go back to the visualization screen just visited
      cy.getElementByTestId('headerAppActionMenu').within(() => {
        cy.url().should('contain', 'edit').should('contain', 'visualize');
        cy.contains(visualizationName).should('exist');
      });
    };

    if (isWorkspaceEnabled) {
      createWorkspace('all').then(() => {
        cy.loadSampleDataForWorkspace('ecommerce', workspaceId).then(() => {
          cy.visit(`w/${workspaceId}/app/all_overview`);
          validateRecentHistory();
        });
      });
    } else {
      cy.loadSampleData('logs').then(() => {
        cy.visit('app/home');
        validateRecentHistory();
      });
    }
  });
});
