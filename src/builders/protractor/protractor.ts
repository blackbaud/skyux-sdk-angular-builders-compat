import {
  BuilderContext,
  BuilderOutput,
  createBuilder
} from '@angular-devkit/architect';
import { executeProtractorBuilder } from '@angular-devkit/build-angular';

import { updateChromeDriver } from './chromedriver-manager';
import { SkyuxProtractorBuilderOptions } from './protractor-options';

async function executeSkyuxProtractorBuilder(
  options: SkyuxProtractorBuilderOptions,
  context: BuilderContext
): Promise<BuilderOutput> {
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

  return executeProtractorBuilder(options, context);
}

export default createBuilder<SkyuxProtractorBuilderOptions>(
  executeSkyuxProtractorBuilder
);
