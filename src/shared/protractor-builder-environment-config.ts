import { SkyuxProtractorBuilderOptions } from '../builders/protractor/protractor-options';

/**
 * Environment configuration passed to the `protractor.default.conf.ts` file.
 */
export interface SkyuxProtractorBuilderEnvironmentConfig {
  /**
   * Options applied to the Angular CLI Protractor builder.
   */
  builderOptions?: SkyuxProtractorBuilderOptions;
}
