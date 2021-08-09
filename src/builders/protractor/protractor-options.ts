import { ProtractorBuilderOptions } from '@angular-devkit/build-angular';
import { JsonObject } from '@angular-devkit/core';

import { SkyuxCIPlatform } from '../../shared/ci-platform';

export type SkyuxProtractorBuilderOptions = ProtractorBuilderOptions &
  JsonObject & {
    /**
     * The name of the continuous integration platform that will run the tests.
     */
    skyuxCiPlatform?: SkyuxCIPlatform;

    /**
     * Specifies if the test browser should be run in "headless" mode.
     */
    skyuxHeadless?: boolean;
  };
