/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../utils/constants';

const workspaceName = 'agentic-notebook-test';
let workspaceId = '';
const investigationQuestion = "what's the issue?";

// Selectors - centralized for maintainability
const SELECTORS = {
  questionTextarea:
    'textarea[placeholder="Describe the issue you want to investigate."]',
  hypothesisItem: '[data-test-subject="hypothesisItem"]',
  investigationMetadata: 'investigation-metadata',
  queryEditor: 'notebookQueryPanelEditor',
  flyoutClose: '[data-test-subj="euiFlyoutCloseButton"]',
  hypothesisDetail: 'div.hypothesisDetail',
  paragraphWrapper: 'div.notebookParagraphWrapper',
  dataDistributionCanvas: 'div.data-distribution-viz-canvas',
  dataDistributionExpand: 'div.notebookDataDistributionParaExpandButton',
  closeBadge: 'button[aria-label="close badge"]',
  thumbsUp: 'button[aria-label="thumbs up"]',
  thumbsDown: 'button[aria-label="thumbs down"]',
  addFindingInput: 'textarea[placeholder="Please add your finding here"]',
};

function waitForInvestigationCompletion(retries = 3, startTime = Date.now()) {
  const OVERALL_TIMEOUT = 180000; // 3 minutes

  if (retries === 0 || Date.now() - startTime > OVERALL_TIMEOUT) {
    throw new Error('Investigation failed after 3 retries or timeout exceeded');
  }

  cy.get('body', { timeout: 60000 }).then(($body) => {
    const bodyText = $body.text();
    if (bodyText.includes('Investigation completed')) {
      return;
    } else if (
      bodyText.includes('Investigation failed and showing previous hypotheses')
    ) {
      cy.contains('button', 'Reinvestigate').click();
      cy.contains('button', 'Confirm').click();
      waitForInvestigationCompletion(retries - 1, startTime);
    } else {
      cy.wait(5000);
      waitForInvestigationCompletion(retries, startTime);
    }
  });
}

function navigateToHypothesisDetail() {
  cy.get(SELECTORS.hypothesisItem).first().click();
  cy.url().should('contain', 'hypothesis');
  cy.get(SELECTORS.hypothesisDetail).should('exist');
}

function closeHypothesisDetail() {
  cy.get(SELECTORS.flyoutClose).click();
  cy.url().should('not.contain', 'hypothesis');
}

