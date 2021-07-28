import {
  BuilderContext,
  BuilderOutput,
  createBuilder
} from '@angular-devkit/architect';
import { executeProtractorBuilder } from '@angular-devkit/build-angular';

import glob from 'glob';
import path from 'path';

import { updateChromeDriver } from './chromedriver-manager';
import { applyProtractorEnvironmentConfig } from './protractor-environment-utils';
import { SkyuxProtractorBuilderOptions } from './protractor-options';

async function executeSkyuxProtractorBuilder(
  options: SkyuxProtractorBuilderOptions,
  context: BuilderContext
): Promise<BuilderOutput> {
  const specs = glob.sync(path.join(process.cwd(), 'e2e/**/*.e2e-spec.ts'), {
    nodir: true
  });

  if (specs.length === 0) {
    context.logger.info(
      '[SKY UX] No spec files located. Skipping e2e command.'
    );
    return {
      success: true
    };
  }

  options.skyuxHeadless = !!options.skyuxHeadless;
  options.protractorConfig = path.join(__dirname, 'protractor.default.conf.js');

  try {
    // Disable Angular's webdriver update in favor of ours.
    options.webdriverUpdate = false;
    await updateChromeDriver();
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }

  applyProtractorEnvironmentConfig({
    builderOptions: options
  });

  return executeProtractorBuilder(options, context);
}

export default createBuilder<SkyuxProtractorBuilderOptions>(
  executeSkyuxProtractorBuilder
);
