import { SchematicsException, Tree } from '@angular-devkit/schematics';

export function readJson(tree: Tree, filePath: string): any {
  const buffer = tree.read(filePath);
  if (!buffer) {
    throw new SchematicsException(`[skyux] Could not read ${filePath}.`);
  }
  return JSON.parse(buffer.toString());
}

export function writeJson(tree: Tree, filePath: string, contents: any): void {
  tree.overwrite(filePath, JSON.stringify(contents, null, 2));
}
