import express from 'express';
import createHttpError from 'http-errors';

/**
 * @typedef {number} HttpStatusCode
 */

class TinyExpress {
  /** @typedef {import('express').Application} ExpressApp */
  /** @typedef {import('express').Request} Request */
  /** @typedef {import('express').Response} Response */
  /** @typedef {import('express').NextFunction} NextFunction */
  /** @typedef {import('http-errors').HttpError} HttpError */

  /** @type {string[]} */
  #domains = [];

  /**
   * Creates an instance of TinyExpress.
   *
   * @constructor
   * @param {ExpressApp} app
   */
  constructor(app = express()) {
    this.app = app;
  }

  /** @param {string} domain */
  addDomain(domain) {
    if (typeof domain !== 'string') throw new Error('aaahh');
    this.#domains.push(domain);
  }

  /**
   * @param {string} host
   * @return {boolean}
   */
  #validatorsExec(host) {
    for (const domain of this.#domains) if (host === domain) return true;
    return false;
  }

  /**
   * A list of domain validators using different request properties.
   *
   * Each property in this object represents a header or request property to check the domain against.
   * Each associated array contains one or more callback functions that validate or extract the domain.
   *
   * @type {{
   *   [key: string]: (req: import('express').Request) => boolean
   * }}
   */
  #validators = {
    'x-forwarded-host': (req) => {
      return typeof req.headers['x-forwarded-host'] === 'string'
        ? this.#validatorsExec(req.headers['x-forwarded-host'])
        : false;
    },
    hostname: (req) => {
      return typeof req.hostname === 'string'
        ? this.#validatorsExec(req.hostname)
        : typeof req.headers.host === 'string'
          ? this.#validatorsExec(req.headers.host)
          : false;
    },
  };

  /**
   * @param {Object} [options={}]
   * @param {string} [options.notFoundMsg='Page not found.']
   * @param {function(HttpStatusCode, HttpError, Request, Response): void} [options.errNext]
   */
  installErrors({
    notFoundMsg = 'Page not found.',
    errNext = (status, err, req, res) => {
      res.json({
        status,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : null,
      });
    },
  } = {}) {
    // Middleware 404
    this.app.use(
      /** @type {function(Request, Response, NextFunction): void} */ (req, res, next) => {
        const err = createHttpError(404, notFoundMsg);
        next(err);
      },
    );

    // Middleware global de erro
    this.app.use(
      /** @type {function(HttpError, Request, Response, NextFunction): void} */
      (err, req, res, next) => {
        const status = err.status || err.statusCode || 500;
        res.status(status);
        errNext(status, err, req, res);
      },
    );
  }
}

export default TinyExpress;
