/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

const webpack = require('@cypress/webpack-preprocessor');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

/**
 * Send an HTTP(S) request from Node.js (server-side).
 */
function nodeRequest(url, method, headers, body) {
  // eslint-disable-next-line no-undef
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === 'https:' ? https : http;
    const opts = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method,
      headers,
      rejectUnauthorized: false,
    };
    const req = mod.request(opts, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () =>
        resolve({
          status: res.statusCode,
          body: Buffer.concat(chunks).toString(),
        })
      );
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars
module.exports = (on, config) => {
  const options = {
    webpackOptions: {
      resolve: {
        extensions: ['.js', '.jsx', '.mjs', '.ts', '.tsx'],
      },
      module: {
        rules: [
          {
            test: /\.m?js$/,
            resolve: {
              fullySpecified: false,
            },
          },
        ],
      },
    },
  };
  on('file:preprocessor', webpack(options));

  on('task', {
    log(message) {
      console.log(message);
      return null;
    },

    /**
     * Import JSON mapping file server-side (for large fixture files).
     * Reads the file, parses index definitions, and creates them via PUT.
     */
    async importJSONMapping({ filename, openSearchUrl, auth }) {
      const filePath = path.resolve(filename);
      const str = fs.readFileSync(filePath, 'utf8');
      const headers = { 'Content-Type': 'application/json' };
      if (auth) {
        headers['Authorization'] =
          'Basic ' +
          Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
      }
      for (const element of str.split('\n\n')) {
        if (!element.trim()) continue;
        const json = JSON.parse(element);
        if (json.type === 'index') {
          const { index, settings, mappings, aliases } = json.value;
          const body = JSON.stringify({ settings, mappings, aliases });
          await nodeRequest(`${openSearchUrl}/${index}`, 'PUT', headers, body);
        }
      }
      return null;
    },

    /**
     * Import JSON doc file server-side using bulk API (for large fixture files).
     * Reads the file, builds bulk payloads, and sends them in chunks.
     */
    async importJSONDoc({ filename, openSearchUrl, auth, bulkMax }) {
      const max = bulkMax || 1600;
      const filePath = path.resolve(filename);
      const str = fs.readFileSync(filePath, 'utf8');
      const headers = { 'Content-Type': 'application/json' };
      if (auth) {
        headers['Authorization'] =
          'Basic ' +
          Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
      }

      const elements = str.split('\n\n').filter((e) => e.trim());
      let batch = [];
      for (let i = 0; i < elements.length; i++) {
        const {
          value: { id, index, source },
        } = JSON.parse(elements[i]);
        batch.push(JSON.stringify({ index: { _id: id, _index: index } }));
        batch.push(JSON.stringify(source));
        if (batch.length / 2 >= max) {
          await nodeRequest(
            `${openSearchUrl}/_bulk`,
            'POST',
            headers,
            batch.join('\n') + '\n'
          );
          batch = [];
        }
      }
      if (batch.length > 0) {
        await nodeRequest(
          `${openSearchUrl}/_bulk`,
          'POST',
          headers,
          batch.join('\n') + '\n'
        );
      }
      await nodeRequest(`${openSearchUrl}/_all/_refresh`, 'POST', headers, '');
      return null;
    },

    /**
     * Clear JSON mapping server-side (delete indices from a mapping file).
     */
    async clearJSONMapping({ filename, openSearchUrl, auth }) {
      const filePath = path.resolve(filename);
      const str = fs.readFileSync(filePath, 'utf8');
      const headers = { 'Content-Type': 'application/json' };
      if (auth) {
        headers['Authorization'] =
          'Basic ' +
          Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
      }
      for (const element of str.split('\n\n')) {
        if (!element.trim()) continue;
        const json = JSON.parse(element);
        if (json.type === 'index') {
          await nodeRequest(
            `${openSearchUrl}/${json.value.index}`,
            'DELETE',
            headers,
            ''
          );
        }
      }
      return null;
    },
  });

  return config;
};
