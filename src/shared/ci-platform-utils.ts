import glob from 'glob';
import path from 'path';
import { Config as ProtractorConfig } from 'protractor';

import { SkyuxCIPlatform } from './ci-platform';

/**
 * Returns the testing framework configuration intended for a specific continuous integration (CI) platform.
 * @param framework The framework running the tests.
 * @param platform The CI platform hosting the test server.
 */
function getCiPlatformConfig(
  framework: 'protractor',
  platform: SkyuxCIPlatform
): unknown | undefined {
  // Using glob so we can find `@skyux-sdk/pipeline-settings` regardless of npm install location.
  const pattern = path.join(
    process.cwd(),
    `node_modules/**/@skyux-sdk/pipeline-settings/platforms/${platform}/${framework}/${framework}.angular-cli.conf.js`
  );

  const configFiles = glob.sync(pattern);
  const configPath = configFiles[0];

  if (configPath) {
    console.log(
      `[SKY UX] Using external ${framework} configuration:\n${configPath}\n`
    );
    return require(configPath);
  }

  console.warn(
    `[SKY UX] Platform configuration not found for key, '${platform}'! ` +
      `Using default ${framework} configuration.`
  );

  return;
}

export function getCiPlatformProtractorConfig(
  platform: SkyuxCIPlatform
): ProtractorConfig | undefined {
  return (
    getCiPlatformConfig('protractor', platform) as {
      config?: ProtractorConfig;
    }
  )?.config;
}
