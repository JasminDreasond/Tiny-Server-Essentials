import TinyWebEssentials from '../dist/index.mjs';
import startAllServer from './servers/all.mjs';
import startExpressServer from './servers/express.mjs';
import startSocketServer from './servers/socket.mjs';

const actions = {
  all: startAllServer,
  express: startExpressServer,
  socket: startSocketServer,
};

(async () => {
  const arg = process.argv[2];
  if (!arg) console.log(TinyWebEssentials);
  // Execute args
  if (actions[arg]) await actions[arg]();
  // Fail
  else {
    console.error(`Unknown argument: ${arg}`);
    console.error(`Valid arguments are: ${Object.keys(actions).join(', ')}`);
    process.exit(1);
  }
})();
