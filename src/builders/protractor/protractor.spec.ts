import * as angularArchitect from '@angular-devkit/architect';
import * as buildAngular from '@angular-devkit/build-angular';

import mock from 'mock-require';

import { SkyuxProtractorBuilderOptions } from './protractor-options';

describe('protractor builder', () => {
  let createBuilderSpy: jasmine.Spy;
  let executeProtractorBuilderSpy: jasmine.Spy;
  let updateChromeDriverSpy: jasmine.Spy;
  let options: Partial<SkyuxProtractorBuilderOptions>;
  let mockSpecFiles: string[];

  beforeEach(() => {
    options = {
      protractorConfig: 'protractor.conf.js'
    };

    createBuilderSpy = jasmine
      .createSpy('createBuilder')
      .and.callFake((cb: any) =>
        cb(options, {
          target: {
            project: 'foo'
          },
          logger: {
            info() {}
          }
        })
      );

    executeProtractorBuilderSpy = jasmine
      .createSpy('executeProtractorBuilder')
      .and.callFake(() => {
        return Promise.resolve({
          success: true
        });
      });

    spyOnProperty(angularArchitect, 'createBuilder', 'get').and.returnValue(
      createBuilderSpy
    );

    spyOnProperty(
      buildAngular,
      'executeProtractorBuilder',
      'get'
    ).and.returnValue(executeProtractorBuilderSpy);

    mockSpecFiles = ['foo.e2e-spec.ts'];
    mock('glob', {
      sync() {
        return mockSpecFiles;
      }
    });

    updateChromeDriverSpy = jasmine.createSpy('updateChromeDriver');
    mock('./chromedriver-manager', {
      updateChromeDriver: updateChromeDriverSpy
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  async function runBuilder() {
    return await mock.reRequire('./protractor').default;
  }

  it('should overwrite Angular Protractor config with defaults', async () => {
    await runBuilder();

    expect(options).toEqual({
      protractorConfig: 'protractor.conf.js',
      webdriverUpdate: false
    });
  });

  it('should update webdriver', async () => {
    await runBuilder();
    expect(updateChromeDriverSpy).toHaveBeenCalled();
  });

  it('should handle errors from webdriver', async () => {
    updateChromeDriverSpy.and.throwError('something bad happened');
    const result = await runBuilder();
    expect(result.error).toEqual('something bad happened');
    expect(result.success).toEqual(false);
  });
});
