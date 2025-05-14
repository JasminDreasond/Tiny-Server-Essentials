class TinyExpress {
  /** @typedef {import('express').Application} ExpressApp */
  /** @typedef {import('express').Request} Request */
  /** @typedef {import('express').Response} Response */
  /** @typedef {import('express').NextFunction} NextFunction */
  #app;

  /**
   * Creates an instance of TinyExpress.
   *
   * @constructor
   * @param {ExpressApp} app
   */
  constructor(app, cs = console) {
    this.#app = app;
    this.console = cs;
  }

  installErrors(execute) {
    // Middleware 404 (caso nenhuma rota seja encontrada)
    this.#app.use(
      /** @type {function(Request, Response, NextFunction): void} */ (req, res, next) => {
        const err = new Error('Page not found');
        err.status = 404;
        next(err);
      },
    );

    // Middleware global de erro (pega qualquer erro)
    this.#app.use(
      /** @type {function(Error, Request, Response): void} */
      (err, req, res) => {
        this.console.error(err.stack);
        res.status(err.status);
        execute({
          message: err.message,
          status: err.status || 500,
          stack: process.env.NODE_ENV === 'development' ? err.stack : null,
        });
      },
    );
  }
}

export default TinyExpress;
