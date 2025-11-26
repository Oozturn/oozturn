import pinoHttp from "pino-http";
import pino from 'pino';

const __dirname = import.meta.dirname;

const transport = pino.transport({
  targets: [
    {
      level: 10,
      target: 'pino-roll',
      options: {
        file: `${__dirname}/logs/server.log`,
        frequency: 'daily',
        mkdir: true,
        size: 20,
        limit: { count: 3, removeOtherLogFiles: true }
      }
    },
    {
      level: process.env.LOG_LEVEL || 30,
      target: 'pino-pretty',
      options: {
        ignore: "hostname,req,res,responseTime,err",
      },
    },
  ],
});

export const pinoLogger = pino(
  {
    level: 10,
  },
  transport
)

export const httpLogger = pinoHttp({

  // Reuse an existing logger instance
  logger: pinoLogger,

  customSuccessMessage: function (_, res) {
    return `${res.req.ip} - ${res.req.method} ${res.req.url} - ${res.statusCode}`;
  },

  customLogLevel: function (_, res, err) {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn'
    } else if (res.statusCode >= 500 || err) {
      return 'error'
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      return 'silent'
    }
    return 'trace'
  },
})