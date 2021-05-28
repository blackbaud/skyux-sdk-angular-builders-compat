import {
  SchematicTestRunner,
  UnitTestTree
} from '@angular-devkit/schematics/testing';

async function createWorkspace(runner: SchematicTestRunner) {
  const workspaceTree = await runner
    .runExternalSchematicAsync('@schematics/angular', 'workspace', {
      name: 'workspace',
      version: '11.0.0',
      newProjectRoot: 'projects'
    })
    .toPromise();
  return workspaceTree;
}

/**
 * Create a test workspace with an application as the default project.
 */
export async function createTestApp(
  runner: SchematicTestRunner,
  appOptions: {
    defaultProjectName: string;
  }
): Promise<{
  appTree: UnitTestTree;
  workspaceTree: UnitTestTree;
}> {
  const workspaceTree = await createWorkspace(runner);

  const appTree = await runner
    .runExternalSchematicAsync(
      '@schematics/angular',
      'application',
      {
        name: appOptions.defaultProjectName,
        projectRoot: ''
      },
      workspaceTree
    )
    .toPromise();

  return {
    appTree,
    workspaceTree
  };
}

/**
 * Create a test workspace with a library as the default project.
 */
export async function createTestLibrary(
  runner: SchematicTestRunner,
  appOptions: {
    defaultProjectName: string;
  }
): Promise<{
  appTree: UnitTestTree;
  workspaceTree: UnitTestTree;
}> {
  const workspaceTree = await createWorkspace(runner);

  const appTree = await runner
    .runExternalSchematicAsync(
      '@schematics/angular',
      'library',
      {
        name: appOptions.defaultProjectName
      },
      workspaceTree
    )
    .toPromise();

  await runner
    .runExternalSchematicAsync(
      '@schematics/angular',
      'application',
      {
        name: `${appOptions.defaultProjectName}-showcase`
      },
      workspaceTree
    )
    .toPromise();

  return {
    appTree,
    workspaceTree
  };
}
