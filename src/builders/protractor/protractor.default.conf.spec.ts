import mock from 'mock-require';
import { Config as ProtractorConfig } from 'protractor';

import { applyProtractorEnvironmentConfig } from './protractor-environment-utils';
import { SkyuxProtractorBuilderOptions } from './protractor-options';

describe('protractor.default.conf', () => {
  let mockPlatformConfig: ProtractorConfig | undefined;

  beforeEach(() => {
    setBuilderOptions({});

    mockPlatformConfig = {};

    spyOn(console, 'log');

    mock('../../shared/ci-platform-utils', {
      getCiPlatformProtractorConfig: () => mockPlatformConfig
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  function setBuilderOptions(
    value: Partial<SkyuxProtractorBuilderOptions>
  ): void {
    applyProtractorEnvironmentConfig({
      builderOptions: value as SkyuxProtractorBuilderOptions
    });
  }

  it('should allow setting the test browser to "headless" mode', () => {
    let config = mock.reRequire('./protractor.default.conf').config;

    expect(
      config.capabilities.chromeOptions.args.indexOf('--headless') === -1
    ).toBeTrue();

    setBuilderOptions({
      skyuxHeadless: true
    });

    config = mock.reRequire('./protractor.default.conf').config;

    expect(
      config.capabilities.chromeOptions.args.indexOf('--headless') === -1
    ).toBeFalse();
  });

  it('should apply CI platform overrides', () => {
    mockPlatformConfig = {
      capabilities: {
        browserName: 'firefox',
        chromeOptions: {
          args: ['--foobar']
        }
      },
      onPrepare() {
        return 'foobar';
      }
    };

    setBuilderOptions({
      skyuxCiPlatform: 'ado'
    });

    const config = mock.reRequire('./protractor.default.conf').config;

    expect(config.capabilities.browserName).toBe('firefox');
    expect(config.onPrepare()).toEqual('foobar');
    expect(config.capabilities.chromeOptions.args).toEqual(['--foobar']);
  });

  it('should handle undefined CI platform overrides', () => {
    mockPlatformConfig = undefined;

    setBuilderOptions({
      skyuxCiPlatform: 'ado'
    });

    const config = mock.reRequire('./protractor.default.conf').config;

    expect(config.capabilities.browserName).toBe('chrome');
  });
});
