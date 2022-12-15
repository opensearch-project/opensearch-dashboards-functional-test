/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const { program, InvalidArgumentError } = require('commander');
const { createWriteStream } = require('fs');
const { join } = require('path');
const { BasicDocumentGenerator } = require('./basic_generator');

const DEFAULT_PATH = './cypress/fixtures/dashboard/opensearch_dashboards/';
const DOCUMENT_GENERATORS = {
  basic: BasicDocumentGenerator,
};

const defaultGenerator = Object.keys(DOCUMENT_GENERATORS)[0];

program
  .argument('{index}', 'Index for the test data')
  .argument('[path]', 'path to the test data')
  .option(
    '-n, --doc-count [number]',
    'Number of documents to generate',
    toInt,
    '10000'
  )
  .option(
    '-g, --generator [string]',
    `Available Generators: ${Object.keys(DOCUMENT_GENERATORS).join(',')}`,
    defaultGenerator
  )
  .option(
    '-st, --start-time [date]',
    'Start time for generating docs',
    '2022-01-01T00:00:00.000'
  )
  .option(
    '-et, --end-time [date]',
    'Approximate end time for generating docs',
    '2022-10-01T00:00:00.000'
  )
  .action(
    async (
      indexName,
      path,
      { docCount: docCountText, startTime, endTime, generator: generatorType }
    ) => {
      const docCount = toInt(docCountText);

      // Get create doc function
      const generator = new DOCUMENT_GENERATORS[generatorType](
        startTime,
        endTime,
        docCount
      );

      // Create file
      const filePath = path || generator.fixturePath || DEFAULT_PATH;
      const writer = createWriteStream(join(filePath, `${indexName}.data.txt`));

      // Create documents
      Array.from({ length: docCount }).forEach((_, index) => {
        writer.write(
          JSON.stringify({ index: { _index: indexName, _id: index } }) + '\r\n'
        );
        writer.write(JSON.stringify(generator.createDoc(index)) + '\r\n');
      });
      // the finish event is emitted when all data has been flushed from the stream
      writer.on('finish', () => {
        console.log(`Created ${docCount} fake documents`);
      });
      // close the stream
      writer.end();
    }
  );

program.parse(process.argv);

function toInt(value) {
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) {
    throw new InvalidArgumentError('Not a number.');
  }
  return parsedValue;
}
