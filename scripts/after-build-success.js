const fs = require('fs-extra');
const path = require('path');

const minimist = require('minimist');
const rimraf = require('rimraf');

const argv = minimist(process.argv.slice(2));

// Pass `--test-app-directory=my-dir` to change the testing application directory.
const TEST_APP_DIR = argv['test-app-directory'] || 'builders-test-app';
const TEST_DIST = '.skyux-sdk-angular-builders-dist';

function cleanDist() {
  rimraf.sync(path.join(TEST_APP_DIR, TEST_DIST));
}

function copyFilesToDist() {
  const pathsToCopy = [
    ['README.md'],
    ['CHANGELOG.md'],
    ['package.json'],
    ['builders.json'],
    ['collection.json']
    // ['src/schematics/ng-add/files']
  ];

  pathsToCopy.forEach((pathArr) => {
    const sourcePath = path.join(...pathArr);
    const distPath = path.join('dist', ...pathArr);
    if (fs.existsSync(sourcePath)) {
      fs.copySync(sourcePath, distPath);
      console.log(`Successfully copied ${sourcePath} to ${distPath}`);
    } else {
      throw `File not found: ${sourcePath}`;
    }
  });

  fs.copySync('dist', path.join(TEST_APP_DIR, TEST_DIST));
}

function mergeBuilderSchemas() {
  const schemaConfigs = [];

  schemaConfigs.forEach((config) => {
    const schemaJson = fs.readJsonSync(path.resolve(config.schemaPath));
    const baseSchemaJson = fs.readJsonSync(path.resolve(config.baseSchemaPath));

    const newJson = Object.assign({}, baseSchemaJson, schemaJson);
    newJson.properties = Object.assign(
      {},
      baseSchemaJson.properties,
      schemaJson.properties || {}
    );

    fs.writeJsonSync(config.schemaPath, newJson, {
      encoding: 'utf8',
      spaces: 2
    });

    console.log(`Successfully merged ${config.schemaPath}`);
  });
}

cleanDist();
copyFilesToDist();
mergeBuilderSchemas();
