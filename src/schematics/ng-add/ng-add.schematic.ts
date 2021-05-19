// import { OutputHashing } from '@angular-devkit/build-angular';
// import { normalize, workspaces } from '@angular-devkit/core';
// import {
//   apply,
//   applyTemplates,
//   forEach,
//   MergeStrategy,
//   mergeWith,
//   move,
//   Rule,
//   SchematicContext,
//   SchematicsException,
//   Tree,
//   url
// } from '@angular-devkit/schematics';
// import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
// import {
//   addPackageJsonDependency,
//   NodeDependencyType
// } from '@schematics/angular/utility/dependencies';

// import { SkyuxDevServerBuilderOptions } from '../../builders/dev-server/dev-server-options';
// import { SkyuxConfig } from '../../shared/skyux-config';
// import {
//   addModuleImportToRootModule,
//   createHost
// } from '../utils/schematics-utils';

// import { SkyuxNgAddOptions } from './schema';
// import { addToLibrary } from './utils/add-to-library';
// import { createSkyuxConfigIfNotExists } from './utils/create-skyuxconfig';
// import { modifyKarmaConfig } from './utils/modify-karma-config';
// import { modifyPolyfills } from './utils/modify-polyfills';
// import { readJson } from './utils/read-json';

// async function getThemeStylesheets(
//   host: workspaces.WorkspaceHost
// ): Promise<string[]> {
//   const themeStylesheets = ['@skyux/theme/css/sky.css'];

//   const skyuxConfig: SkyuxConfig = await readJson(host, 'skyuxconfig.json');
//   if (skyuxConfig.app?.theming?.supportedThemes) {
//     for (const theme of skyuxConfig.app.theming.supportedThemes) {
//       if (theme !== 'default') {
//         themeStylesheets.push(`@skyux/theme/css/themes/${theme}/styles.css`);
//       }
//     }
//   }

//   return themeStylesheets;
// }

// async function modifyAngularJson(
//   host: workspaces.WorkspaceHost,
//   context: SchematicContext,
//   options: SkyuxNgAddOptions
// ): Promise<void> {
//   const projectName = options.project;
//   const angularJson = await readJson(host, 'angular.json');

//   const architectConfig = angularJson.projects[projectName].architect;
//   if (!architectConfig) {
//     throw new SchematicsException(
//       `Expected node projects/${projectName}/architect in angular.json!`
//     );
//   }

//   if (architectConfig.build) {
//     architectConfig.build.builder =
//       '@blackbaud-internal/skyux-angular-builders:browser';
//     // Configure Angular to only hash bundled JavaScript files.
//     // Our builder will handle hashing the file names found in `src/assets`.
//     architectConfig.build.configurations!.production!.outputHashing! =
//       OutputHashing.Bundles;
//   } else {
//     throw new SchematicsException(
//       `Expected node projects/${projectName}/architect/build in angular.json!`
//     );
//   }

//   if (architectConfig.serve) {
//     architectConfig.serve.builder =
//       '@blackbaud-internal/skyux-angular-builders:dev-server';
//     architectConfig.serve.options = architectConfig.serve.options || {};
//     architectConfig.serve.options.ssl = true;
//   } else {
//     throw new SchematicsException(
//       `Expected node projects/${projectName}/architect/serve in angular.json!`
//     );
//   }

//   if (architectConfig.e2e) {
//     architectConfig.e2e.builder =
//       '@blackbaud-internal/skyux-angular-builders:protractor';
//     architectConfig.e2e.options!.devServerTarget = `${projectName}:serve:e2e`;
//     architectConfig.serve.configurations!.e2e = {
//       browserTarget: `${projectName}:build`,
//       servePath: '/',
//       skyuxOpen: false
//     } as SkyuxDevServerBuilderOptions;
//   } else {
//     context.logger.warn(
//       `[skyux] Skipping e2e setup since the expected node "projects/${projectName}/architect/e2e" was not found in angular.json.`
//     );
//   }

