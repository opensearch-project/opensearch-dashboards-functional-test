/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH, IM_API, BACKEND_BASE_PATH } from './constants';
import { devToolsRequest } from './helpers';

export const DisableLocalCluster = !!Cypress.env('DISABLE_LOCAL_CLUSTER'); // = hideLocalCluster

export const ADMIN_AUTH = {
  username: Cypress.env('username'),
  password: Cypress.env('password'),
  set newUser(changedUsername) {
    this.username = changedUsername;
  },
  set newPassword(changedPassword) {
    this.password = changedPassword;
  },
};

export const CURRENT_TENANT = {
  defaultTenant: 'private',
  set newTenant(changedTenant) {
    this.defaultTenant = changedTenant;
  },
};

// Overwrite default backend endpoint to customized one, remember set to original value after tests complete.
export const currentBackendEndpoint = (() => {
  let currentEndpoint = BACKEND_BASE_PATH;
  const DEFAULT_ENDPOINT = BACKEND_BASE_PATH;
  const REMOTE_NO_AUTH_ENDPOINT = Cypress.env('remoteDataSourceNoAuthUrl');

  return Object.freeze({
    DEFAULT: DEFAULT_ENDPOINT,
    REMOTE_NO_AUTH: REMOTE_NO_AUTH_ENDPOINT,
    /**
     * Change current backend endpoint
     * @param {*} changedEndPoint
     * @param {*} immediately set immediately false to change tenant after all pending promise be invoked,
     * useful for reset backend endpoint after all tests run.
     */
    set(changedEndPoint, immediately = true) {
      if (
        ![DEFAULT_ENDPOINT, REMOTE_NO_AUTH_ENDPOINT].includes(changedEndPoint)
      ) {
        throw new Error(`Invalid endpoint:${changedEndPoint}`);
      }
      const updateEndpoint = () => {
        currentEndpoint = changedEndPoint;
        cy.log(
          `Current backend endpoint has been changed to: ${currentEndpoint}`
        );
      };
      if (immediately) {
        updateEndpoint();
      } else {
        cy.wrap().then(updateEndpoint);
      }
    },
    get() {
      return currentEndpoint;
    },
  });
})();

export const supressNoRequestOccurred = () => {
  cy.on('fail', (err) => {
    if (err.message.includes('No request ever occurred.')) return false;
  });
};

// TODO: Add commands to ./index.d.ts for IDE discoverability

/**
 * This overwrites the default visit command to authenticate before visiting
 * webpages if SECURITY_ENABLED cypress env var is true
 */
Cypress.Commands.overwrite('visit', (orig, url, options) => {
  if (Cypress.env('SECURITY_ENABLED')) {
    let newOptions = options;
    let waitForGetTenant = options && options.waitForGetTenant;
    if (options) {
      newOptions['auth'] = ADMIN_AUTH;
    } else {
      newOptions = {
        auth: ADMIN_AUTH,
      };
    }
    newOptions.qs = { security_tenant: CURRENT_TENANT.defaultTenant };
    if (waitForGetTenant) {
      cy.intercept('GET', '/api/v1/multitenancy/tenant').as('getTenant');
      orig(url, newOptions);
      supressNoRequestOccurred();
      cy.wait('@getTenant');
    } else {
      orig(url, newOptions);
    }
  } else {
    orig(url, options);
  }
});

/**
 * Overwrite request command to support authentication similar to visit.
 * The request function parameters can be url, or (method, url), or (method, url, body).
 */
