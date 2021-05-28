import { virtualFs, workspaces } from '@angular-devkit/core';
import { SchematicsException, Tree } from '@angular-devkit/schematics';

/**
 * Creates a workspace host.
 * Taken from: https://angular.io/guide/schematics-for-libraries#get-the-project-configuration
 */
export function createHost(tree: Tree): workspaces.WorkspaceHost {
  return {
    /* istanbul ignore next */
    async readFile(path: string): Promise<string> {
      const data = tree.read(path);
      if (!data) {
        throw new SchematicsException(`File "${path}" not found.`);
      }
      return virtualFs.fileBufferToString(data);
    },

    /* istanbul ignore next */
    async writeFile(path: string, data: string): Promise<void> {
      return tree.overwrite(path, data);
    },

    /* istanbul ignore next */
    async isDirectory(path: string): Promise<boolean> {
      return !tree.exists(path) && tree.getDir(path).subfiles.length > 0;
    },

    /* istanbul ignore next */
    async isFile(path: string): Promise<boolean> {
      return tree.exists(path);
    }
  };
}
