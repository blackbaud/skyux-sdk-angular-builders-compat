import merge from 'lodash.merge';

import { SkyuxProtractorBuilderEnvironmentConfig } from './protractor-builder-environment-config';

const environmentVariableName = 'SKYUX_PROTRACTOR_BUILDER_ENVIRONMENT_CONFIG';

export function getProtractorEnvironmentConfig(): SkyuxProtractorBuilderEnvironmentConfig {
  return JSON.parse(process.env[environmentVariableName] || '{}');
}

/**
 * Our `protractor.default.conf.js` file needs to read the builder options to set certain behaviors.
 * However, because Angular CLI runs Protractor in a separate process, we must save the builder options
 * as an environment variable (`argv` and other states do not get passed to the separate process).
 * @see: https://github.com/angular/angular-cli/blob/master/packages/angular_devkit/build_angular/src/protractor/index.ts#L41
 */
export function applyProtractorEnvironmentConfig(
  value: SkyuxProtractorBuilderEnvironmentConfig
): void {
  const env = getProtractorEnvironmentConfig();
  const merged = merge(env, value);

  process.env[environmentVariableName] = JSON.stringify(merged);
}

export function clearProtractorEnvironmentConfig(): void {
  delete process.env[environmentVariableName];
}
