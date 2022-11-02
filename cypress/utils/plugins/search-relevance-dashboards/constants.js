/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const SEARCH_RELEVANCE_PLUGIN_NAME = 'searchRelevance';

export const SAMPLE_INDEX = 'opensearch_dashboards_sample_data_ecommerce';

export const SAMPLE_SEARCH_TEXT = 'basic';

export const SAMPLE_QUERY_TEXT = `{"query":{"match":{"products.product_name":"%SearchText%"}}}`;

export const NO_RESULTS = `0 results`;
