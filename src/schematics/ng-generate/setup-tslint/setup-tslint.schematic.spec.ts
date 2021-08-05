import {
  SchematicTestRunner,
  UnitTestTree
} from '@angular-devkit/schematics/testing';

import path from 'path';

import { createTestApp, createTestLibrary } from '../../testing/scaffold';

describe('Setup protractor schematic', () => {
  const collectionPath = path.join(__dirname, '../../../../collection.json');
  const defaultProjectName = 'foo-app';
  const schematicName = 'setup-tslint';

  const runner = new SchematicTestRunner('generate', collectionPath);

  let tree: UnitTestTree;

  beforeEach(async () => {
    tree = await createTestApp(runner, {
      defaultProjectName
    });
  });

  function runSchematic(projectName?: string): Promise<UnitTestTree> {
    return runner
      .runSchematicAsync(
        schematicName,
        {
          project: projectName || defaultProjectName
        },
        tree
      )
      .toPromise();
  }

  it('should add dev dependencies', async () => {
    const updatedTree = await runSchematic();

    const packageJson = JSON.parse(updatedTree.readContent('package.json'));
    expect(packageJson.devDependencies).toEqual(
      jasmine.objectContaining({
        codelyzer: '^6.0.0',
        tslint: '~6.1.0',
        'tslint-jasmine-rules': '^1.6.1'
      })
    );
  });

  it('should update workspace config', async () => {
    const updatedTree = await runSchematic();
    const angularJson = JSON.parse(updatedTree.readContent('angular.json'));

    expect(angularJson.projects[defaultProjectName].architect.lint).toEqual({
      builder: '@angular-devkit/build-angular:tslint',
      options: {
        tsConfig: ['tsconfig.app.json', 'tsconfig.spec.json'],
        exclude: ['**/node_modules/**']
      }
    });
  });

  it('should update workspace config for libraries', async () => {
    tree = await createTestLibrary(runner, { name: 'my-lib' });

    const updatedTree = await runSchematic('my-lib');

    const angularJson = JSON.parse(updatedTree.readContent('angular.json'));

    expect(angularJson.projects['my-lib'].architect.lint).toEqual({
      builder: '@angular-devkit/build-angular:tslint',
      options: {
        tsConfig: [
          'projects/my-lib/tsconfig.lib.json',
          'projects/my-lib/tsconfig.spec.json'
        ],
        exclude: ['**/node_modules/**']
      }
    });
  });

  it('should generate tslint.json file', async () => {
    expect(tree.exists('tslint.json')).toEqual(false);
    const updatedTree = await runSchematic();
    expect(updatedTree.exists('tslint.json')).toEqual(true);
  });
});
