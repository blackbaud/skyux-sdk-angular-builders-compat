import karma from 'karma';
import mock from 'mock-require';
import path from 'path';

describe('ci platform utils', () => {
  let globSyncSpy: jasmine.Spy;

  beforeEach(() => {
    globSyncSpy = jasmine.createSpy('sync');

    spyOn(console, 'log');

    mock('glob', {
      sync: globSyncSpy
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should return Protractor config', () => {
    const { getCiPlatformProtractorConfig } = mock.reRequire(
      './ci-platform-utils'
    );

    globSyncSpy.and.returnValue(['valid-config-file.js']);

    const contents = {
      config: {
        foo: 'bar'
      }
    };
    mock('valid-config-file.js', contents);

    const result = getCiPlatformProtractorConfig('ado');
    expect(result).toEqual({
      foo: 'bar'
    });

    expect(globSyncSpy.calls.mostRecent().args[0]).toContain(
      path.join(
        'node_modules/**/@skyux-sdk/pipeline-settings/platforms/ado/protractor/protractor.angular-cli.conf.js'
      )
    );
  });

  it('should return Karma config', () => {
    const { getCiPlatformKarmaConfig } = mock.reRequire('./ci-platform-utils');

    globSyncSpy.and.returnValue(['valid-config-file.js']);

    const contents = (_conf: karma.Config) => {};
    mock('valid-config-file.js', contents);

    const result = getCiPlatformKarmaConfig('gh-actions');
    expect(result).toBe(contents);

    expect(globSyncSpy.calls.mostRecent().args[0]).toContain(
      path.join(
        'node_modules/**/@skyux-sdk/pipeline-settings/platforms/gh-actions/karma/karma.angular-cli.conf.js'
      )
    );
  });

  it('should handle invalid platform config keys', () => {
    const { getCiPlatformProtractorConfig } = mock.reRequire(
      './ci-platform-utils'
    );

    globSyncSpy.and.returnValue([]);
    const warnSpy = spyOn(console, 'warn');

    const result = getCiPlatformProtractorConfig('invalid');

    expect(result).toBe(
      undefined,
      'Expected config file path to be undefined.'
    );

    expect(warnSpy.calls.mostRecent().args[0]).toContain(
      'Platform configuration not found for key'
    );
  });
});
