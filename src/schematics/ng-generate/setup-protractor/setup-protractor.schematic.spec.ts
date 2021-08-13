import {
  SchematicTestRunner,
  UnitTestTree
} from '@angular-devkit/schematics/testing';

import path from 'path';

import { SkyuxVersions } from '../../../shared/skyux-versions';
import { createTestApp, createTestLibrary } from '../../testing/scaffold';

describe('Setup protractor schematic', () => {
  const collectionPath = path.join(__dirname, '../../../../collection.json');
  const defaultProjectName = 'foo-app';
  const schematicName = 'setup-protractor';

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

  it('should update workspace config', async () => {
    const updatedTree = await runSchematic();
    const angularJson = JSON.parse(updatedTree.readContent('angular.json'));

    expect(angularJson.projects[defaultProjectName].architect.e2e).toEqual({
      builder: '@skyux-sdk/angular-builders-compat:protractor',
      options: {
        protractorConfig: 'e2e/protractor.conf.js',
        devServerTarget: 'foo-app:serve'
      },
      configurations: {
        production: { devServerTarget: 'foo-app:serve:production' }
      }
    });
  });

  it('should add dev dependencies', async () => {
    const updatedTree = await runSchematic();

    const packageJson = JSON.parse(updatedTree.readContent('package.json'));
    expect(packageJson.devDependencies).toEqual(
      jasmine.objectContaining({
        '@skyux-sdk/e2e': SkyuxVersions.SdkE2e,
        protractor: '^7.0.0',
        'jasmine-spec-reporter': '^5.0.0'
      })
    );
  });

  it('should add e2e folder and configs', async () => {
    const updatedTree = await runSchematic();

    expect(updatedTree.exists('e2e/protractor.conf.js')).toEqual(true);
    expect(updatedTree.exists('e2e/tsconfig.json')).toEqual(true);
    expect(updatedTree.exists('e2e/src/app.po.ts')).toEqual(true);
  });

  it('should throw an error if added to library projects', async () => {
    tree = await createTestLibrary(runner, { name: 'my-lib' });

    await expectAsync(runSchematic('my-lib')).toBeRejectedWithError(
      "The project 'my-lib' must be of type 'application'."
    );
  });
});
