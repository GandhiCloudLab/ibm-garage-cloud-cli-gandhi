import {Arguments, Argv} from 'yargs';
import {Container} from 'typescript-ioc';
import * as ora from 'ora';
import * as chalk from 'chalk';

import {Namespace, NamespaceOptionsModel} from '../services/namespace';
import {Logger, VerboseLogger} from '../util/logger';

export const command = 'pull-secret [namespace]';
export const desc = 'Copy pull secrets into the provided project from the template namespace';
export const builder = (yargs: Argv<any>) => {
  return yargs
    .positional('namespace', {
      require: false,
      describe: 'The namespace into which the pull-secret(s) will be created',
    })
    .option('templateNamespace', {
      alias: 't',
      describe: 'the template namespace that will be the source of the config',
      default: 'tools',
      type: 'string',
    })
    .option('serviceAccount', {
      alias: 'z',
      describe: 'the service account that will be used within the namespace',
      default: 'default',
      type: 'string',
    })
    .option('dev', {
      describe: 'flag to indicate this is a development namespace and that development artifacts should be created',
      type: 'boolean',
    })
    .option('verbose', {
      describe: 'flag to produce more verbose logging',
      type: 'boolean'
    })
};
exports.handler = async (argv: Arguments<NamespaceOptionsModel & {verbose: boolean}>) => {
  const namespaceBuilder: Namespace = Container.get(Namespace);

  if (!argv.namespace) {
    argv.namespace = await namespaceBuilder.getCurrentProject();
  }

  if (!argv.namespace) {
    console.log(chalk.red(`Please specify the namespace as the first argument. Run '${argv.$0} namespace --help' for more information`));
    process.exit(1);
  }

  console.log(`Setting up pull secrets in ${chalk.yellow(argv.namespace)}`);

  const spinner: Logger = argv.verbose ? new VerboseLogger() : ora('Setting up pull secrets: ' + argv.namespace).start();

  function statusCallback(status: string) {
    spinner.text = status;
  }

  try {
    return await namespaceBuilder.pullSecret(argv, statusCallback);
  } catch (err) {
    console.log('Error setting up secrets', err);
    process.exit(1);
  } finally {
    spinner.stop();
  }
};
