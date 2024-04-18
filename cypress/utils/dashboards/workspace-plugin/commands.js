/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../base_constants';
import { WORKSPACE_API_PREFIX } from './constants';

Cypress.Commands.add('deleteWorkspace', (workspaceName) => {
    cy.request({
        method: 'POST',
        url: `${BASE_PATH}${WORKSPACE_API_PREFIX}/_list`,
        headers: {
            'osd-xsrf': true,
        },
        body: {}
    },).then(
        (resp) => {
            if (resp && resp.body && resp.body.success) {
                resp.body.result.workspaces.map(({ name, id }) => {
                    if (workspaceName === name) {
                        cy.request({
                            method: 'DELETE',
                            url: `${BASE_PATH}${WORKSPACE_API_PREFIX}/${id}`,
                            headers: {
                                'osd-xsrf': true,
                            },
                        });
                    }
                });
            }
        }
    );
});

Cypress.Commands.add('createWorkspace', (workspace) => {
    cy.request({
        method: 'POST',
        url: `${BASE_PATH}${WORKSPACE_API_PREFIX}`,
        headers: {
            'osd-xsrf': true,
        },
        body: {
            "attributes": {
                "name": workspace.name,
                "description": "test_description",
            }
        }
    },).then(
        (resp) => {
            if (resp && resp.body && resp.body.success) {
                workspace.id = resp.body.result.id;
            } else {
                throw new Error(`Create workspace ${workspace} failed!`);
            }
        }
    );
});

Cypress.Commands.add('checkWorkspace', (workspaceName, expected) => {
    cy.request({
        method: 'POST',
        url: `${BASE_PATH}${WORKSPACE_API_PREFIX}/_list`,
        headers: {
            'osd-xsrf': true,
        },
        body: {}
    },).then(
        (resp) => {
            if (resp && resp.body && resp.body.success) {
                let found = false;
                resp.body.result.workspaces.map(({ name, description, features, permissions }) => {
                    if (workspaceName === name) {
                        if (description !== expected.description) {
                            throw new Error(`workspace ${workspaceName} is not as expected, expected description is ${expected.description}, but is ${description}`);
                        } else {
                            const featuresSet = new Set(features);
                            expected.features.forEach((feature) => {
                                if (!featuresSet.has(feature)) {
                                    const expectedFeatures = JSON.stringify(expected.features);
                                    const actualFeatures = JSON.stringify(features);
                                    throw new Error(`workspace ${workspaceName} is not as expected, expected features are: ${expectedFeatures}, but are: ${actualFeatures}`);
                                }
                            });

                            if (permissions && expected.permissions) {
                                const expectedPermissions = JSON.stringify(expected.permissions);
                                const actualPermissions = JSON.stringify(permissions);
                                Object.entries(permissions).forEach(([key, value]) => {
                                    if (!expected.permissions.hasOwnProperty(key)) {
                                        throw new Error(`permissions for workspace ${workspaceName} is not as expected, expected are:  ${expectedPermissions}, but are ${actualPermissions}`);
                                    } else {
                                        const usersSet = new Set(value.users);
                                        expected.permissions[key].users?.forEach((principal) => {
                                            if (!usersSet.has(principal)) {
                                                throw new Error(`permissions for workspace ${workspaceName} is not as expected, expected are:  ${expectedPermissions}, but are ${actualPermissions}`);
                                            }
                                        });

                                        const groupsSet = new Set(value.groups);
                                        expected.permissions[key].groups?.forEach((principal) => {
                                            if (!groupsSet.has(principal)) {
                                                throw new Error(`permissions for workspace ${workspaceName} is not as expected, expected are:  ${expectedPermissions}, but are ${actualPermissions}`);
                                            }
                                        });
                                    }
                                });
                            }
                        }
                        found = true;
                    }
                });
                if (!found) {
                    throw new Error(`cannot find workspace ${workspaceName}`);
                }
            }
        }
    );
});

