import { chain, Rule, SchematicsException } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import {
  addPackageJsonDependency,
  NodeDependencyType
} from '@schematics/angular/utility/dependencies';

import { SkyuxVersions } from '../../../shared/skyux-versions';
import { updateWorkspace } from '../../utility/workspace';

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

      const target = project.targets.get('e2e');
      if (!target) {
        throw new SchematicsException(
          `The project "${options.project}" did not have a valid e2e target defined in angular.json. Run \`ng generate @schematics/angular:e2e --related-app-name my-app\` and then try again.`
        );
      }

      target.builder = '@skyux-sdk/angular-builders-compat:protractor';
    });
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

    return chain([
      updateWorkspaceConfig(options),
      () => {
        context.addTask(new NodePackageInstallTask());
      }
    ]);
  };
}
