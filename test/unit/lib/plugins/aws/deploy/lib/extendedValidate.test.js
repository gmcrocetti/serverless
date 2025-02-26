'use strict';

const chai = require('chai');
const sinon = require('sinon');
const path = require('path');
const AwsProvider = require('../../../../../../../lib/plugins/aws/provider');
const AwsDeploy = require('../../../../../../../lib/plugins/aws/deploy/index');
const Serverless = require('../../../../../../../lib/Serverless');
const { getTmpDirPath } = require('../../../../../../utils/fs');
const runServerless = require('../../../../../../utils/run-serverless');

chai.use(require('sinon-chai'));

const expect = chai.expect;

describe('extendedValidate', () => {
  let awsDeploy;
  const tmpDirPath = getTmpDirPath();

  const serverlessYmlPath = path.join(tmpDirPath, 'serverless.yml');
  const serverlessYml = {
    service: 'first-service',
    provider: 'aws',
    functions: {
      first: {
        handler: 'sample.handler',
      },
    },
  };
  const stateFileMock = {
    service: serverlessYml,
    package: {
      individually: true,
      artifactDirectoryName: 'some/path',
      artifact: '',
    },
  };

  beforeEach(() => {
    const options = {
      stage: 'dev',
      region: 'us-east-1',
    };
    const serverless = new Serverless();
    serverless.setProvider('aws', new AwsProvider(serverless, options));
    serverless.utils.writeFileSync(serverlessYmlPath, serverlessYml);
    serverless.serviceDir = tmpDirPath;
    awsDeploy = new AwsDeploy(serverless, options);
    awsDeploy.serverless.service.service = `service-${new Date().getTime().toString()}`;
    awsDeploy.serverless.cli = {
      log: sinon.spy(),
    };
  });

  describe('extendedValidate()', () => {
    let fileExistsSyncStub;
    let readFileSyncStub;

    beforeEach(() => {
      fileExistsSyncStub = sinon.stub(awsDeploy.serverless.utils, 'fileExistsSync');
      readFileSyncStub = sinon.stub(awsDeploy.serverless.utils, 'readFileSync');
      awsDeploy.serverless.service.package.individually = false;
    });

    afterEach(() => {
      fileExistsSyncStub.restore();
      readFileSyncStub.restore();
    });

    it('should throw error if state file does not exist', () => {
      fileExistsSyncStub.returns(false);

      expect(() => awsDeploy.extendedValidate()).to.throw(Error);
    });

    it('should throw error if packaged individually but functions packages do not exist', () => {
      fileExistsSyncStub.onCall(0).returns(true);
      fileExistsSyncStub.onCall(1).returns(false);
      readFileSyncStub.returns(stateFileMock);

      awsDeploy.serverless.service.package.individually = true;

      expect(() => awsDeploy.extendedValidate()).to.throw(Error);
    });

    it('should throw error if service package does not exist', () => {
      fileExistsSyncStub.onCall(0).returns(true);
      fileExistsSyncStub.onCall(1).returns(false);
      readFileSyncStub.returns(stateFileMock);

      expect(() => awsDeploy.extendedValidate()).to.throw(Error);
    });

    it('should not throw error if service has no functions and no service package', () => {
      stateFileMock.service.functions = {};
      fileExistsSyncStub.returns(true);
      readFileSyncStub.returns(stateFileMock);

      awsDeploy.extendedValidate();
      expect(fileExistsSyncStub.calledOnce).to.equal(true);
      expect(readFileSyncStub.calledOnce).to.equal(true);
    });

    it('should not throw error if service has no functions and no function packages', () => {
      stateFileMock.service.functions = {};
      awsDeploy.serverless.service.package.individually = true;
      fileExistsSyncStub.returns(true);
      readFileSyncStub.returns(stateFileMock);

      awsDeploy.extendedValidate();
      expect(fileExistsSyncStub.calledOnce).to.equal(true);
      expect(readFileSyncStub.calledOnce).to.equal(true);
    });

    it('should not throw error if individual packaging defined on a function level', () => {
      awsDeploy.serverless.service.package.individually = false;
      stateFileMock.service.functions = {
        first: {
          package: {
            individually: true,
          },
        },
      };
      fileExistsSyncStub.returns(true);
      readFileSyncStub.returns(stateFileMock);
      return awsDeploy.extendedValidate();
    });

    it('should use function package level artifact when provided', () => {
      stateFileMock.service.functions = {
        first: {
          package: {
            artifact: 'artifact.zip',
          },
        },
      };
      awsDeploy.serverless.service.package.individually = true;
      fileExistsSyncStub.returns(true);
      readFileSyncStub.returns(stateFileMock);

      awsDeploy.extendedValidate();
      expect(fileExistsSyncStub.calledTwice).to.equal(true);
      expect(readFileSyncStub.calledOnce).to.equal(true);
      expect(fileExistsSyncStub).to.have.been.calledWithExactly('artifact.zip');
    });

    it('should throw error if specified package artifact does not exist', () => {
      // const fileExistsSyncStub = sinon.stub(awsDeploy.serverless.utils, 'fileExistsSync');
      fileExistsSyncStub.onCall(0).returns(true);
      fileExistsSyncStub.onCall(1).returns(false);
      readFileSyncStub.returns(stateFileMock);
      awsDeploy.serverless.service.package.artifact = 'some/file.zip';
      expect(() => awsDeploy.extendedValidate()).to.throw(Error);
      delete awsDeploy.serverless.service.package.artifact;
    });

    it('should not throw error if specified package artifact exists', () => {
      // const fileExistsSyncStub = sinon.stub(awsDeploy.serverless.utils, 'fileExistsSync');
      fileExistsSyncStub.onCall(0).returns(true);
      fileExistsSyncStub.onCall(1).returns(true);
      readFileSyncStub.returns(stateFileMock);
      awsDeploy.serverless.service.package.artifact = 'some/file.zip';
      awsDeploy.extendedValidate();
      delete awsDeploy.serverless.service.package.artifact;
    });
  });
});

describe('test/unit/lib/plugins/aws/deploy/lib/extendedValidate.test.js', () => {
  it("should not warn if function's timeout is greater than 30 and it's attached to APIGW, but it has [async] mode", async () => {
    const msg = [
      "WARNING: Function foo has timeout of 31 seconds, however, it's",
      "attached to API Gateway so it's automatically limited to 30 seconds.",
    ].join(' ');

    const { stdoutData } = await runServerless({
      fixture: 'function',
      configExt: {
        functions: {
          foo: {
            timeout: 31,
            events: [
              {
                http: {
                  method: 'GET',
                  path: '/foo',
                  async: true,
                },
              },
            ],
          },
        },
      },
      command: 'deploy',
      lastLifecycleHookName: 'before:deploy:deploy',
    });

    expect(stdoutData.includes(msg)).to.be.equal(false);
  });
});
