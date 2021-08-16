import { ProtractorBuilderOptions } from '@angular-devkit/build-angular';
import { JsonObject } from '@angular-devkit/core';

export type SkyuxProtractorBuilderOptions = ProtractorBuilderOptions &
  JsonObject;
