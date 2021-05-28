import {
  SchematicTestRunner,
  UnitTestTree
} from '@angular-devkit/schematics/testing';

import path from 'path';

import { createTestApp } from '../testing/scaffold';

const COLLECTION_PATH = path.resolve(__dirname, '../../../collection.json');

describe('ng-add.schematic', () => {
  let runner: SchematicTestRunner;

  beforeEach(async () => {
    runner = new SchematicTestRunner('schematics', COLLECTION_PATH);
  });

  async function runSchematic(
    tree: UnitTestTree,
    options?: { project?: string }
  ): Promise<void> {
    await runner.runSchematicAsync('ng-add', options, tree).toPromise();
  }

  function getAngularJson(app: UnitTestTree): any {
    return JSON.parse(app.readContent('angular.json'));
  }

  // function writeAngularJson(app: UnitTestTree, content: any) {
  //   app.overwrite('angular.json', JSON.stringify(content));
  // }

  describe('> Application as default project >', () => {
    let app: UnitTestTree;

    beforeEach(async () => {
      const result = await createTestApp(runner, {
        defaultProjectName: 'foobar'
      });
      app = result.appTree;
    });

    it('should run the NodePackageInstallTask', async () => {
      await runSchematic(app, {
        project: 'foobar'
      });

      expect(runner.tasks.some((task) => task.name === 'node-package')).toEqual(
        true,
        'Expected the schematic to setup a package install step.'
      );
    });

    it('should use the default project if none provided', async () => {
      const emptyOptions = {};
      await expectAsync(runSchematic(app, emptyOptions)).not.toBeRejected();
    });

    it("should throw an error if angular.json doesn't exist", async () => {
      app.delete('angular.json');

      await expectAsync(
        runSchematic(app, {
          project: 'invalid-foobar'
        })
      ).toBeRejectedWithError(
        'Unable to locate a workspace file for workspace path.'
      );
    });

    it("should throw an error if specified project doesn't exist", async () => {
      await expectAsync(
        runSchematic(app, {
          project: 'invalid-project'
        })
      ).toBeRejectedWithError(
        'The "invalid-project" project is not defined in angular.json. Provide a valid project name.'
      );
    });

    it('should add the lint architect', async () => {
      await runSchematic(app, {
        project: 'foobar'
      });

      const angularJson = getAngularJson(app);
      expect(angularJson.projects.foobar.architect.lint).toEqual({
        builder: '@angular-devkit/build-angular:tslint',
        options: {
          tsConfig: ['tsconfig.app.json', 'tsconfig.spec.json'],
          exclude: ['**/node_modules/**']
        }
      });
    });

    it('should create a tslint.json file if not exists', async () => {
      expect(app.exists('tslint.json')).toBeFalse();

      await runSchematic(app, {
        project: 'foobar'
      });

      expect(app.exists('tslint.json')).toBeTrue();
    });

    it('should modify the extends property if tslint.json exists', async () => {
      app.create('tslint.json', '{ "extends": "@skyux-sdk/builder/tslint" }');
      await runSchematic(app, {
        project: 'foobar'
      });

      const contents = app.read('tslint.json')?.toString();

      expect(contents).toEqual(
        '{ "extends": "@skyux-sdk/angular-builders-compat/config/tslint" }'
      );
    });

    it('should add packages to package.json', async () => {
      await runSchematic(app, {
        project: 'foobar'
      });

      const packageJson = JSON.parse(app.readContent('package.json'));
      expect(packageJson.devDependencies).toEqual(
        jasmine.objectContaining({
          codelyzer: '^6.0.0',
          tslint: '~6.1.0'
        })
      );
    });

    // it('should add packages to package.json files without dependency sections', async () => {
    //   // Create an empty package.json file.
    //   app.overwrite('package.json', JSON.stringify({}));

    //   await runSchematic(app, {
    //     project: 'foobar'
    //   });

    //   const packageJson = JSON.parse(app.readContent('package.json'));
    //   expect(packageJson.dependencies).toBeDefined();
    //   expect(packageJson.devDependencies).toBeDefined();
    // });
  });

  // describe('> Library as default project >', () => {
  //   let defaultProjectName: string;
  //   let tree: UnitTestTree;

  //   beforeEach(async () => {
  //     defaultProjectName = 'foo-lib';
  //     tree = (
  //       await createTestLibrary(runner, {
  //         defaultProjectName
  //       })
  //     ).appTree;
  //   });

  //   it('should run the NodePackageInstallTask', async () => {
  //     await runSchematic(tree, {
  //       project: defaultProjectName
  //     });

  //     expect(runner.tasks.some((task) => task.name === 'node-package')).toEqual(
  //       true,
  //       'Expected the schematic to setup a package install step.'
  //     );
  //   });

  //   it('should generate an empty skyuxconfig.json file', async () => {
  //     await runSchematic(tree, {
  //       project: defaultProjectName
  //     });

  //     const skyuxconfigJson = JSON.parse(tree.readContent('skyuxconfig.json'));
  //     expect(skyuxconfigJson).toEqual({
  //       $schema:
  //         './node_modules/@blackbaud-internal/skyux-angular-builders/skyuxconfig-schema.json'
  //     });
  //   });

  //   it('should modify angular.json', async () => {
  //     await runSchematic(tree, {
  //       project: defaultProjectName
  //     });

  //     const angularJson = getAngularJson(tree);
  //     const testConfig =
  //       angularJson.projects[defaultProjectName].architect.test;
  //     expect(testConfig.builder).toEqual(
  //       '@blackbaud-internal/skyux-angular-builders:karma'
  //     );
  //     expect(testConfig.options.codeCoverage).toEqual(true);
  //   });

  //   it("should modify the app's karma.conf.js file", async () => {
  //     await runSchematic(tree, {
  //       project: defaultProjectName
  //     });

  //     const contents = tree
  //       .read(`projects/${defaultProjectName}/karma.conf.js`)
  //       ?.toString();
  //     expect(contents).toContain('DO NOT MODIFY');
  //   });

  //   it("should throw an error if specified project doesn't include an `architect.test` property", async () => {
  //     // Create an incorrectly formatted project config.
  //     const angularJson = getAngularJson(tree);
  //     delete angularJson.projects[defaultProjectName].architect.test;
  //     writeAngularJson(tree, angularJson);

  //     await expectAsync(
  //       runSchematic(tree, {
  //         project: defaultProjectName
  //       })
  //     ).toBeRejectedWithError(
  //       `Expected node projects/${defaultProjectName}/architect/test in angular.json!`
  //     );
  //   });

  //   it('should add packages to package.json', async () => {
  //     await runSchematic(tree, {
  //       project: defaultProjectName
  //     });

  //     const packageJson = JSON.parse(tree.readContent('package.json'));
  //     expect(packageJson.dependencies).toEqual(
  //       jasmine.objectContaining({
  //         '@skyux/assets': '^4.0.0',
  //         '@skyux/config': '^4.4.0',
  //         '@skyux/core': '^4.4.0',
  //         '@skyux/i18n': '^4.0.3',
  //         '@skyux/theme': '^5.0.0-alpha.0'
  //       })
  //     );
  //     expect(packageJson.devDependencies).toEqual(
  //       jasmine.objectContaining({
  //         '@skyux-sdk/testing': '^4.0.0'
  //       })
  //     );
  //   });
  // });
});
