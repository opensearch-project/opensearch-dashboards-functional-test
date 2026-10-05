# Setup Local FTR (Functional Test Runner) Environment

Help the user set up and run OSD Selenium-based functional tests locally against a running OpenSearch + OpenSearch Dashboards instance.

## Context

The OSD repo has two types of functional tests:
- **FTR tests** (Selenium/WebDriver) — in `test/functional/` in the OSD repo, run via `node scripts/functional_test_runner`
- **Cypress tests** — in the separate `opensearch-dashboards-functional-test` repo

This skill covers FTR tests only.

## Step 1: Verify prerequisites

Check that OpenSearch and OpenSearch Dashboards are running:

```bash
curl -s http://localhost:9200 | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'OpenSearch: {d[\"version\"][\"number\"]}')"
curl -s http://localhost:5601/api/status | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'OSD: {d[\"version\"][\"number\"]} - {d[\"status\"][\"overall\"][\"state\"]}')"
```

If not running, ask the user to start them first.

## Step 2: Install Chrome and matching ChromeDriver

FTR tests use Selenium WebDriver with Chrome. The bundled chromedriver in `node_modules/chromedriver` must match the installed Chrome version.

1. Check for existing Chrome:
```bash
google-chrome --version 2>/dev/null || chromium-browser --version 2>/dev/null || echo "No Chrome found"
```

2. If not installed, install Google Chrome stable:
```bash
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt-get update -qq && sudo apt-get install -y -qq google-chrome-stable
```

3. Check the bundled chromedriver version:
```bash
cd ~/OpenSearch-Dashboards && node -e "const cd = require('chromedriver'); console.log('chromedriver:', cd.version || 'unknown')"
```

4. If versions don't match (major version mismatch), download a matching chromedriver:
```bash
CHROME_VER=$(google-chrome --version | grep -oP '\d+\.\d+\.\d+\.\d+')
wget -q "https://storage.googleapis.com/chrome-for-testing-public/$CHROME_VER/linux64/chromedriver-linux64.zip" -O /tmp/chromedriver.zip
sudo apt-get install -y -qq unzip
unzip -o /tmp/chromedriver-linux64.zip -d /tmp/
cp /tmp/chromedriver-linux64/chromedriver ~/OpenSearch-Dashboards/node_modules/chromedriver/lib/chromedriver/chromedriver
chmod +x ~/OpenSearch-Dashboards/node_modules/chromedriver/lib/chromedriver/chromedriver
```

5. Verify match:
```bash
google-chrome --version
~/OpenSearch-Dashboards/node_modules/chromedriver/lib/chromedriver/chromedriver --version
```

## Step 3: Load test fixtures

FTR tests expect specific index data and saved objects. The visualize tests, for example, need logstash data indices and index pattern saved objects.

Fixtures live in `test/functional/fixtures/opensearch_archiver/`. Each subfolder has `data.json` (or `data.json.gz`) and optionally `mappings.json`.

To load fixtures via the saved objects API (when running against an already-started OSD):

```python
# Example: load index patterns from visualize/data.json
import json, requests
with open('test/functional/fixtures/opensearch_archiver/visualize/data.json') as f:
    content = f.read()
for block in content.split('\n\n'):
    block = block.strip()
    if not block: continue
    obj = json.loads(block)
    value = obj.get('value', {})
    src = value.get('source', {})
    idx = value.get('id', '')
    if not idx: continue
    obj_type = idx.split(':')[0] if ':' in idx else src.get('type','')
    obj_id = idx.split(':',1)[-1] if ':' in idx else idx
    attributes = src.get(obj_type, {})
    headers = {'osd-xsrf': 'true', 'Content-Type': 'application/json'}
    resp = requests.post(f'http://localhost:5601/api/saved_objects/{obj_type}/{obj_id}',
        json={'attributes': attributes}, headers=headers)
    print(f'{obj_type}/{obj_id}: {resp.status_code}')
```

For bulk data indices (like logstash-*), these are typically loaded separately via opensearch_archiver or already present from a previous test run.

## Step 4: Run a specific FTR test

The key environment variables:

| Variable | Purpose | Example |
|----------|---------|---------|
| `TEST_BROWSER_HEADLESS` | Run Chrome headless (no GUI) | `1` |
| `TEST_BROWSER_BINARY_PATH` | Path to Chrome binary | `$(which google-chrome)` |
| `TEST_OPENSEARCH_DASHBOARDS_HOST` | OSD hostname | `localhost` |
| `TEST_OPENSEARCH_DASHBOARDS_PORT` | OSD port | `5601` |
| `TEST_OPENSEARCH_PORT` | OpenSearch port | `9200` |

Run a specific test by grep pattern:

```bash
cd ~/OpenSearch-Dashboards && \
  TEST_BROWSER_HEADLESS=1 \
  TEST_BROWSER_BINARY_PATH=$(which google-chrome) \
  TEST_OPENSEARCH_DASHBOARDS_HOST=localhost \
  TEST_OPENSEARCH_DASHBOARDS_PORT=5601 \
  TEST_OPENSEARCH_PORT=9200 \
  node scripts/functional_test_runner \
    --config test/functional/config.js \
    --grep "test name pattern here" \
    --bail
```

- `--grep` filters by test name (mocha grep pattern)
- `--bail` stops on first failure
- `--config` points to the test config (usually `test/functional/config.js`)

## Step 5: Debugging failures

- **Screenshots**: saved to `test/functional/screenshots/failure/` on test failure
- **HTML snapshots**: saved to `test/functional/failure_debug/html/`
- **Browser logs**: printed inline with `ERROR browser[SEVERE]` prefix
- **Current URL**: printed on failure — decode the URL params to see filter/query state

### Common issues

1. **ChromeDriver version mismatch**: `remote failed to start within 2 minutes` — reinstall matching chromedriver (Step 2).

2. **Field ordering in fixtures**: The `comboBox.set()` helper matches dropdown options using CSS `[title^="value"]` (starts-with). If a field like `response.raw` appears before `response` in the field list, typing `response` selects `response.raw` instead. Fix: sort fields alphabetically in fixture files to match `_fields_for_wildcard` API order.

3. **Corrupt saved object migration error**: `Unable to migrate the corrupt Saved Object document` — the `type` field in the document source must match the type prefix in the document ID (e.g., `index-pattern:foo` must have `"type": "index-pattern"`).

4. **Fixture format**: Archiver `data.json` files contain multiple JSON objects separated by `\n\n` (blank lines). They are NOT single JSON documents. IDE JSON validation errors like "End of file expected" on the second object are expected and harmless.

## CI reference

The CI workflow uses `abhi1693/setup-browser@v0.3.5` with `browser: chrome`. CI groups are defined in `.github/workflows/build_and_test_workflow.yml`. The Vega chart tests (including filter extension tests) run in **ciGroup14**.
