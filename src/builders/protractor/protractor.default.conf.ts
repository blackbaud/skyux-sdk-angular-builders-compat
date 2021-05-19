// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts
import mergeWith from 'lodash.mergewith';
import { Config as ProtractorConfig } from 'protractor';

import { getCiPlatformProtractorConfig } from '../../shared/ci-platform-utils';

import { getProtractorEnvironmentConfig } from './protractor-environment-utils';

const { SpecReporter, StacktraceOption } = require('jasmine-spec-reporter');

function mergeConfigs(
  defaults: ProtractorConfig,
  overrides: ProtractorConfig
): ProtractorConfig {
  return mergeWith<ProtractorConfig, ProtractorConfig>(
    defaults,
    overrides,
    (defaultValue, overrideValue) => {
      if (Array.isArray(defaultValue)) {
        return overrideValue;
      }
    }
  );
}

function getConfig(): ProtractorConfig {
  const browserArgs: string[] = [];

  const env = getProtractorEnvironmentConfig();

  const builderOptions = env.builderOptions!;
  if (builderOptions.skyuxHeadless) {
    browserArgs.push('--headless');
  }

  // The default Protractor configuration provided by Angular CLI.
  let config: ProtractorConfig = {
    allScriptsTimeout: 11000,
    specs: [require('path').join(process.cwd(), './e2e/src/**/*.e2e-spec.ts')],
    capabilities: {
      browserName: 'chrome',
      chromeOptions: {
        args: browserArgs
      }
    },
    directConnect: true,
    SELENIUM_PROMISE_MANAGER: false,
    baseUrl: 'http://localhost:4200/',
    framework: 'jasmine',
    jasmineNodeOpts: {
      showColors: true,
      defaultTimeoutInterval: 30000,
      /* eslint-disable @typescript-eslint/no-empty-function */
      /* istanbul ignore next */
      print() {}
      /* eslint-enable */
    },
    /* istanbul ignore next */
    onPrepare() {
      require('ts-node').register({
        project: require('path').join(process.cwd(), './e2e/tsconfig.json')
      });
      jasmine.getEnv().addReporter(
        new SpecReporter({
          spec: {
            displayStacktrace: StacktraceOption.PRETTY
          }
        })
      );
    }
  };

  // Apply platform config overrides.
  if (builderOptions.skyuxCiPlatform) {
    const overrides = getCiPlatformProtractorConfig(
      builderOptions.skyuxCiPlatform
    );
    config = mergeConfigs(config, overrides || {});
  } else {
    console.log(
      '[SKY UX] A specific CI platform configuration was not requested. ' +
        'Using default Protractor configuration.'
    );
  }

  return config;
}

exports.config = getConfig();
