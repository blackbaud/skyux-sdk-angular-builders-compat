import { normalize } from '@angular-devkit/core';
import {
  apply,
  applyTemplates,
  chain,
  MergeStrategy,
  mergeWith,
  move,
  Rule,
  SchematicsException,
  url
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import {
  addPackageJsonDependency,
  NodeDependencyType
} from '@schematics/angular/utility/dependencies';

import { SkyuxVersions } from '../../../shared/skyux-versions';
import {
  getProject,
  getWorkspace,
  updateWorkspace
} from '../../utility/workspace';

import { SetupProtractorSchema } from './schema';

function updateWorkspaceConfig(options: SetupProtractorSchema): Rule {
  return () => {
    return updateWorkspace((workspace) => {
      const project = workspace.projects.get(options.project)!;

      if (project.extensions.projectType !== 'application') {
        throw new SchematicsException(
          `The project '${options.project}' must be of type 'application'.`
        );
      }

      project.targets.set('e2e', {
        builder: '@skyux-sdk/angular-builders-compat:protractor',
        options: {
          protractorConfig: 'e2e/protractor.conf.js',
          devServerTarget: `${options.project}:serve`
        },
        configurations: {
          production: {
            devServerTarget: `${options.project}:serve:production`
          }
        }
      });
    });
  };
}

function generateTemplateFiles(options: SetupProtractorSchema): Rule {
  return async (tree) => {
    const { workspace } = await getWorkspace(tree);
    const { project } = await getProject(workspace, options.project);

    const movePath = normalize(project.root);

    const templateSource = apply(url('./files'), [
      applyTemplates({}),
      move(movePath)
    ]);

    return mergeWith(templateSource, MergeStrategy.Overwrite);
  };
}

export default function setupProtractor(options: SetupProtractorSchema): Rule {
  return (tree, context) => {
    addPackageJsonDependency(tree, {
      type: NodeDependencyType.Dev,
      name: '@skyux-sdk/e2e',
      version: SkyuxVersions.SdkE2e,
      overwrite: true
    });

    addPackageJsonDependency(tree, {
      type: NodeDependencyType.Dev,
      name: 'jasmine-spec-reporter',
      version: '^5.0.0',
      overwrite: false
    });

    addPackageJsonDependency(tree, {
      type: NodeDependencyType.Dev,
      name: 'protractor',
      version: '^7.0.0',
      overwrite: false
    });

    return chain([
      updateWorkspaceConfig(options),
      generateTemplateFiles(options),
      () => {
        context.addTask(new NodePackageInstallTask());
      }
    ]);
  };
}
