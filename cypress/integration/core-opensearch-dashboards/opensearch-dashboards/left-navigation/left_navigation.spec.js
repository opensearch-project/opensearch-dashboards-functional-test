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

/**
 * Helper to ensure the left navigation panel is expanded.
 * Resets the persisted collapsed state in localStorage and,
 * if the nav is still collapsed after reload, clicks the
 * expand button to open it.
 */
const ensureNavExpanded = () => {
  // Force the persisted nav state to expanded
  cy.window().then((win) => {
    const key = 'core.chrome.isNavExpanded';
    if (win.localStorage.getItem(key) === 'false') {
      win.localStorage.setItem(key, 'true');
      cy.reload();
    }
  });

  cy.get('.left-navigation-wrapper').should('exist');

  // If the nav panel is still collapsed, click the expand button
  cy.get('body').then(($body) => {
    if ($body.find('.navToggleInLargeScreen').length > 0) {
      cy.get('.navToggleInLargeScreen')
        .should('be.visible')
        .click({ force: true });
    } else if (
      $body.find('[data-test-subj="collapsibleNavShrinkButton"]').length === 0
    ) {
      // Nav is collapsed (no shrink button visible means we're in collapsed view)
      // Look for any expand trigger in the collapsed nav
      if ($body.find('.bottom-container-collapsed').length > 0) {
        cy.get('.bottom-container-collapsed').click({ force: true });
      }
    }
  });

  // Verify the nav is actually expanded by checking for expanded content
  cy.get('.left-navigation-wrapper', { timeout: 60000 })
    .find('input[type="search"], .euiAccordion__button', { timeout: 60000 })
    .first()
    .should('exist');
};
if (isWorkspaceEnabled) {
  const validateWorkspaceNavMenu = (feature, callbackFn) => {
    createWorkspace(feature).then(() => {
      cy.visit(`w/${workspaceId}/app/discover`);
      cy.get('.content', { timeout: 60000 }).should('exist');

      ensureNavExpanded();

      cy.get('.left-navigation-wrapper').within(() => {
        cy.contains(`${workspaceName}_${feature}`).should('be.visible');
        cy.get('input[type="search"]').should('be.visible');
        // Scroll to make "Manage workspace" visible - it may be overflowed by other elements
        cy.contains(/Manage workspace/)
          .scrollIntoView({ offset: { top: -100, left: 0 } })
          .should('be.visible');

        callbackFn();
      });
    });
  };

  const validateWorkspaceNavMenuSearch = (input, callbackFn) => {
    createWorkspace('all').then(() => {
      cy.visit(`w/${workspaceId}/app/all_overview`);

      ensureNavExpanded();

      cy.getElementByTestId('global-search-input')
        .should('be.visible')
        .should('not.be.disabled')
        .click({ force: true });

      // Wait for search input to stabilize after click, then type
      cy.wait(500);
      cy.getElementByTestId('global-search-input').type(input, {
        force: true,
        delay: 50,
      });

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
      });
    });

    it('features are visible inside left navigation for security analytics use case', () => {
      validateWorkspaceNavMenu('security-analytics', () => {
        cy.contains(/Visualize and report/).should('exist');
        cy.contains(/Detect/).should('exist');
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

        ensureNavExpanded();

        cy.get('.left-navigation-wrapper').within(() => {
          cy.contains(`${workspaceName}_all`).should('be.visible');
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
          cy.contains(/Dev Tools/).should('be.visible');
          cy.contains(/Console/)
            .should('be.visible')
            .click({ force: true });

          cy.document().then((doc) => {
            cy.wrap(doc.body).click('center');
            cy.wrap(doc.body)
              .contains(/Dev Tools/)
              .should('be.visible');
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

  beforeEach(() => {
    // Reset persisted nav collapse state so tests start with nav expanded
    cy.window().then((win) => {
      win.localStorage.removeItem('core.chrome.isNavExpanded');
    });
  });

  afterEach(() => {
    if (isWorkspaceEnabled && workspaceId) {
      cy.deleteWorkspaceById(workspaceId);
    }
  });

  it('collapsible menu sections', () => {
    const validateMenuSection = () => {
      ensureNavExpanded();

      // Wait for nav content to fully render
      cy.get('.left-navigation-wrapper')
        .contains(/Visualize and report/i)
        .should('exist');

      // Scroll into view separately to avoid detached DOM issues
      cy.get('.left-navigation-wrapper')
        .contains(/Visualize and report/i)
        .scrollIntoView({ block: 'center', inline: 'center' });

      cy.get('.left-navigation-wrapper')
        .contains(/Visualize and report/i)
        .should('be.visible');

      cy.get('.left-navigation-wrapper')
        .contains('Visualizations')
        .should('be.visible');

      // Click the accordion toggle to collapse
      cy.get('.left-navigation-wrapper .euiAccordion__button')
        .contains(/Visualize and report/i)
        .click({ force: true });
      cy.get('.left-navigation-wrapper')
        .contains('Visualizations')
        .should('not.exist');

      // Click again to expand
      cy.get('.left-navigation-wrapper .euiAccordion__button')
        .contains('Visualize and report')
        .click();
      cy.get('.left-navigation-wrapper')
        .contains('Visualizations')
        .should('be.visible');
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
      ensureNavExpanded();

      cy.get('.left-navigation-wrapper').within(() => {
        isWorkspaceEnabled &&
          cy.contains(`${workspaceName}_all`).should('be.visible');
        cy.get('input[type="search"]').should('be.visible');
        cy.get('.bottom-container-expanded').should('be.visible');
        cy.getElementByTestId('collapsibleNavShrinkButton')
          .should('be.visible')
          .click({ force: true });
      });

      cy.reload();
      cy.get('.left-navigation-wrapper').find('.euiPanel').should('not.exist');
      cy.get('.left-navigation-wrapper').within(() => {
        isWorkspaceEnabled &&
          cy.contains(`${workspaceName}_all`).should('not.exist');
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
      ensureNavExpanded();

      // Ensure "Visualize and report" section is expanded to show "Visualizations"
      cy.get('.left-navigation-wrapper').then(($nav) => {
        if (
          $nav.find('a:contains("Visualizations")').length === 0 ||
          !$nav.find('a:contains("Visualizations")').is(':visible')
        ) {
          cy.contains(/Visualize and report/i).click({ force: true });
        }
      });

      cy.get('.left-navigation-wrapper')
        .contains(/Visualizations/)
        .should('be.visible')
        .click({ force: true });

      cy.getElementByTestId('itemsInMemTable')
        .find('.euiLink')
        .first()
        .invoke('text')
        .then((visualizationName) => {
          cy.getElementByTestId('itemsInMemTable')
            .contains(visualizationName)
            .click({ force: true });

          cy.get('.visualize', { timeout: 60000 }).should('exist');
          cy.get('.headerRecentItemsButton--loadingIndicator').should(
            'not.exist'
          );

          cy.get('.headerRecentItemsButton')
            .should('be.visible')
            .click({ force: true });

          cy.contains(/Recent assets/).should('be.visible');
          cy.contains(visualizationName).should('be.visible');

          cy.get('.left-navigation-wrapper').within(() => {
            cy.contains(/Dashboards/)
              .scrollIntoView()
              .click({ force: true });
          });

          cy.get('.application', { timeout: 60000 }).should('exist');
          cy.get('.headerRecentItemsButton--loadingIndicator').should(
            'not.exist'
          );

          cy.get('.headerRecentItemsButton')
            .should('be.visible')
            .click({ force: true });

          cy.contains(/Recent assets/).should('be.visible');
          cy.contains(visualizationName)
            .should('be.visible')
            .click({ force: true });

          cy.getElementByTestId('headerAppActionMenu').within(() => {
            cy.url().should('contain', 'edit').should('contain', 'visualize');
            cy.contains(visualizationName).should('be.visible');
          });
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