Cypress.Commands.overwrite('request', (originalFn, ...args) => {
  let defaults = {};
  if (Cypress.env('SECURITY_ENABLED')) {
    defaults.auth = ADMIN_AUTH;
  }

  let options = {};
  if (typeof args[0] === 'object' && args[0] !== null) {
    options = Object.assign({}, args[0]);
  } else if (args.length === 1) {
    [options.url] = args;
  } else if (args.length === 2) {
    [options.method, options.url] = args;
  } else if (args.length === 3) {
    [options.method, options.url, options.body] = args;
  }

  /**
   *
   * Overwrite opensearch backend endpoint to customized endpoint if data source management enabled and
   * request url start with default backend base path. It's useful for prepare testing data for other
   * data source.
   *
   */
  if (
    !!Cypress.env('DATASOURCE_MANAGEMENT_ENABLED') &&
    currentBackendEndpoint.get() !== currentBackendEndpoint.DEFAULT &&
    options.url &&
    options.url.startsWith(BACKEND_BASE_PATH)
  ) {
    options.url = options.url.replace(
      new RegExp(`^${BACKEND_BASE_PATH}`),
      currentBackendEndpoint.get()
    );
  }
  return originalFn(Object.assign({}, defaults, options));
});

Cypress.Commands.add('login', () => {
  // much faster than log in through UI
  cy.request({
    method: 'POST',
    url: `${BASE_PATH}/auth/login`,
    body: ADMIN_AUTH,
    headers: {
      'osd-xsrf': true,
    },
  });
});

// This function does not delete all indices
Cypress.Commands.add('deleteAllIndices', () => {
  cy.log('Deleting all indices');
  cy.request(
    'DELETE',
    `${Cypress.env(
      'openSearchUrl'
    )}/index*,sample*,opensearch_dashboards*,test*,cypress*`
  );
});

Cypress.Commands.add('deleteADSystemIndices', () => {
  cy.log('Deleting AD system indices');
  const url = `${Cypress.env(
    'openSearchUrl'
  )}/_plugins/_anomaly_detection/detectors/results`;
  cy.request({
    method: 'DELETE',
    url: url,
    failOnStatusCode: false,
    body: { query: { match_all: {} } },
  });

  cy.request({
    method: 'POST',
    url: `${Cypress.env(
      'openSearchUrl'
    )}/_plugins/_anomaly_detection/detectors/_search`,
    failOnStatusCode: false,
    body: { query: { match_all: {} } },
  }).then((response) => {
    if (response.status === 200) {
      for (let hit of response.body.hits.hits) {
        cy.request(
          'POST',
          `${Cypress.env(
            'openSearchUrl'
          )}/_plugins/_anomaly_detection/detectors/${hit._id}/_stop`
        ).then((response) => {
          if (response.status === 200) {
            cy.request(
              'DELETE',
              `${Cypress.env(
                'openSearchUrl'
              )}/_plugins/_anomaly_detection/detectors/${hit._id}`
            );
          }
        });
      }
    }
  });
});

Cypress.Commands.add('getIndexSettings', (index) => {
  cy.request('GET', `${Cypress.env('openSearchUrl')}/${index}/_settings`);
});

Cypress.Commands.add('updateIndexSettings', (index, settings) => {
  cy.request(
    'PUT',
    `${Cypress.env('openSearchUrl')}/${index}/_settings`,
    settings
  );
});

Cypress.Commands.add('createIndexTemplate', (name, template) => {
  cy.request(
    'PUT',
    `${Cypress.env('openSearchUrl')}${IM_API.INDEX_TEMPLATE_BASE}/${name}`,
    template
  );
});

Cypress.Commands.add('createTemplateComponent', (name, template) => {
  cy.request(
    'PUT',
    `${Cypress.env('openSearchUrl')}${
      IM_API.INDEX_TEMPLATE_COMPONENT_BASE
    }/${name}`,
    template
  );
});

Cypress.Commands.add('createDataStream', (name) => {
  cy.request(
    'PUT',
    `${Cypress.env('openSearchUrl')}${IM_API.DATA_STREAM_BASE}/${name}`
  );
});

Cypress.Commands.add('deleteDataStreams', (names) => {
  cy.request(
    'DELETE',
    `${Cypress.env('openSearchUrl')}${IM_API.DATA_STREAM_BASE}/${names}`
  );
});

