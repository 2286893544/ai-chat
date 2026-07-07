import { spawn } from 'node:child_process';

const services = [
  {
    name: 'web-api-shared',
    command: 'pnpm',
    args: ['dev'],
  },
  {
    name: 'stt',
    command: 'pnpm',
    args: ['dev:stt'],
  },
];

const children = new Map();
let shuttingDown = false;
let exitCode = 0;

function isRunning(child) {
  return child.exitCode === null && child.signalCode === null;
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

console.log(`Starting all local services:
  Web:        http://localhost:5173
  API:        http://localhost:3001/health
  STT:        http://localhost:8001/health

Press Ctrl+C to stop all services.`);

for (const service of services) {
  const child = spawn(service.command, service.args, {
    stdio: 'inherit',
    shell: true,
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

process.on('SIGINT', () => {
  exitCode = 130;
  stopAll();
});

process.on('SIGTERM', () => {
  exitCode = 143;
  stopAll();
});