function notebooksTestCases() {
  describe('Agentic Notebook Investigation Tests', () => {
    before(() => {
      cy.visit(BASE_PATH);
      // Start dummy LLM server first
      cy.startInvestigationDummyServer();

      // Setup: provision agent
      cy.prepareInvestigationAgents();

      // Create workspace with sample data
      cy.deleteWorkspaceByName(workspaceName);
      cy.createWorkspace({
        name: workspaceName,
        description: 'Workspace for cypress testing',
        features: ['use-case-observability'],
      }).then((wsId) => {
        workspaceId = wsId;
        cy.loadSampleDataForWorkspace('ecommerce', workspaceId);
      });
    });

    after(() => {
      cy.cleanProvisionedInvestigationAgents();
      cy.deleteWorkspaceByName(workspaceName);
      cy.stopInvestigationDummyServer();
    });

    describe('Investigation from multiple log entries', () => {
      it('should trigger investigation from Start Investigation button', () => {
        cy.visit(`${BASE_PATH}/w/${workspaceId}/app/explore/logs`);

        cy.contains('Start Investigation').click();

        // Verify preset options
        cy.contains('button.euiButton', 'Root cause analytics').click();
        cy.get(SELECTORS.questionTextarea).should(
          'have.value',
          'Analyze anomaly and root cause in this dataset.'
        );

        cy.contains('button.euiButton', 'Performance issues').click();
        cy.get(SELECTORS.questionTextarea).should(
          'have.value',
          'Why these request take time?'
        );

        // Enter custom question and start
        cy.get(SELECTORS.questionTextarea).clear().type(investigationQuestion);
        cy.contains('button.euiButton', 'Start Investigation').click();

        cy.url().should('contain', 'app/investigation-notebooks#/agentic/');
      });

      it('should display investigation in progress state', () => {
        // Under investigation badge
        cy.contains('Under investigation').should('exist');
        cy.get(SELECTORS.closeBadge).click();
        cy.contains('Under investigation').should('not.exist');

        cy.contains('Discover investigation').should('exist');

        // Loading state
        cy.contains('button', 'Investigating')
          .should('be.disabled')
          .find('span.euiLoadingSpinner')
          .should('exist');
        cy.contains('Planning for your investigation...').should('exist');
        cy.contains('Gathering data in progress...').should('exist');

        // Summary section
        cy.getElementByTestId(SELECTORS.investigationMetadata).within(() => {
          cy.contains('Index').should('exist');
          cy.contains('opensearch_dashboards_sample_data_ecommerce').should(
            'exist'
          );
          cy.contains('Source: Discover').should('exist');
          cy.contains('Time field').should('exist');
          cy.contains('Initial goal').should('exist');
          cy.contains(investigationQuestion).should('exist');
          cy.contains('Query').should('exist');
          cy.contains('Time range').should('exist');
        });

        // Data distribution
        cy.contains('Data distribution analysis').should('exist');
        cy.get(SELECTORS.dataDistributionCanvas).should(
          'have.length.greaterThan',
          1
        );

        // Query panel
        cy.getElementByTestId(SELECTORS.queryEditor)
          .should('exist')
          .and('have.class', 'notebookQueryPanelEditor--disabled');
        cy.get('[id="queryDataGrid"]').should('exist');
        cy.get('[data-test-subj="queryOutputText"]').should('exist');

        cy.contains('Investigation Steps').should('exist');
      });

      it('should display investigation results after completion', () => {
        waitForInvestigationCompletion();
        cy.contains('Investigation completed', { timeout: 10000 }).should(
          'exist'
        );
        cy.contains('PRIMARY HYPOTHESIS').should('exist');

        // Feedback section
        cy.contains('How helpful were these hypotheses?').should('exist');
        cy.get(SELECTORS.thumbsUp).should('exist');
        cy.get(SELECTORS.thumbsDown).should('exist');

        // Hypothesis results
        cy.get(SELECTORS.hypothesisItem).should('have.length.at.least', 1);
      });

      it('should display investigation steps with trace', () => {
        cy.get('button[aria-controls="investigation-steps"]').click();
        cy.get('#investigation-steps')
          .should('exist')
          .within(() => {
            cy.contains('span', 'Explain this step').click();
          });

        // Step trace flyout
        cy.get('div[role="dialog"]')
          .should('exist')
          .within(() => {
            cy.contains('Step trace').should('exist');
            cy.getElementByTestId('euiFlyoutCloseButton').click();
          });
      });

      it('should display finding paragraph with metadata', () => {
        cy.get(SELECTORS.paragraphWrapper)
          .contains(/Importance/)
          .closest(SELECTORS.paragraphWrapper)
          .within(() => {
            cy.contains(/Updated .+ ago/).should('exist');
            cy.contains('AI Generated').should('exist');
            cy.contains(/Supports \d+ Hypothes[ie]s?/).should('exist');
            cy.contains(/% Importance/).should('exist');
          });
      });

      it('should navigate to hypothesis detail', () => {
        cy.get(SELECTORS.hypothesisItem)
          .first()
          .within(() => {
            cy.contains('PRIMARY HYPOTHESIS').should('exist');
            cy.contains(/\w+ evidence · \d+%/).should('exist');
            cy.get('div.euiTextColor--subdued').should(
              'contain.text',
              'Updated'
            );
          });

        navigateToHypothesisDetail();

        cy.get(SELECTORS.hypothesisDetail).within(() => {
          cy.contains(/Hypothesis: /).should('exist');
          cy.contains(/\w+ evidence · \d+%/).should('exist');
          cy.contains(/Active/).should('exist');
          cy.contains(/Primary hypothesis/).should('exist');
          cy.contains(/Supportive findings/).should('exist');
          cy.contains(/Summary/).should('exist');
        });

        closeHypothesisDetail();
      });

      it('should confirm and reject findings', () => {
        navigateToHypothesisDetail();

        cy.get(SELECTORS.hypothesisDetail)
          .find(SELECTORS.paragraphWrapper)
          .first()
          .within(() => {
            cy.contains('button', 'Confirm').should('exist');
            cy.contains('button', 'Reject').should('exist');
            cy.contains('span.euiBadge', 'Rejected').should('not.exist');
            cy.contains('span.euiBadge', 'Confirmed').should('not.exist');

            // Test confirm
            cy.contains('button', 'Confirm').click();
            cy.contains('span.euiBadge', 'Confirmed').should('exist');
            cy.contains('button', 'Reject').should('not.exist');
            cy.contains('button', 'Undo').click();
            cy.contains('button', 'Reject').should('exist');

            // Test reject
            cy.contains('button', 'Reject').click();
            cy.contains('span.euiBadge', 'Rejected').should('exist');
            cy.contains('button', 'Confirm').should('not.exist');
            cy.contains('button', 'Undo').click();
            cy.contains('button', 'Confirm').should('exist');
          });

        closeHypothesisDetail();
      });

      it('should mark findings as relevant or irrelevant', () => {
        navigateToHypothesisDetail();

        cy.get(SELECTORS.hypothesisDetail)
          .find(SELECTORS.paragraphWrapper)
          .first()
          .within(() => {
            cy.contains('Is this finding relevant?').should('exist');
            cy.get(SELECTORS.thumbsUp).should('exist');
            cy.get(SELECTORS.thumbsDown).should('exist');

            // Mark as relevant
            cy.get(SELECTORS.thumbsUp).click();
            cy.contains('Marked as relevant').should('exist');
            cy.get(SELECTORS.thumbsDown).should('not.exist');
            cy.contains('button', 'Undo').click();
            cy.get(SELECTORS.thumbsDown).should('exist');

            // Mark as irrelevant
            cy.get(SELECTORS.thumbsDown).click();
          });

        // Verify irrelevant findings section appears
        cy.get(SELECTORS.hypothesisDetail).within(() => {
          cy.contains('Irrelevant findings').should('exist');

          cy.get(SELECTORS.paragraphWrapper)
            .last()
            .within(() => {
              cy.contains('Marked as irrelevant').should('exist');
              cy.contains('button', 'Undo').click();
            });

          cy.contains('Irrelevant findings').should('not.exist');
        });

        closeHypothesisDetail();
      });

      it('should rule out a hypothesis', () => {
        let firstHypothesisTitle;

        cy.get(SELECTORS.hypothesisItem)
          .first()
          .find('strong.euiTitle--small')
          .invoke('text')
          .then((text) => {
            firstHypothesisTitle = text;
          });

        cy.get(SELECTORS.hypothesisItem)
          .first()
          .within(() => {
            cy.contains('button', 'Rule out').click();
          });

        cy.contains(/RULED OUT/).should('exist');

        cy.get(SELECTORS.hypothesisItem)
          .last()
          .within(() => {
            cy.contains(/RULED OUT/).should('exist');
          });

        // Verify new first hypothesis has different title
        cy.get(SELECTORS.hypothesisItem)
          .first()
          .within(() => {
            cy.get('strong.euiTitle--small')
              .invoke('text')
              .should((newTitle) => {
                expect(newTitle).to.not.equal(firstHypothesisTitle);
              });
            cy.contains(/Just promoted/).should('exist');
          });
      });

      it('should promote a hypothesis to primary', () => {
        let secondHypothesisTitle;

        cy.get(SELECTORS.hypothesisItem)
          .eq(1)
          .find('strong.euiTitle--small')
          .invoke('text')
          .then((text) => {
            secondHypothesisTitle = text;
          });

        cy.get(SELECTORS.hypothesisItem)
          .eq(1)
          .within(() => {
            cy.contains('button', 'Rule in').should('exist');
            cy.contains('button', 'Replace as primary').should('not.exist');
            cy.contains('button', 'Rule in').click();
            cy.contains('button', 'Replace as primary').should('exist');
            cy.contains('button', 'Replace as primary').click();
          });

        // Wait for hypotheses state update complete
        cy.wait(1000);

        // Verify second hypothesis is now first
        cy.get(SELECTORS.hypothesisItem)
          .first()
          .find('strong.euiTitle--small')
          .invoke('text')
          .should((newFirstTitle) => {
            expect(newFirstTitle).to.equal(secondHypothesisTitle);
          });
      });

      it('should interact with data distribution visualization', () => {
        cy.contains('Data distribution analysis').should('exist');

        // Expand modal
        cy.get(SELECTORS.dataDistributionExpand).click();
        cy.get('div.euiModal[style*="min-width: 1000px"]').should('exist');
        cy.get('button[aria-label="Closes this modal window"]').click();

        cy.get(SELECTORS.dataDistributionCanvas).should(
          'have.length.greaterThan',
          1
        );

        // Select from results
        cy.get('button[aria-label="Select from the results"]').first().click();
      });

      it('should be able to add user finding in agentic notebook', () => {
        cy.contains('button', 'Add Finding').click();

        cy.get(SELECTORS.addFindingInput).type('My custom finding');
        cy.get('div.euiModal').contains('button', 'Add').click();

        // wait until paragraph is created
        cy.contains(/User Finding/);

        // User finding inserted at the bottom
        cy.get(SELECTORS.paragraphWrapper)
          .last()
          .within(() => {
            cy.contains(/User Finding/);
            cy.contains(/My custom finding/);
            cy.contains(/Created a few seconds ago/);
          });
      });

      it('should reinvestigate with new question', () => {
        cy.contains('button', 'Reinvestigate').click();

        cy.get('div.euiModal').should('exist');
        cy.get('button.euiModal__closeIcon').should('exist');

        // Verify existing question
        cy.get('textarea.euiTextArea').should(
          'have.value',
          investigationQuestion
        );
        cy.contains('button', 'Confirm').should('not.be.disabled');

        // Validation
        cy.get('textarea.euiTextArea').clear();
        cy.contains('button', 'Confirm').should('be.disabled');

        // New question
        cy.get('textarea.euiTextArea').type('new investigation question');
        cy.contains('button', 'Confirm').should('not.be.disabled');

        // Options
        cy.get('div.euiDatePickerRange').should('exist');
        cy.get('div.euiSwitch').should('exist');
        cy.contains('Bring the existing hypotheses and findings').should(
          'exist'
        );

        // Confirm
        cy.contains('button', 'Confirm').click();
        cy.contains('Under investigation').should('exist');
      });
    });

    describe('Investigation from single log entry', () => {
      it('should trigger investigation from log action menu', () => {
        cy.visit(`${BASE_PATH}/w/${workspaceId}/app/explore/logs`);

        cy.getElementByTestId('logActionMenuButton')
          .first()
          .trigger('mouseover')
          .click();
        cy.contains('button.euiContextMenuItem', 'Investigate')
          .should('be.visible')
          .click();

        cy.get('code.euiCodeBlock__code.json').should('exist');
        cy.contains('button.euiButton', 'Root cause analytics').should('exist');
        cy.contains('button.euiButton', 'Performance issues').should('exist');

        cy.get(SELECTORS.questionTextarea)
          .should('be.visible')
          .type(investigationQuestion);
        cy.contains('button.euiButton', 'Start Investigation').click();

        cy.url().should('contain', 'app/investigation-notebooks#/agentic/');
      });

      it('should display single log investigation without pre-analysis', () => {
        cy.get('span.euiLoadingContent').should('exist');
        cy.contains('Discover investigation').should('exist');

        cy.contains('Selected log').should('exist');
        cy.get('code.euiCodeBlock__code.json').should('exist');

        // Pre-analysis should NOT be triggered for single log
        cy.contains('Log sequence analysis').should('not.exist');
        cy.contains('Data distribution analysis').should('not.exist');
      });
    });

    describe.skip('Investigation from visualization', () => {
      it('should trigger investigation from alert details', () => {
        // TODO: implement
      });
    });

    describe.skip('Investigation from chatbot', () => {
      it('should trigger investigation from alert details', () => {
        // TODO: implement
      });
    });
  });
}

notebooksTestCases();
