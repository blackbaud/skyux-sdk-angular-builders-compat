import { normalize } from '@angular-devkit/core';
import {
  apply,
  applyTemplates,
  chain,
  MergeStrategy,
  mergeWith,
  move,
  Rule,
  url
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import {
  addPackageJsonDependency,
  NodeDependencyType
} from '@schematics/angular/utility/dependencies';

import {
  getProject,
  getWorkspace,
  updateWorkspace
} from '../../utility/workspace';

import { SetupTSLintSchema } from './schema';

function updateWorkspaceConfig(options: SetupTSLintSchema): Rule {
  return () => {
    return updateWorkspace((workspace) => {
      const project = workspace.projects.get(options.project)!;

      const fileSuffix =
        project.extensions.projectType === 'library' ? 'lib' : 'app';

      project.targets.set('lint', {
        builder: '@angular-devkit/build-angular:tslint',
        options: {
          tsConfig: [
            `${project.root}/tsconfig.${fileSuffix}.json`,
            `${project.root}/tsconfig.spec.json`
          ],
          exclude: ['**/node_modules/**']
        }
      });
    });
  };
}

function generateTemplateFiles(options: SetupTSLintSchema): Rule {
  return async (tree) => {
    const { workspace } = await getWorkspace(tree);
    const { project } = await getProject(workspace, options.project);

    const movePath = normalize(project.root);

    const templateSource = apply(url('./files'), [
      applyTemplates({
        extendsPath: '@skyux-sdk/angular-builders-compat/config/tslint'
      }),
      move(movePath)
    ]);

    return mergeWith(templateSource, MergeStrategy.Overwrite);
  };
}

export default function setupTslint(options: SetupTSLintSchema): Rule {
  return (tree, context) => {
    addPackageJsonDependency(tree, {
      type: NodeDependencyType.Dev,
      name: 'codelyzer',
      version: '^6.0.0',
      overwrite: false
    });

    addPackageJsonDependency(tree, {
      type: NodeDependencyType.Dev,
      name: 'tslint',
      version: '~6.1.0',
      overwrite: false
    });

    addPackageJsonDependency(tree, {
      type: NodeDependencyType.Dev,
      name: 'tslint-jasmine-rules',
      version: '^1.6.1',
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
