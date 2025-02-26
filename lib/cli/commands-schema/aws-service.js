'use strict';

const awsServiceOptions = require('./common-options/aws-service');
const serviceCommands = require('./service');

const commands = (module.exports = new Map());

commands.set('deploy', {
  usage: 'Deploy a Serverless service',
  options: {
    'conceal': {
      usage: 'Hide secrets from the output (e.g. API Gateway key values)',
      type: 'boolean',
    },
    'package': {
      usage: 'Path of the deployment package',
      shortcut: 'p',
    },
    'verbose': {
      usage: 'Show all stack events during deployment',
      shortcut: 'v',
      type: 'boolean',
    },
    'force': {
      usage: 'Forces a deployment to take place',
      type: 'boolean',
    },
    'function': {
      usage: "Function name. Deploys a single function. DEPRECATED: use 'deploy function' instead.",
      shortcut: 'f',
    },
    'aws-s3-accelerate': {
      usage: 'Enables S3 Transfer Acceleration making uploading artifacts much faster.',
      type: 'boolean',
    },
  },
  // TODO: Remove deprecated events with v3
  lifecycleEvents: [
    'deprecated#cleanup->package:cleanup',
    'deprecated#initialize->package:initialize',
    'deprecated#setupProviderConfiguration->package:setupProviderConfiguration',
    'deprecated#createDeploymentArtifacts->package:createDeploymentArtifacts',
    'deprecated#compileFunctions->package:compileFunctions',
    'deprecated#compileEvents->package:compileEvents',
    'deploy',
    'finalize',
  ],
  mainProgressTitles: new Map([
    ['before:package:cleanup', 'Packaging'],
    ['before:aws:deploy:deploy:createStack', 'Retrieving CloudFormation stack info'],
    ['before:aws:deploy:deploy:checkForChanges', 'Retrieving CloudFormation stack info'],
    ['before:aws:deploy:deploy:uploadArtifacts', 'Uploading'],
    ['before:aws:deploy:deploy:validateTemplate', 'Updating CloudFormation stack'],
    ['before:aws:info:validate', 'Retrieving CloudFormation stack info'],
    ['after:deploy:deploy', 'Updating'],
  ]),
});

commands.set('deploy function', {
  usage: 'Deploy a single function from the service',
  options: {
    'function': {
      usage: 'Name of the function',
      shortcut: 'f',
      required: true,
    },
    'force': {
      usage: 'Forces a deployment to take place',
      type: 'boolean',
    },
    'update-config': {
      usage: 'Updates function configuration, e.g. Timeout or Memory Size without deploying code',
      shortcut: 'u',
      type: 'boolean',
    },
  },
  lifecycleEvents: ['initialize', 'packageFunction', 'deploy'],
});

commands.set('deploy list', {
  usage: 'List deployed version of your Serverless Service',
  lifecycleEvents: ['log'],
});
commands.set('deploy list functions', {
  usage: 'List all the deployed functions and their versions',
  lifecycleEvents: ['log'],
});

commands.set('info', {
  usage: 'Display information about the service',
  options: {
    conceal: {
      usage: 'Hide secrets from the output (e.g. API Gateway key values)',
      type: 'boolean',
    },
    verbose: {
      usage: 'List stack outputs',
      shortcut: 'v',
      type: 'boolean',
    },
  },
  lifecycleEvents: ['info'],
});

commands.set('invoke', {
  usage: 'Invoke a deployed function',
  options: {
    function: {
      usage: 'The function name',
      required: true,
      shortcut: 'f',
    },
    qualifier: {
      usage: 'Version number or alias to invoke',
      shortcut: 'q',
    },
    path: {
      usage: 'Path to JSON or YAML file holding input data',
      shortcut: 'p',
    },
    type: {
      usage: 'Type of invocation',
      shortcut: 't',
    },
    log: {
      usage: 'Trigger logging data output',
      shortcut: 'l',
      type: 'boolean',
    },
    data: {
      usage: 'Input data',
      shortcut: 'd',
    },
    raw: {
      usage: 'Flag to pass input data as a raw string',
      type: 'boolean',
    },
    context: {
      usage: 'Context of the service',
    },
    contextPath: {
      usage: 'Path to JSON or YAML file holding context data',
    },
  },
  lifecycleEvents: ['invoke'],
});

