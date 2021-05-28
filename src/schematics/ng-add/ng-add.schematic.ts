import { normalize, workspaces } from '@angular-devkit/core';
import {
  apply,
  applyTemplates,
  MergeStrategy,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
  url
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import {
  addPackageJsonDependency,
  NodeDependencyType
} from '@schematics/angular/utility/dependencies';
import { WorkspaceHost } from '@angular-devkit/core/src/workspace';

import { createHost } from '../utils/schematics-utils';
import { SkyuxNgAddOptions } from './schema';

async function readJson(host: WorkspaceHost, filePath: string): Promise<any> {
  const contents = await host.readFile(filePath);
  return JSON.parse(contents);
}

async function modifyAngularJson(
  host: workspaces.WorkspaceHost
): Promise<void> {
  const angularJson = await readJson(host, 'angular.json');
  for (const project of angularJson.projects) {
    angularJson.projects[project].architect.lint = {
      builder: '@angular-devkit/build-angular:tslint',
      options: {
        tsConfig: ['tsconfig.app.json', 'tsconfig.spec.json'],
        exclude: ['**/node_modules/**']
      }
    };
  }
}

function createAppFiles(project: workspaces.ProjectDefinition): Rule {
  const sourcePath = `${project!.sourceRoot}`;
  const templateSource = apply(url('./files'), [
    applyTemplates({}),
    move(normalize(sourcePath))
  ]);

  return mergeWith(templateSource, MergeStrategy.Overwrite);
}

export function ngAdd(options: SkyuxNgAddOptions): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const host = createHost(tree);
    const { workspace } = await workspaces.readWorkspace('/', host);

    if (!options.project) {
      options.project = workspace.extensions.defaultProject as string;
    }

    const project = workspace.projects.get(options.project);
    if (!project) {
      throw new SchematicsException(
        `The "${options.project}" project is not defined in angular.json. Provide a valid project name.`
      );
    }

    await modifyAngularJson(host);

    addPackageJsonDependency(tree, {
      type: NodeDependencyType.Dev,
      name: 'tslint',
      version: '~6.1.0',
      overwrite: true
    });

    addPackageJsonDependency(tree, {
      type: NodeDependencyType.Dev,
      name: 'codelyzer',
      version: '^6.0.0',
      overwrite: true
    });

    context.addTask(new NodePackageInstallTask());

    return createAppFiles(project);
  };
}
