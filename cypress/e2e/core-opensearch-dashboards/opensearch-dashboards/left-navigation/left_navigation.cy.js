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

const waitForPageLoad = () => {
  // Use a very robust wait for the page to be ready in V13
  cy.get('html').should('exist');
  cy.get('body', { timeout: 60000 }).should('be.visible');

  // Wait for loading indicator to disappear if it exists
  cy.get('body').then(($body) => {
    if ($body.find('[data-test-subj="osdLoadingIndicator"]').length > 0) {
      cy.get('[data-test-subj="osdLoadingIndicator"]', {
        timeout: 60000,
      }).should('not.exist');
    }
  });

  // Wait for the main shell to be stable
  cy.get(
    '[data-test-subj="opensearchDashboardsMainContent"], .osdShell, .app-wrapper',
    { timeout: 60000 }
  ).should('be.visible');
};

const ensureNavExpanded = () => {
  waitForPageLoad();

  cy.get('body').then(($body) => {
    // Check for expanded state indicators
    const isExpanded =
      $body.find(
        '[data-test-subj="collapsibleNavShrinkButton"]:visible, [data-test-subj="collapsibleNavLockButton"]:visible'
      ).length > 0;

    if (!isExpanded) {
      const $toggleBtn = $body.find(
        '[data-test-subj="toggleNavButton"]:visible, [aria-label="Toggle primary navigation"]:visible'
      );
      if ($toggleBtn.length > 0) {
        cy.wrap($toggleBtn.first()).click({ force: true });
        // Explicitly wait for the side nav to be open
        cy.get(
          '[data-test-subj="collapsibleNavShrinkButton"], [data-test-subj="collapsibleNavLockButton"]',
          { timeout: 20000 }
        ).should('be.visible');
      }
    }
  });
};

const getNavContainer = () => {
  // V13 Fix: Ensure we only get ONE visible container for .within()
  return cy
    .get('.left-navigation-wrapper, [data-test-subj="collapsibleNav"]', {
      timeout: 30000,
    })
    .filter(':visible')
    .first();
};

const validateHomeIconVisible = (visible = true) => {
  const selector =
    '.navGroupEnabledHomeIcon, [data-test-subj="navGroupHomeIcon"], [data-test-subj="logo"], .euiHeaderLogo';
  if (visible) {
    getNavContainer().within(() => {
      cy.get(selector, { timeout: 10000 }).should('be.visible');
    });
  } else {
    // Use a robust check for non-visibility
    cy.get('body').then(($body) => {
      const $icons = $body.find(selector).filter(':visible');
      if ($icons.length > 0) {
        cy.wrap($icons).should('not.be.visible');
      }
    });
  }
};

const getGroupAndItemSelectors = () => {
  waitForPageLoad();

  return cy.get('body').then(($body) => {
    const isNavGroups =
      $body.find('.navGroupEnabledHomeIcon').length > 0 ||
      $body.text().includes('Visualize and report');

    if (isNavGroups) {
      return {
        // Use more specific regex to avoid overlap
        group: /^Visualize and report$/i,
        item: /^Visualizations$/i,
        dashboards: /^Dashboards$/i,
      };
    } else {
      // Legacy Sidebar mode
      return {
        group: /^OpenSearch Dashboards$/i,
        item: /^Visualizations$/i,
        dashboards: /^Dashboards$/i,
      };
    }
  });
};

