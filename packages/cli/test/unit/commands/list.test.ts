import { client } from '../../mocks/client';
import { useUser } from '../../mocks/user';
import list from '../../../src/commands/list';
import { join } from 'path';
import { useTeams } from '../../mocks/team';
import { defaultProject, useProject } from '../../mocks/project';
import { useDeployment } from '../../mocks/deployment';
import ms from 'ms';
import chalk from 'chalk';

const fixture = (name: string) =>
  join(__dirname, '../../fixtures/unit/commands/list', name);

describe('list', () => {
  const originalCwd = process.cwd();

  it('should exit if directory is not linked to a project', async () => {
    const user = useUser();
    client.setArgv('ls', '-S', user.username);
    const exitCode = await list(client);
    expect(exitCode).toEqual(0);
    expect(client.mockOutput.mock.calls[0][0]).toEqual(
      "Looks like this directory isn't linked to a Vercel deployment. Please run `vercel link` to link it."
    );
  });
  it('should get deployments from a project linked by a directory', async () => {
    const cwd = fixture('project');
    try {
      process.chdir(cwd);
      const user = useUser();
      useTeams('team_MtLD9hKuWAvoDd3KmiHs9zUg');
      useProject({
        ...defaultProject,
        id: 'prj_Am19DF8JBL9g89tn4RdDVD59axFi',
        name: 'prj_Am19DF8JBL9g89tn4RdDVD59axFi',
      });
      const deployment = useDeployment({ creator: user });

      await list(client);

      const header: Array<string> = formatOutput(
        client.outputBuffer.split('\n')[3]
      );

      const data = formatOutput(client.outputBuffer.split('\n')[4]);
      data.shift();

      expect(header).toEqual([
        'age',
        'deployment url',
        'state',
        'duration',
        'username',
      ]);

      expect(data).toEqual([
        `https://${deployment.url}`,
        stateString(deployment.state || ''),
        getDeploymentDuration(deployment),
        user.name,
      ]);
    } finally {
      process.chdir(originalCwd);
    }
  });
});

function formatOutput(output: string): Array<string> {
  return output
    .trim()
    .replace(/ {3} +/g, ',')
    .split(',');
}

function stateString(s: string) {
  const CIRCLE = '● ';
  // make `s` title case
  s = `${s.substring(0, 1)}${s.toLowerCase().substring(1)}`;
  switch (s.toUpperCase()) {
    case 'INITIALIZING':
    case 'BUILDING':
    case 'DEPLOYING':
    case 'ANALYZING':
      return chalk.yellow(CIRCLE) + s;

    case 'ERROR':
      return chalk.red(CIRCLE) + s;

    case 'READY':
      return chalk.green(CIRCLE) + s;

    case 'QUEUED':
      return chalk.white(CIRCLE) + s;

    case 'CANCELED':
      return chalk.gray(s);

    default:
      return chalk.gray('UNKNOWN');
  }
}

function getDeploymentDuration(dep: any): string {
  if (!dep || !dep.ready || !dep.buildingAt) {
    return '?';
  }
  const duration = ms(dep.ready - dep.buildingAt);
  if (duration === '0ms') {
    return '--';
  }
  return duration;
}
