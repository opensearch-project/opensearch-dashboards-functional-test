/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// extract-zip <= 2.0.1 has no fix for CVE-2026-56876 / CVE-2026-19693.
// Cypress does `require('extract-zip')(zip, opts)`, but the replacement is
// ESM-only. Import it lazily so loading Cypress still works on Node < 22.12.
module.exports = (zipPath, opts) =>
  import('@electron-internal/extract-zip').then(({ extract }) =>
    extract(zipPath, opts)
  );