Cypress.Commands.add('rollover', (target) => {
  cy.request('POST', `${Cypress.env('openSearchUrl')}/${target}/_rollover`);
});

// --- Typed commands --

Cypress.Commands.add('getElementByTestId', (testId, options = {}) => {
  return cy.get(`[data-test-subj="${testId}"]`, options);
});

Cypress.Commands.add('getElementsByTestIds', (testIds, options = {}) => {
  const selectors = [testIds]
    .flat(Infinity)
    .map((testId) => `[data-test-subj="${testId}"]`);
  return cy.get(selectors.join(','), options);
});

Cypress.Commands.add(
  'whenTestIdNotFound',
  (testIds, callbackFn, options = {}) => {
    const selectors = [testIds]
      .flat(Infinity)
      .map((testId) => `[data-test-subj="${testId}"]`);
    cy.get('body', options).then(($body) => {
      if ($body.find(selectors.join(',')).length === 0) callbackFn();
    });
  }
);

Cypress.Commands.add('createIndex', (index, policyID = null, settings = {}) => {
  cy.request('PUT', `${Cypress.env('openSearchUrl')}/${index}`, settings);
  if (policyID != null) {
    const body = { policy_id: policyID };

    cy.request(
      'POST',
      `${Cypress.env('openSearchUrl')}${IM_API.ADD_POLICY_BASE}/${index}`,
      body
    );
  }
});