//   if (architectConfig.test) {
//     architectConfig.test.builder =
//       '@blackbaud-internal/skyux-angular-builders:karma';
//     architectConfig.test.options!.codeCoverage = true;

//     // Exclude our generated files from the consumers' code coverage.
//     architectConfig.test.options!.codeCoverageExclude = [
//       'src/app/__skyux/**/*'
//     ];
//   } else {
//     throw new SchematicsException(
//       `Expected node projects/${projectName}/architect/test in angular.json!`
//     );
//   }

//   // Add theme stylesheets.
//   const angularStylesheets = architectConfig.build.options.styles.filter(
//     (stylesheet: string) => !stylesheet.startsWith('@skyux/theme')
//   );
//   const themeStylesheets = await getThemeStylesheets(host);
//   architectConfig.build.options.styles =
//     themeStylesheets.concat(angularStylesheets);

//   await host.writeFile(
//     'angular.json',
//     JSON.stringify(angularJson, undefined, 2) + '\n'
//   );
// }

// async function modifyProtractorConfig(
//   host: workspaces.WorkspaceHost,
//   projectRoot: string
// ): Promise<void> {
//   await host.writeFile(
//     `${projectRoot}/e2e/protractor.conf.js`,
//     `// DO NOT MODIFY
// // This file is handled by the '@blackbaud-internal/skyux-angular-builders' library.
// exports.config = {};
// `
//   );
// }

// async function modifyTsConfig(host: workspaces.WorkspaceHost): Promise<void> {
//   const tsConfigContents = await host.readFile('tsconfig.json');
//   // JavaScript has difficulty parsing JSON with comments.
//   const banner =
//     '/* To learn more about this file see: https://angular.io/config/tsconfig. */\n';
//   const tsConfig = JSON.parse(tsConfigContents.replace(banner, ''));
//   tsConfig.compilerOptions.resolveJsonModule = true;
//   tsConfig.compilerOptions.esModuleInterop = true;

//   // Enforce the ES5 target until we can drop support for IE 11.
//   tsConfig.compilerOptions.target = 'es5';

//   await host.writeFile(
//     'tsconfig.json',
//     banner + JSON.stringify(tsConfig, undefined, 2)
//   );
// }

// async function modifyAppComponentTemplate(
//   host: workspaces.WorkspaceHost
// ): Promise<void> {
//   const templatePath = 'src/app/app.component.html';

//   let templateHtml = await host.readFile(templatePath);

//   if (templateHtml.indexOf('</skyux-app-shell>') < 0) {
//     // Indent all non-blank lines by 2 spaces and wrap the contents in the shell component
//     // with a trailing newline.
//     templateHtml = `<!-- SKY UX SHELL SUPPORT - DO NOT REMOVE -->
// <!-- Enables omnibar, help, and other shell components configured in skyuxconfig.json. -->
// <skyux-app-shell>
//   ${templateHtml.trim().replace(/\n(?!(\n|$))/g, '\n  ')}
// </skyux-app-shell>
// `;

//     await host.writeFile(templatePath, templateHtml);
//   }
// }

// /**
//  * Fixes an Angular CLI issue with merge strategies.
//  * @see https://github.com/angular/angular-cli/issues/11337#issuecomment-516543220
//  */
// function overwriteIfExists(tree: Tree): Rule {
//   return forEach((fileEntry) => {
//     if (tree.exists(fileEntry.path)) {
//       tree.overwrite(fileEntry.path, fileEntry.content);
//       return null;
//     }
//     return fileEntry;
//   });
// }

// function createAppFiles(
//   tree: Tree,
//   project: workspaces.ProjectDefinition
// ): Rule {
//   addModuleImportToRootModule(
//     tree,
//     'SkyuxModule.forRoot()',
//     './__skyux/skyux.module'
//   );

