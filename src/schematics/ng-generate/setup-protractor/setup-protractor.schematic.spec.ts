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

    // Add an e2e section.
    const angularJson = JSON.parse(tree.readContent('angular.json'));
    angularJson.projects[defaultProjectName].architect.e2e = {};
    tree.overwrite('angular.json', JSON.stringify(angularJson));
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

    expect(
      angularJson.projects[defaultProjectName].architect.e2e.builder
    ).toEqual('@skyux-sdk/angular-builders-compat:protractor');
  });

  it('should add dev dependencies', async () => {
    const updatedTree = await runSchematic();

    const packageJson = JSON.parse(updatedTree.readContent('package.json'));
    expect(packageJson.devDependencies).toEqual(
      jasmine.objectContaining({
        '@skyux-sdk/e2e': SkyuxVersions.SdkE2e
      })
    );
  });

  it('should throw an error if added to library projects', async () => {
    tree = await createTestLibrary(runner, { name: 'my-lib' });

    await expectAsync(runSchematic('my-lib')).toBeRejectedWithError(
      "The project 'my-lib' must be of type 'application'."
    );
  });

  it('should throw an error if e2e target is not set', async () => {
    const angularJson = JSON.parse(tree.readContent('angular.json'));
    delete angularJson.projects[defaultProjectName].architect.e2e;
    tree.overwrite('angular.json', JSON.stringify(angularJson));

    await expectAsync(runSchematic()).toBeRejectedWithError(
      'The project "foo-app" did not have a valid e2e target defined in angular.json. Run `ng generate @schematics/angular:e2e --related-app-name my-app` and then try again.'
    );
  });
});