Cypress.Commands.add('deleteIndex', (indexName, options = {}) => {
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('openSearchUrl')}/${indexName}`,
    failOnStatusCode: false,
    ...options,
  });
});

Cypress.Commands.add('getIndices', (index = null, settings = {}) => {
  cy.request({
    method: 'GET',
    url: `${Cypress.env('openSearchUrl')}/_cat/indices/${index ? index : ''}`,
    failOnStatusCode: false,
    ...settings,
  });
});

// TODO: Impliment chunking
Cypress.Commands.add('bulkUploadDocs', (fixturePath, index) => {
  const sendBulkAPIRequest = (ndjson) => {
    const url = index
      ? `${Cypress.env('openSearchUrl')}/${index}/_bulk`
      : `${Cypress.env('openSearchUrl')}/_bulk`;
    cy.log('bulkUploadDocs')
      .request({
        method: 'POST',
        url,
        headers: {
          'content-type': 'application/json;charset=UTF-8',
          'osd-xsrf': true,
        },
        body: ndjson,
      })
      .then((response) => {
        if (response.body.errors) {
          console.error(response.body.items);
          throw new Error('Bulk upload failed');
        }
      });
  };

  cy.fixture(fixturePath, 'utf8').then((ndjson) => {
    sendBulkAPIRequest(ndjson);
  });

  cy.request({
    method: 'POST',
    url: `${Cypress.env('openSearchUrl')}/_all/_refresh`,
  });
});

Cypress.Commands.add('importSavedObjects', (fixturePath, overwrite = true) => {
  const sendImportRequest = (ndjson) => {
    const url = `${Cypress.config().baseUrl}/api/saved_objects/_import?${
      overwrite ? `overwrite=true` : ''
    }`;

    const formData = new FormData();
    formData.append('file', ndjson, 'savedObject.ndjson');

    cy.log('importSavedObject')
      .request({
        method: 'POST',
        url,
        headers: {
          'content-type': 'multipart/form-data',
          'osd-xsrf': true,
        },
        body: formData,
      })
      .then((response) => {
        if (response.body.errors) {
          console.error(response.body.items);
          throw new Error('Import failed');
        }
      });
  };

  cy.fixture(fixturePath)
    .then((file) => Cypress.Blob.binaryStringToBlob(file))
    .then((ndjson) => {
      sendImportRequest(ndjson);
    });
});

Cypress.Commands.add('deleteSavedObject', (type, id, options = {}) => {
  const url = `${Cypress.config().baseUrl}/api/saved_objects/${type}/${id}`;

  return cy.request({
    method: 'DELETE',
    url,
    headers: {
      'osd-xsrf': true,
    },
    failOnStatusCode: false,
    ...options,
  });
});

Cypress.Commands.add('deleteSavedObjectByType', (type, search) => {
  const searchParams = new URLSearchParams({
    fields: 'id',
    type,
  });

  if (search) {
    searchParams.set('search', search);
  }

  const url = `${
    Cypress.config().baseUrl
  }/api/opensearch-dashboards/management/saved_objects/_find?${searchParams.toString()}`;

  return cy.request(url).then((response) => {
    console.log('response', response);
    response.body.saved_objects.map(({ type, id }) => {
      cy.deleteSavedObject(type, id);
    });
  });
});

Cypress.Commands.add('createIndexPattern', (id, attributes, header = {}) => {
  const url = `${
    Cypress.config().baseUrl
  }/api/saved_objects/index-pattern/${id}`;

  cy.request({
    method: 'POST',
    url,
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      'osd-xsrf': true,
      ...header,
    },
    body: JSON.stringify({
      attributes,
      references: [],
    }),
  });
});

Cypress.Commands.add('changeDefaultTenant', (attributes, header = {}) => {
  const url =
    Cypress.env('openSearchUrl') + '/_plugins/_security/api/tenancy/config';

  cy.request({
    method: 'PUT',
    url,
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      'osd-xsrf': true,
      ...header,
    },
    body: JSON.stringify(attributes),
  });
});

Cypress.Commands.add('deleteIndexPattern', (id, options = {}) =>
  cy.deleteSavedObject('index-pattern', id, options)
);

Cypress.Commands.add('setAdvancedSetting', (changes) => {
  const url = `${Cypress.config().baseUrl}/api/opensearch-dashboards/settings`;
  cy.log('setAdvancedSetting')
    .request({
      method: 'POST',
      url,
      qs: Cypress.env('SECURITY_ENABLED')
        ? {
            security_tenant: CURRENT_TENANT.defaultTenant,
          }
        : {},
      headers: {
        'content-type': 'application/json;charset=UTF-8',
        'osd-xsrf': true,
      },
      body: { changes },
    })
    .then((response) => {
      if (response.body.errors) {
        console.error(response.body.items);
        throw new Error('Setting advanced setting failed');
      }
    });
});

Cypress.Commands.add(
  'drag',
  { prevSubject: true },
  (source, targetSelector) => {
    const opts = { log: false };
    const dataTransfer = new DataTransfer();
    const DELAY = 5; // in ms
    const MAX_TRIES = 3;
    const initalRect = source.get(0).getBoundingClientRect();
    let target;
    let count = 0;
    let moved = false;

    const log = Cypress.log({
      name: 'Drag and Drop',
      displayName: 'drag',
      type: 'child',
      autoEnd: false,
      message: targetSelector,
    });

    const getHasMoved = () => {
      const currentRect = source.get(0).getBoundingClientRect();

      return !(
        initalRect.top === currentRect.top &&
        initalRect.left === currentRect.left
      );
    };

    const dragOver = () => {
      if (count < MAX_TRIES && !moved) {
        count += 1;
        return cy
          .wrap(target, opts)
          .trigger('dragover', {
            dataTransfer,
            eventConstructor: 'DragEvent',
            ...opts,
          })
          .wait(DELAY, opts)
          .then(() => {
            moved = getHasMoved();
            return dragOver();
          });
      } else {
        return true;
      }
    };

    cy.get(targetSelector, opts)
      .then((targetEle) => {
        target = targetEle;

        return target;
      })
      .then(() => {
        return cy.wrap(source, opts).trigger('dragstart', {
          dataTransfer,
          eventConstructor: 'DragEvent',
          ...opts,
        });
      })
      .then(() => dragOver())
      .then(() => {
        return cy.wrap(target, opts).trigger('drop', {
          dataTransfer,
          eventConstructor: 'DragEvent',
          ...opts,
        });
      })
      .then(() => {
        log.end();
      });
  }
);

// type: logs, ecommerce, flights
Cypress.Commands.add('loadSampleData', (type) => {
  cy.request({
    method: 'POST',
    headers: { 'osd-xsrf': 'opensearch-dashboards' },
    url: `${BASE_PATH}/api/sample_data/${type}`,
  });
});

Cypress.Commands.add('fleshTenantSettings', () => {
  if (Cypress.env('SECURITY_ENABLED')) {
    // Use xhr request is good enough to flesh tenant
    cy.request({
      url: `${BASE_PATH}/app/home?security_tenant=${CURRENT_TENANT.defaultTenant}`,
      method: 'GET',
      failOnStatusCode: false,
    });
  }
});

Cypress.Commands.add(
  'selectFromDataSourceSelector',
  (dataSourceTitle, dataSourceId) => {
    cy.getElementByTestId('dataSourceSelectorComboBox')
      .find(`button[data-test-subj="comboBoxClearButton"]`)
      .then((clearButton) => {
        if (clearButton.length > 0) {
          clearButton.click();
        }
      });
    cy.getElementByTestId('dataSourceSelectorComboBox')
      .find('input')
      .clear('{backspace}')
      .type(dataSourceTitle);
    cy.wait(1000);
    let dataSourceElement;
    if (dataSourceId) {
      dataSourceElement = cy.get(`#${dataSourceId}`);
    } else if (dataSourceTitle) {
      dataSourceElement = cy
        .get('.euiFilterSelectItem')
        .contains(dataSourceTitle)
        .closest('.euiFilterSelectItem');
    }
    dataSourceElement.click();
    // Close data source picker manually if no data source element need to be clicked
    if (!dataSourceElement) {
      cy.getElementByTestId('dataSourceSelectorComboBox')
        .last('button')
        .click();
    }
  }
);