//   const sourcePath = `${project!.sourceRoot}/app`;
//   const templateSource = apply(url('./files'), [
//     applyTemplates({}),
//     move(normalize(sourcePath)),
//     overwriteIfExists(tree)
//   ]);

//   return mergeWith(templateSource, MergeStrategy.Overwrite);
// }

// export function ngAdd(options: SkyuxNgAddOptions): Rule {
//   return async (tree: Tree, context: SchematicContext) => {
//     const host = createHost(tree);
//     const { workspace } = await workspaces.readWorkspace('/', host);

//     if (!options.project) {
//       options.project = workspace.extensions.defaultProject as string;
//     }

//     const project = workspace.projects.get(options.project);
//     if (!project) {
//       throw new SchematicsException(
//         `The "${options.project}" project is not defined in angular.json. Provide a valid project name.`
//       );
//     }

//     // Libraries require a different setup.
//     if (project.extensions.projectType === 'library') {
//       return addToLibrary(tree, host, workspace, context, options);
//     }

//     createSkyuxConfigIfNotExists(tree);
//     await modifyAngularJson(host, context, options);
//     await modifyTsConfig(host);
//     await modifyKarmaConfig(host, project.root);
//     await modifyProtractorConfig(host, project.root);
//     await modifyAppComponentTemplate(host);
//     await modifyPolyfills(host);

//     addPackageJsonDependency(tree, {
//       type: NodeDependencyType.Default,
//       name: '@blackbaud/auth-client',
//       version: '^2.46.0',
//       overwrite: true
//     });

//     addPackageJsonDependency(tree, {
//       type: NodeDependencyType.Default,
//       name: '@blackbaud/help-client',
//       version: '^3.0.0',
//       overwrite: true
//     });

//     addPackageJsonDependency(tree, {
//       type: NodeDependencyType.Default,
//       name: '@blackbaud/skyux-lib-help',
//       version: '^4.0.0',
//       overwrite: true
//     });

//     addPackageJsonDependency(tree, {
//       type: NodeDependencyType.Default,
//       name: '@blackbaud-internal/skyux-auth',
//       version: '^4.0.0-alpha.2',
//       overwrite: true
//     });

//     addPackageJsonDependency(tree, {
//       type: NodeDependencyType.Default,
//       name: '@skyux/assets',
//       version: '^4.0.0',
//       overwrite: true
//     });

//     addPackageJsonDependency(tree, {
//       type: NodeDependencyType.Default,
//       name: '@skyux/config',
//       version: '^4.4.0',
//       overwrite: true
//     });

//     addPackageJsonDependency(tree, {
//       type: NodeDependencyType.Default,
//       name: '@skyux/core',
//       version: '^4.4.0',
//       overwrite: true
//     });

//     addPackageJsonDependency(tree, {
//       type: NodeDependencyType.Default,
//       name: '@skyux/http',
//       version: '^4.2.0',
//       overwrite: true
//     });

//     addPackageJsonDependency(tree, {
//       type: NodeDependencyType.Default,
//       name: '@skyux/i18n',
//       version: '^4.0.3',
//       overwrite: true
//     });

//     addPackageJsonDependency(tree, {
//       type: NodeDependencyType.Default,
//       name: '@skyux/omnibar-interop',
//       version: '^4.0.1',
//       overwrite: true
//     });

//     addPackageJsonDependency(tree, {
//       type: NodeDependencyType.Default,
//       name: '@skyux/theme',
//       version: '^4.15.3',
//       overwrite: true
//     });

//     addPackageJsonDependency(tree, {
//       type: NodeDependencyType.Dev,
//       name: '@skyux-sdk/e2e',
//       version: '^4.0.0',
//       overwrite: true
//     });

//     addPackageJsonDependency(tree, {
//       type: NodeDependencyType.Dev,
//       name: '@skyux-sdk/testing',
//       version: '^4.0.0',
//       overwrite: true
//     });

//     context.addTask(new NodePackageInstallTask());

//     return createAppFiles(tree, project);
//   };
// }