commands.set('invoke local', {
  usage: 'Invoke function locally',
  options: {
    'function': {
      usage: 'Name of the function',
      shortcut: 'f',
      required: true,
    },
    'path': {
      usage: 'Path to JSON or YAML file holding input data',
      shortcut: 'p',
    },
    'data': {
      usage: 'input data',
      shortcut: 'd',
    },
    'raw': {
      usage: 'Flag to pass input data as a raw string',
      type: 'boolean',
    },
    'context': {
      usage: 'Context of the service',
    },
    'contextPath': {
      usage: 'Path to JSON or YAML file holding context data',
      shortcut: 'x',
    },
    'env': {
      usage: 'Override environment variables. e.g. --env VAR1=val1 --env VAR2=val2',
      shortcut: 'e',
      type: 'multiple',
    },
    'docker': { usage: 'Flag to turn on docker use for node/python/ruby/java', type: 'boolean' },
    'docker-arg': {
      usage: 'Arguments to docker run command. e.g. --docker-arg "-p 9229:9229"',
    },
  },
  lifecycleEvents: ['loadEnvVars', 'invoke'],
});

commands.set('logs', {
  usage: 'Output the logs of a deployed function',
  options: {
    function: {
      usage: 'The function name',
      required: true,
      shortcut: 'f',
    },
    tail: {
      usage: 'Tail the log output',
      shortcut: 't',
      type: 'boolean',
    },
    startTime: {
      usage:
        'Logs before this time will not be displayed. Default: `10m` (last 10 minutes logs only)',
    },
    filter: {
      usage: 'A filter pattern',
    },
    interval: {
      usage: 'Tail polling interval in milliseconds. Default: `1000`',
      shortcut: 'i',
    },
  },
  lifecycleEvents: ['logs'],
});

commands.set('metrics', {
  usage: 'Show metrics for a specific function',
  options: {
    function: {
      usage: 'The function name',
      shortcut: 'f',
    },
    startTime: {
      usage: 'Start time for the metrics retrieval (e.g. 1970-01-01)',
    },
    endTime: {
      usage: 'End time for the metrics retrieval (e.g. 1970-01-01)',
    },
  },
  lifecycleEvents: ['metrics'],
});

commands.set('remove', {
  usage: 'Remove Serverless service and all resources',
  options: {
    verbose: {
      usage: 'Show all stack events during deployment',
      shortcut: 'v',
      type: 'boolean',
    },
  },
  lifecycleEvents: ['remove'],
});

commands.set('rollback', {
  usage: 'Rollback the Serverless service to a specific deployment',
  options: {
    timestamp: {
      usage: 'Timestamp of the deployment (list deployments with `serverless deploy list`)',
      shortcut: 't',
      required: false,
    },
    verbose: {
      usage: 'Show all stack events during deployment',
      shortcut: 'v',
      type: 'boolean',
    },
  },
  lifecycleEvents: ['initialize', 'rollback'],
});

commands.set('rollback function', {
  usage: 'Rollback the function to the previous version',
  options: {
    'function': {
      usage: 'Name of the function',
      shortcut: 'f',
      required: true,
    },
    'function-version': {
      usage: 'Version of the function',
      required: true,
    },
  },
  lifecycleEvents: ['rollback'],
});

commands.set('studio', {
  usage: 'Develop a Serverless application in the cloud.',
  options: {
    autoStage: {
      usage: 'If specified, generate a random stage. This stage will be removed on exit.',
      shortcut: 'a',
      type: 'boolean',
    },
  },
  lifecycleEvents: ['studio'],
});

commands.set('test', {
  usage: 'Run HTTP tests',
  options: {
    function: {
      usage: 'Specify the function to test',
      shortcut: 'f',
    },
    test: {
      usage: 'Specify a specific test to run',
      shortcut: 't',
    },
  },
  lifecycleEvents: ['test'],
});

for (const schema of commands.values()) {
  schema.serviceDependencyMode = 'required';
  schema.hasAwsExtension = true;
  if (!schema.options) schema.options = {};
  for (const optionSchema of Object.values(schema.options)) {
    if (!optionSchema.type) optionSchema.type = 'string';
  }

  Object.assign(schema.options, awsServiceOptions);
}

for (const [name, schema] of serviceCommands) commands.set(name, schema);
