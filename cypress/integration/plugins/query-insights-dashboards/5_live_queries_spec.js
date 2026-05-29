/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

describe('Inflight Queries Dashboard', () => {
  beforeEach(() => {
    cy.fixture('stub_live_queries.json').then((stubResponse) => {
      cy.intercept('GET', '**/api/live_queries**', {
        statusCode: 200,
        body: stubResponse,
      }).as('getLiveQueries');
    });

    cy.navigateToLiveQueries();
    cy.wait(1000);
    // Force reload because testIsolation is disabled in this repo's cypress.config —
    // without it, cy.visit() to the same URL is a no-op and the intercepted request
    // never fires for subsequent tests.
    cy.reload();
    cy.wait('@getLiveQueries', { timeout: 60000 });
  });

  it('displays the correct page title', () => {
    cy.contains('Query insights - In-flight queries').should('be.visible');
  });

  it('displays metrics panels with active-only counts', () => {
    // Metrics should only count non-cancelled queries (7 out of 20)
    cy.get('[data-test-subj="panel-active-queries"]').within(() => {
      cy.contains('Active queries');
      cy.get('h2 > b').should('contain.text', '7');
    });

    cy.get('[data-test-subj="panel-avg-elapsed-time"]').within(() => {
      cy.contains('Avg. elapsed time');
      cy.contains('active queries');
    });

    cy.get('[data-test-subj="panel-longest-query"]').within(() => {
      cy.contains('Longest running query');
      cy.get('h2 > b').should('contain.text', '9.69 s');
    });

    cy.get('[data-test-subj="panel-total-cpu"]').within(() => {
      cy.contains('Total CPU usage');
      cy.contains('active queries');
    });

    cy.get('[data-test-subj="panel-total-memory"]').within(() => {
      cy.contains('Total memory usage');
      cy.contains('active queries');
    });
  });

  it('displays Active Queries by Node and Active Queries by Index charts', () => {
    cy.contains('Active Queries by Node').should('be.visible');
    cy.contains('Active Queries by Index').should('be.visible');
  });

  it('shows finished query stats panels', () => {
    cy.contains('Total completions').should('be.visible');
    cy.contains('Total cancellations').should('be.visible');
    cy.contains('Total failures').should('be.visible');
  });

  it('verifies table headers and row content in memory table', () => {
    const expectedHeaders = [
      '',
      'Timestamp',
      'Task ID',
      'Index',
      'Coordinator node',
      'Time elapsed',
      'CPU usage',
      'Memory usage',
      'Search type',
      'Status',
      'WLM Group',
      'Actions',
    ];

    cy.get('.euiTable thead tr th').should(($headers) => {
      const actualHeaders = [...$headers].map((el) => el.innerText.trim());
      expect(actualHeaders.length).to.eq(expectedHeaders.length);
      expectedHeaders.forEach((expected, index) => {
        expect(actualHeaders[index]).to.eq(expected);
      });
    });
  });

  it('shows status as badges for running and cancelled queries', () => {
    // Running queries should have a primary badge
    cy.get('.euiBadge').contains('Running').should('be.visible');
    // Cancelled queries should have a danger badge
    cy.get('.euiBadge').contains('Cancelled').should('be.visible');
  });

  it('Task ID is a clickable link', () => {
    cy.fixture('stub_live_queries.json').then((data) => {
      const firstId = data.response.live_queries[0].id;
      cy.get('.euiLink').contains(firstId).should('be.visible');
    });
  });

  it('longest running query ID is a clickable link', () => {
    cy.get('[data-test-subj="panel-longest-query"]').within(() => {
      cy.get('.euiLink').should('be.visible');
    });
  });

  it('navigates to next page in table pagination', () => {
    cy.wait('@getLiveQueries');
    cy.get('.euiPagination').should('be.visible');
    cy.get('.euiPagination__item').contains('2').click();
    cy.get('tbody tr').should('exist');
  });

  it('selects all checkboxes and shows bulk cancel text', () => {
    // Hide finished queries first so the table only contains rows with checkboxes.
    // Under testIsolation:false this repo's test ordering puts cancelled rows on
    // page 1, breaking the assertion that some rows became `:checked`.
    cy.get('[data-test-subj="live-queries-show-finished-toggle"]').then(
      ($t) => {
        if ($t.attr('aria-checked') === 'true') {
          cy.wrap($t).click({ force: true });
        }
      }
    );
    cy.get('.euiTable thead tr th input[type="checkbox"]').check({
      force: true,
    });
    cy.get('.euiTable tbody tr input[type="checkbox"]:checked').then(
      ($rows) => {
        const selectedCount = $rows.length;
        const expectedText = `Cancel ${selectedCount} queries`;

        cy.contains(expectedText).should('be.visible');
      }
    );
  });

  it('show finished queries toggle is enabled by default', () => {
    cy.get('[data-test-subj="live-queries-show-finished-toggle"]').should(
      'have.attr',
      'aria-checked',
      'true'
    );
  });

  it('disables auto-refresh when toggled off', () => {
    cy.get('[data-test-subj="live-queries-autorefresh-toggle"]').as('toggle');
    cy.get('[data-test-subj="live-queries-refresh-interval"]').as('dropdown');

    cy.get('@toggle').click();
    cy.get('@toggle').should('have.attr', 'aria-checked', 'false');
    cy.get('@dropdown').should('be.disabled');
  });

  it('has expected refresh interval options', () => {
    cy.get('[data-test-subj="live-queries-refresh-interval"] option').should(
      ($options) => {
        const values = [...$options].map((opt) => opt.innerText.trim());
        expect(values).to.include.members([
          '5 seconds',
          '10 seconds',
          '30 seconds',
          '1 minute',
        ]);
      }
    );
  });

  it('manually refreshes data', () => {
    cy.get('[data-test-subj="live-queries-refresh-button"]').click();
    cy.wait('@getLiveQueries');
  });

  it('updates data periodically', () => {
    cy.fixture('stub_live_queries.json').then((initialData) => {
      let callCount = 0;
      cy.intercept('GET', '**/api/live_queries**', (req) => {
        callCount++;
        const modifiedData = {
          ...initialData,
          response: {
            ...initialData.response,
            live_queries: initialData.response.live_queries.map((query) => ({
              ...query,
              id: `query${callCount}_${query.id}`,
            })),
          },
        };
        req.reply(modifiedData);
      }).as('getPeriodicQueries');
    });

    cy.navigateToLiveQueries();

    cy.wait('@getPeriodicQueries');
    cy.wait('@getPeriodicQueries');
    cy.wait('@getPeriodicQueries');

    cy.get('@getPeriodicQueries.all').should('have.length.at.least', 3);
  });

  it('handles empty response state', () => {
    cy.intercept('GET', '**/api/live_queries**', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          ok: true,
          response: {
            live_queries: [],
          },
        },
      });
    }).as('getEmptyQueries');

    cy.navigateToLiveQueries();
    cy.wait('@getEmptyQueries');
    cy.get('[data-test-subj="panel-active-queries"]').within(() => {
      cy.contains('Active queries');
      cy.get('h2 > b').should('contain.text', '0');
    });

    cy.contains('p', 'Active Queries by Node')
      .closest('.euiPanel')
      .within(() => {
        cy.contains('No Visualization Available').should('be.visible');
      });

    cy.contains('p', 'Active Queries by Index')
      .closest('.euiPanel')
      .within(() => {
        cy.contains('No Visualization Available').should('be.visible');
      });
  });

  it('does not show cancel action for already cancelled queries', () => {
    cy.fixture('stub_live_queries.json').then((data) => {
      cy.intercept('GET', '**/api/live_queries**', {
        statusCode: 200,
        body: data,
      }).as('getCancelledQuery');

      cy.navigateToLiveQueries();
      cy.wait('@getCancelledQuery');

      cy.contains(data.response.live_queries[0].id)
        .parents('tr')
        .within(() => {
          cy.get('[aria-label="Cancel this query"]').should('not.exist');
        });

      cy.contains(data.response.live_queries[0].id)
        .parents('tr')
        .find('input[type="checkbox"]')
        .should('be.disabled');
    });
  });

  it('filters table using the dynamic search bar', () => {
    cy.get('[aria-label="Dynamic search bar"]').type('opensearch');
    cy.get('tbody tr').should('have.length', 1);
    cy.get('tbody tr')
      .first()
      .within(() => {
        cy.contains('td', 'opensearch');
      });
  });

  it('filters table by task ID using structured expression', () => {
    cy.fixture('stub_live_queries.json').then((data) => {
      const firstRunningQuery = data.response.live_queries.find(
        (q) => !q.is_cancelled
      );
      cy.get('[aria-label="Dynamic search bar"]')
        .clear()
        .type(`id = ${firstRunningQuery.id}`);
      cy.get('tbody tr').should('have.length', 1);
      cy.get('tbody tr').first().contains(firstRunningQuery.id);
    });
  });

  it('renders the search bar with correct placeholder', () => {
    cy.get(
      'input[placeholder="e.g. latency >= 1 AND status = Running"]'
    ).should('be.visible');
  });

  it('shows field suggestions when search bar is focused', () => {
    cy.get('[aria-label="Dynamic search bar"]').click();
    cy.get('[role="option"]').should('have.length.greaterThan', 0);
    cy.get('[role="option"]').first().should('contain.text', 'id');
  });

  it('shows operator suggestions after typing a field name and space', () => {
    cy.get('[aria-label="Dynamic search bar"]').clear().type('latency ');
    cy.get('[role="option"]').should('have.length.greaterThan', 0);
    cy.get('[role="option"]').should('contain.text', '=');
    cy.get('[role="option"]').should('contain.text', '>=');
    cy.get('[role="option"]').should('contain.text', 'between');
  });

  it('shows string operators for string fields', () => {
    cy.get('[aria-label="Dynamic search bar"]').clear().type('search_type ');
    cy.get('[role="option"]').should('contain.text', '=');
    cy.get('[role="option"]').should('contain.text', 'starts_with');
    cy.get('[role="option"]').should('contain.text', 'contains');
  });

  it('shows value suggestions after typing field and operator', () => {
    cy.get('[aria-label="Dynamic search bar"]').clear().type('search_type = ');
    cy.get('[role="option"]').should('have.length.greaterThan', 0);
  });

  it('shows conjunction suggestions after a complete condition', () => {
    cy.get('[aria-label="Dynamic search bar"]').clear().type('id = somevalue ');
    cy.get('[role="option"]').should('contain.text', 'AND');
    cy.get('[role="option"]').should('contain.text', 'OR');
  });

  it('shows filter badges for active conditions', () => {
    cy.get('[aria-label="Dynamic search bar"]')
      .clear()
      .type('status = Running ');
    cy.get('.euiBadge').contains('status').should('exist');
  });

  it('removes filter when badge X is clicked', () => {
    cy.get('[aria-label="Dynamic search bar"]')
      .clear()
      .type('status = Running ');
    cy.get('.euiBadge')
      .contains('status')
      .closest('.euiBadge')
      .find('button, [role="img"], svg')
      .last()
      .click({ force: true });
    cy.get('[aria-label="Dynamic search bar"]').should('have.value', '');
  });

  it('auto-formats between expression with parentheses', () => {
    cy.get('[aria-label="Dynamic search bar"]')
      .clear()
      .type('latency between 1 10 ');
    cy.get('[aria-label="Dynamic search bar"]').should(
      'have.value',
      'latency between (1, 10) '
    );
  });

  it('shows no items when filter matches nothing', () => {
    cy.get('[aria-label="Dynamic search bar"]')
      .clear()
      .type('id = nonexistent_xyz_123');
    cy.contains('No items found').should('be.visible');
  });

  it('displays WLM group as text when WLM is disabled', () => {
    cy.get('tbody tr')
      .first()
      .within(() => {
        cy.get('td')
          .contains('ANALYTICS_WORKLOAD_GROUP')
          .should('not.have.attr', 'href');
      });
  });
});

