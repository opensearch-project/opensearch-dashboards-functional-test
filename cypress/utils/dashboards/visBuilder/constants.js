/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const VB_DEBOUNCE = 200; // Debounce time for VisBuilder fields in ms
export const VB_INDEX_ID = 'vis-builder'; // Test index for Vis Builder
export const VB_INDEX_PATTERN_ID = 'vis-builder-index-pattern'; // Test index pattern id for Vis Builder
export const VB_INDEX_PATTERN = VB_INDEX_ID; // Test index pattern label for Vis Builder

// Default ID's for the saved object fixture data
export const VB_DASHBOARD_ID = '7869d5d0-4ec1-11ed-840c-8d2a846d32d2';
export const VB_METRIC_EMBEDDABLE_ID = '2e23449f-fef6-4baf-8ee4-dcdd9799c74f';
export const VB_BAR_EMBEDDABLE_ID = '722e797d-59ea-4c86-8548-9fcb8e72da33';

export const toTestId = (str, replace = '-') => str.replace(/\s+/g, replace);
