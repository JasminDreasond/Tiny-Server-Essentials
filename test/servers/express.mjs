import TinyWeb from '../../dist/index.mjs';
import insertExpress from './templates/express.mjs';

const startExpressServer = () => {
  const http = new TinyWeb.Express();
  http.init();
  const app = http.getRoot();

  // Start express
  insertExpress(app, http);

  http.getServer().listen(3050, () => {
    console.log('Server is up on port 3050');
  });
};

export default startExpressServer;