describe('Task Detail Flyout', () => {
  it('opens flyout when clicking a running task ID', () => {
    const mockData = {
      ok: true,
      response: {
        live_queries: [
          {
            id: 'nodeA:1001',
            timestamp: Date.now(),
            node_id: 'nodeA',
            description:
              'indices[my-index] search_type[query_then_fetch] source[{"query":{"match_all":{}}}]',
            measurements: {
              latency: { number: 5e9 },
              cpu: { number: 1e6 },
              memory: { number: 4096 },
            },
            is_cancelled: false,
            coordinator_task: {
              task_id: 'nodeA:1001',
              node_id: 'nodeA',
              action: 'indices:data/read/search',
              status: 'running',
              description:
                'indices[my-index] search_type[query_then_fetch] source[{"query":{"match_all":{}}}]',
              start_time: Date.now(),
              running_time_nanos: 5e9,
              cpu_nanos: 1e6,
              memory_bytes: 4096,
            },
            shard_tasks: [
              {
                task_id: 'nodeB:2001',
                node_id: 'nodeB',
                action: 'indices:data/read/search[phase/query]',
                status: 'running',
                description: 'shardId[[my-index][0]]',
                start_time: Date.now(),
                running_time_nanos: 4e9,
                cpu_nanos: 800000,
                memory_bytes: 2048,
              },
            ],
          },
        ],
      },
    };

    cy.intercept('GET', '**/api/live_queries**', {
      statusCode: 200,
      body: mockData,
    }).as('getLiveQueries');

    cy.navigateToLiveQueries();
    // Force reload because testIsolation is disabled in this repo's cypress.config.
    cy.reload();
    cy.wait('@getLiveQueries', { timeout: 60000 });

    // Click the task ID link
    cy.get('.euiLink').contains('nodeA:1001').click();

    // Flyout should open
    cy.get('.euiFlyout').should('be.visible');
    cy.contains('Task ID - nodeA:1001').should('be.visible');

    // Task Summary panel
    cy.get('.euiFlyout').within(() => {
      cy.contains('Task Summary').should('exist');
      cy.get('.euiBadge').contains('running').should('exist');

      // Running task should show Refresh and Kill Query
      cy.contains('Refresh').should('exist');
      cy.contains('Kill Query').should('exist');

      // Task Resource Usage
      cy.contains('Task Resource Usage').should('exist');
      cy.contains('Coordinator Task').should('exist');
      cy.contains('Shard Tasks').should('exist');

      // Shard ID should be parsed
      cy.contains('my-index[0]').should('exist');

      // Phase should be parsed
      cy.contains('Query').should('exist');

      // Query Source
      cy.contains('Query Source').scrollIntoView().should('exist');
      cy.contains('match_all').should('exist');
    });
  });

  it('shows View Top N and hides Refresh/Kill for completed tasks', () => {
    const mockData = {
      ok: true,
      response: {
        live_queries: [],
        finished_queries: [
          {
            id: 'nodeA:2001',
            timestamp: Date.now() - 5000,
            node_id: 'nodeA',
            status: 'completed',
            indices: ['test-idx'],
            search_type: 'query_then_fetch',
            measurements: {
              latency: { number: 2e9 },
              cpu: { number: 5e6 },
              memory: { number: 8192 },
            },
            task_resource_usages: [
              {
                taskId: 100,
                nodeId: 'nodeA',
                parentTaskId: -1,
                action: 'indices:data/read/search',
                taskResourceUsage: {
                  cpu_time_in_nanos: 5e6,
                  memory_in_bytes: 4096,
                },
              },
              {
                taskId: 101,
                nodeId: 'nodeA',
                parentTaskId: 100,
                action: 'indices:data/read/search[phase/query]',
                taskResourceUsage: {
                  cpu_time_in_nanos: 3e6,
                  memory_in_bytes: 2048,
                },
              },
            ],
            top_n_id: 'topn-abc-123',
            source: '{"query":{"match_all":{}}}',
          },
        ],
      },
    };

    cy.intercept('GET', '**/api/live_queries**', {
      statusCode: 200,
      body: mockData,
    }).as('getLiveQueries');

    cy.navigateToLiveQueries();
    // Force reload because testIsolation is disabled in this repo's cypress.config.
    cy.reload();
    cy.wait('@getLiveQueries', { timeout: 60000 });

    // Click the finished task ID
    cy.get('.euiLink').contains('nodeA:2001').click();

    // Flyout should open
    cy.get('.euiFlyout').should('be.visible');
    cy.contains('Task ID - nodeA:2001').should('be.visible');

    // Completed task should show View Top N
    cy.get('.euiFlyout').within(() => {
      cy.contains('View Top N').should('exist');

      // Should NOT show Kill Query
      cy.contains('Kill Query').should('not.exist');

      // Status badge should be green (completed)
      cy.get('.euiBadge').contains('completed').should('exist');

      // Task Resource Usage with old format
      cy.contains('Task Resource Usage').should('exist');
      cy.contains('Coordinator Task').should('exist');

      // Query Source
      cy.contains('Query Source').scrollIntoView().should('exist');
    });
  });

  it('shows View Top N for cancelled tasks', () => {
    const mockData = {
      ok: true,
      response: {
        live_queries: [
          {
            id: 'nodeA:3001',
            timestamp: Date.now(),
            node_id: 'nodeA',
            description: 'indices[idx] search_type[query_then_fetch]',
            measurements: {
              latency: { number: 3e9 },
              cpu: { number: 2e6 },
              memory: { number: 2048 },
            },
            is_cancelled: true,
            coordinator_task: {
              task_id: 'nodeA:3001',
              node_id: 'nodeA',
              action: 'indices:data/read/search',
              status: 'cancelled',
              description: 'indices[idx] search_type[query_then_fetch]',
              start_time: Date.now(),
              running_time_nanos: 3e9,
              cpu_nanos: 2e6,
              memory_bytes: 2048,
            },
            shard_tasks: [],
          },
        ],
      },
    };

    cy.intercept('GET', '**/api/live_queries**', {
      statusCode: 200,
      body: mockData,
    }).as('getLiveQueries');

    cy.navigateToLiveQueries();
    // Force reload because testIsolation is disabled in this repo's cypress.config.
    cy.reload();
    cy.wait('@getLiveQueries', { timeout: 60000 });

    cy.get('.euiLink').contains('nodeA:3001').click();

    cy.get('.euiFlyout').should('be.visible');
    cy.contains('Task ID - nodeA:3001').should('be.visible');

    // Cancelled task should show View Top N
    cy.contains('View Top N').should('be.visible');

    // Should NOT show Kill Query
    cy.get('.euiFlyout').within(() => {
      cy.contains('Kill Query').should('not.exist');
    });

    // Status badge should be danger (cancelled)
    cy.get('.euiBadge').contains('cancelled').should('be.visible');
  });

  it('closes flyout when close button is clicked', () => {
    const mockData = {
      ok: true,
      response: {
        live_queries: [
          {
            id: 'nodeA:4001',
            timestamp: Date.now(),
            node_id: 'nodeA',
            description: 'indices[idx] search_type[query_then_fetch]',
            measurements: {
              latency: { number: 1e9 },
              cpu: { number: 0 },
              memory: { number: 0 },
            },
            is_cancelled: false,
          },
        ],
      },
    };

    cy.intercept('GET', '**/api/live_queries**', {
      statusCode: 200,
      body: mockData,
    }).as('getLiveQueries');

    cy.navigateToLiveQueries();
    // Force reload because testIsolation is disabled in this repo's cypress.config.
    cy.reload();
    cy.wait('@getLiveQueries', { timeout: 60000 });

    cy.get('.euiLink').contains('nodeA:4001').click();
    cy.get('.euiFlyout').should('be.visible');

    // Close the flyout
    cy.get('.euiFlyout [aria-label="Close this dialog"]').click();
    cy.get('.euiFlyout').should('not.exist');
  });

  it('does not show cancel action for finished queries in table', () => {
    const mockData = {
      ok: true,
      response: {
        live_queries: [],
        finished_queries: [
          {
            id: 'nodeA:5001',
            timestamp: Date.now() - 1000,
            node_id: 'nodeA',
            status: 'completed',
            indices: ['idx'],
            search_type: 'query_then_fetch',
            measurements: {
              latency: { number: 1e9 },
              cpu: { number: 0 },
              memory: { number: 0 },
            },
            task_resource_usages: [],
          },
        ],
      },
    };

    cy.intercept('GET', '**/api/live_queries**', {
      statusCode: 200,
      body: mockData,
    }).as('getLiveQueries');

    cy.navigateToLiveQueries();
    // Force reload because testIsolation is disabled in this repo's cypress.config.
    cy.reload();
    cy.wait('@getLiveQueries', { timeout: 60000 });

    // Finished query should show completed badge
    cy.get('.euiBadge').contains('completed').should('exist');

    // No cancel action for finished queries
    cy.contains('nodeA:5001')
      .parents('tr')
      .within(() => {
        cy.get('[aria-label="Cancel this query"]').should('not.exist');
      });

    // Checkbox should be disabled for finished queries
    cy.contains('nodeA:5001')
      .parents('tr')
      .find('input[type="checkbox"]')
      .should('be.disabled');
  });
});
