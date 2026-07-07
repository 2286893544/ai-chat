import { spawn } from 'node:child_process';
import net from 'node:net';

const DEFAULT_WEB_PORT = 5173;
const API_PORT = Number(process.env.PORT || 3001);
const STT_PORT = 8001;

const children = new Map();
const skippedServices = [];
let shuttingDown = false;
let exitCode = 0;

function isRunning(child) {
  return child.exitCode === null && child.signalCode === null;
}

function isPortFreeOnHost(port, host) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

async function isPortFree(port) {
  const results = await Promise.all([
    isPortFreeOnHost(port, '127.0.0.1'),
    isPortFreeOnHost(port, '::1'),
    isPortFreeOnHost(port, '0.0.0.0'),
    isPortFreeOnHost(port, '::'),
  ]);
  return results.every(Boolean);
}

async function findFreePort(startPort) {
  for (let port = startPort; port < startPort + 20; port += 1) {
    if (await isPortFree(port)) {
      return port;
    }
  }

  throw new Error(`No free port found from ${startPort} to ${startPort + 19}`);
}

function startService(service) {
  const child = spawn(service.command, service.args, {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      ...service.env,
    },
  });

  children.set(service.name, child);

  child.on('exit', (code, signal) => {
    if (!shuttingDown) {
      exitCode = code ?? (signal ? 1 : 0);
      stopAll();
    }

    finish();
  });
}

function stopAll() {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children.values()) {
    if (isRunning(child)) {
      child.kill('SIGTERM');
    }
  }

  setTimeout(() => {
    for (const child of children.values()) {
      if (isRunning(child)) {
        child.kill('SIGKILL');
      }
    }
  }, 3000).unref();
}

function finish() {
  if ([...children.values()].every((child) => child.exitCode !== null || child.signalCode !== null)) {
    process.exit(exitCode);
  }
}

const webPort = await findFreePort(DEFAULT_WEB_PORT);
const apiAvailable = await isPortFree(API_PORT);
const sttAvailable = await isPortFree(STT_PORT);

const services = [
  {
    name: 'shared',
    command: 'pnpm',
    args: ['--dir', 'packages/shared', 'dev'],
  },
  {
    name: 'web',
    command: 'pnpm',
    args: ['--dir', 'apps/web', 'dev', '--port', String(webPort)],
  },
];

if (apiAvailable) {
  services.push({
    name: 'api',
    command: 'pnpm',
    args: ['--dir', 'apps/server', 'dev'],
  });
} else {
  skippedServices.push(`API port ${API_PORT} is already in use; reusing existing API service.`);
}

if (sttAvailable) {
  services.push({
    name: 'stt',
    command: 'pnpm',
    args: ['dev:stt'],
  });
} else {
  skippedServices.push(`STT port ${STT_PORT} is already in use; reusing existing STT service.`);
}

console.log(`Starting local services:
  Web:        http://localhost:${webPort}
  API:        http://localhost:${API_PORT}/health${apiAvailable ? '' : ' (existing)'}
  STT:        http://localhost:${STT_PORT}/health${sttAvailable ? '' : ' (existing)'}

Press Ctrl+C to stop services started by this command.`);

if (skippedServices.length > 0) {
  console.log('');
  for (const message of skippedServices) {
    console.log(`- ${message}`);
  }
}

for (const service of services) {
  startService(service);
}

process.on('SIGINT', () => {
  exitCode = 130;
  stopAll();
});

process.on('SIGTERM', () => {
  exitCode = 143;
  stopAll();
});