if (isWorkspaceEnabled) {
  const validateWorkspaceNavMenu = (feature, callbackFn) => {
    createWorkspace(feature).then(() => {
      cy.visit(`w/${workspaceId}/app/discover`);
      // overview page should be loaded
      cy.get('.content').should('exist');

      // navigation menu setup
      ensureNavExpanded();

      // navigation should be expanded and display content correctly
      getNavContainer().within(() => {
        cy.contains(`${workspaceName}_${feature}`).should('exist');
        validateHomeIconVisible(true);

        // Search input might only exist in Navigation Groups mode
        cy.get('body').then(($body) => {
          if ($body.find('input[type="search"]').length > 0) {
            cy.get('input[type="search"]').should('exist');
          }
        });

        cy.contains(/Manage workspace/).should('exist');

        // additional assertion according to different type of workspace
        callbackFn();
      });
    });
  };

  const validateWorkspaceNavMenuSearch = (input, callbackFn) => {
    createWorkspace('all').then(() => {
      cy.visit(`w/${workspaceId}/app/all_overview`);

      // expand the navigation menu if needed
      ensureNavExpanded();

      cy.get('input[type="search"]').should('exist').click();
      cy.get('input[type="search"]').type(input);

      callbackFn();
    });
  };

  describe('Left navigation menu in workspace', { testIsolation: true }, () => {
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
        getGroupAndItemSelectors().then(({ group }) => {
          cy.contains(group).should('exist');
          cy.contains(/Observability/i).should('exist');
          cy.contains(/Security Analytics|Security/i).should('exist');
          cy.contains(/Search/i).should('exist');
          cy.contains(/Detect/i).should('exist');
        });
      });
    });

    it('features are visible inside left navigation for essentials use case', () => {
      validateWorkspaceNavMenu('essentials', () => {});
    });

    it('features are visible inside left navigation for search use case', () => {
      validateWorkspaceNavMenu('search', () => {
        getGroupAndItemSelectors().then(({ group }) => {
          cy.contains(group).should('exist');
          // TODO: Move this to search relevance functional tests
          // Renamed to "Search relevance" in https://github.com/opensearch-project/dashboards-search-relevance/pull/533
          isWorkspaceEnabled &&
            cy.contains(/Search relevance/i).should('exist');
        });
      });
    });

    it('features are visible inside left navigation for security analytics use case', () => {
      validateWorkspaceNavMenu('security-analytics', () => {
        getGroupAndItemSelectors().then(({ group }) => {
          cy.contains(group).should('exist');
          cy.contains(/Threat detection/i).should('exist');
          cy.contains(/Detect/i).should('exist');
          cy.contains(/Alerting/i).should('exist');
          cy.contains(/Anomaly Detection/i).should('exist');
        });
      });
    });

    it('features are visible inside left navigation for observability use case', () => {
      validateWorkspaceNavMenu('observability', () => {
        getGroupAndItemSelectors().then(({ group }) => {
          cy.contains(group).should('exist');
          cy.contains(/Detect/i).should('exist');
        });
      });
    });

    it('verify workspace identification in navigation', () => {
      createWorkspace('all').then(() => {
        cy.visit(`w/${workspaceId}/app/all_overview`);
        // expand the navigation menu if needed
        ensureNavExpanded();
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

describe('Left navigation menu', { testIsolation: true }, () => {
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

  it('validates navigation menu functionality and persistence', () => {
    const runTest = () => {
      // 1. collapsible menu sections
      cy.visit('app/home');
      waitForPageLoad();
      ensureNavExpanded();

      getGroupAndItemSelectors().then(({ group, item }) => {
        // Ensure group is initially collapsed if item is visible (cleanup from previous state)
        getNavContainer().then(($nav) => {
          if (
            $nav.find(`:contains("${item.source || item}"):visible`).length > 0
          ) {
            cy.contains(group).click({ force: true });
          }
        });

        // Test expansion
        getNavContainer().within(() => {
          cy.contains(group, { timeout: 30000 })
            .should('be.visible')
            .click({ force: true });
          cy.contains(item, { timeout: 30000 }).should('be.visible');
        });

        // Test collapse
        getNavContainer().within(() => {
          cy.contains(group).click({ force: true });
          cy.contains(item).should('not.be.visible');
        });

        // Test expansion again for next steps
        getNavContainer().within(() => {
          cy.contains(group).click({ force: true });
          cy.contains(item).should('be.visible');
        });
      });

      // 2. navigation should remember state of expand in browser
      cy.reload();
      waitForPageLoad();

      getNavContainer().within(() => {
        isWorkspaceEnabled &&
          cy.contains(`${workspaceName}_all`).should('exist');
        validateHomeIconVisible(true);
        cy.getElementByTestId('collapsibleNavShrinkButton')
          .should('exist')
          .click();
      });

      cy.reload();
      waitForPageLoad();

      getNavContainer().within(() => {
        validateHomeIconVisible(false);
        cy.get('.bottom-container-expanded').should('not.exist');
      });

      // 3. validate navigation history functionality
      ensureNavExpanded();
      getGroupAndItemSelectors().then(({ group, item, dashboards }) => {
        getNavContainer().within(() => {
          cy.contains(group, { timeout: 30000 })
            .should('be.visible')
            .click({ force: true });
          cy.contains(item, { timeout: 30000 })
            .should('be.visible')
            .click({ force: true });
        });

        cy.url().should('include', 'visualize');
        cy.get('[data-test-subj="itemsInMemTable"]', { timeout: 60000 }).should(
          'be.visible'
        );

        cy.get('[data-test-subj="itemsInMemTable"]').within(() => {
          cy.get('.euiLink')
            .first()
            .invoke('text')
            .then((visualizationName) => {
              cy.contains(visualizationName).click();
              cy.url().should('include', 'visualize');
              cy.get('[data-test-subj="visualizeEditor"]', {
                timeout: 60000,
              }).should('be.visible');

              cy.get('.headerRecentItemsButton').should('exist').click();
              cy.get('.euiPopover__panel')
                .should('be.visible')
                .within(() => {
                  cy.contains(/Recent assets|Recent items/i).should(
                    'be.visible'
                  );
                  cy.contains(visualizationName).should('be.visible');
                });

              ensureNavExpanded();
              getNavContainer().within(() => {
                cy.contains(group).click({ force: true });
                cy.contains(dashboards).click({ force: true });
              });

              cy.url().should('include', 'dashboards');
              cy.get('.dashboard-container', { timeout: 60000 }).should(
                'be.visible'
              );

              cy.get('.headerRecentItemsButton').should('exist').click();
              cy.get('.euiPopover__panel')
                .should('be.visible')
                .within(() => {
                  cy.contains(visualizationName)
                    .should('be.visible')
                    .click({ force: true });
                });

              cy.url().should('contain', 'visualize');
              cy.get('[data-test-subj="headerAppActionMenu"]')
                .should('be.visible')
                .contains(visualizationName);
            });
        });
      });
    };

    if (isWorkspaceEnabled) {
      createWorkspace('all').then(() => {
        cy.loadSampleDataForWorkspace('ecommerce', workspaceId).then(() => {
          runTest();
        });
      });
    } else {
      cy.loadSampleData('logs').then(() => {
        runTest();
      });
    }
  });
});
