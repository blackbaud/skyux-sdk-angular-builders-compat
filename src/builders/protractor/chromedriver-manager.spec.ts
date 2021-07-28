import mock from 'mock-require';
import path from 'path';

describe('chromedriver manager', () => {
  let crossSpawnSpy: jasmine.Spy;
  let mockChromeDriverVersion: any;
  let mockSpawnResult: any;

  beforeEach(() => {
    spyOn(console, 'error');
    spyOn(console, 'log');

    mockChromeDriverVersion = {
      chromeDriverVersion: '1.0.0'
    };

    mock('chromedriver-version-matcher', {
      getChromeDriverVersion() {
        return mockChromeDriverVersion;
      }
    });

    mockSpawnResult = {};
    crossSpawnSpy = jasmine.createSpy('sync').and.callFake(() => {
      return mockSpawnResult;
    });
    mock('cross-spawn', {
      sync: crossSpawnSpy
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  function runUtil(): Promise<any> {
    const manager = mock.reRequire('./chromedriver-manager');
    return manager.updateChromeDriver();
  }

  function verifyUpdatedVersion(expectedVersion: string) {
    expect(crossSpawnSpy).toHaveBeenCalledWith(
      path.join(process.cwd(), 'node_modules/.bin/webdriver-manager'),
      [
        'update',
        '--standalone=false',
        '--gecko=false',
        '--versions.chrome',
        expectedVersion
      ],
      { stdio: 'inherit' }
    );
  }

  it('should use specific version of webdriver', async () => {
    await runUtil();
    verifyUpdatedVersion('1.0.0');
  });

  it('should use latest version if matching version not found', async () => {
    mockChromeDriverVersion = {};
    await runUtil();
    verifyUpdatedVersion('latest');
  });

  it('should handle errors', async () => {
    mockSpawnResult = {
      error: new Error('something bad happened')
    };

    try {
      await runUtil();
      fail('Expected the call to fail.');
    } catch (err) {
      expect(err.message).toEqual('something bad happened');
    }
  });
});