Cypress.Commands.add('viewData', (sampleData) => {
  cy.get(`button[data-test-subj="launchSampleDataSet${sampleData}"]`)
    .should('be.visible')
    .click();
});

Cypress.Commands.add('addSampleDataToDataSource', (dataSourceTitle) => {
  cy.visit('app/home#/tutorial_directory');
  cy.selectFromDataSourceSelector(dataSourceTitle);
  cy.get('button[data-test-subj="addSampleDataSetecommerce"]')
    .should('be.visible')
    .click();
  cy.get(
    'div[data-test-subj="sampleDataSetCardecommerce"] > span > span[title="INSTALLED"]'
  ).should('have.text', 'INSTALLED');
  cy.get('button[data-test-subj="addSampleDataSetflights"]')
    .should('be.visible')
    .click();
  cy.get(
    'div[data-test-subj="sampleDataSetCardflights"] > span > span[title="INSTALLED"]'
  ).should('have.text', 'INSTALLED');
  cy.get('button[data-test-subj="addSampleDataSetlogs"]')
    .should('be.visible')
    .click();
  cy.get(
    'div[data-test-subj="sampleDataSetCardlogs"] > span > span[title="INSTALLED"]'
  ).should('have.text', 'INSTALLED');
});

Cypress.Commands.add('removeSampleDataFromDataSource', (dataSourceTitle) => {
  cy.visit('app/home#/tutorial_directory');
  cy.selectFromDataSourceSelector(dataSourceTitle);
  cy.get('button[data-test-subj="removeSampleDataSetecommerce"]')
    .should('be.visible')
    .click();
  cy.get('button[data-test-subj="removeSampleDataSetflights"]')
    .should('be.visible')
    .click();

  cy.get('button[data-test-subj="removeSampleDataSetlogs"]')
    .should('be.visible')
    .click();
});

Cypress.Commands.add('forceMerge', (indexes) => {
  devToolsRequest(`/${indexes}/_refresh`, 'POST');
});
