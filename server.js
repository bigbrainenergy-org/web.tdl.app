// NOTE: ExpressJS wants the require syntax, idk why
/* eslint-disable @typescript-eslint/no-var-requires */
const
  express = require('express'),
  serveStatic = require('serve-static'),
  history = require('connect-history-api-fallback'),
  port = process.env.PORT || 5000
/* eslint-enable */

const app = express()

app.use(history())
app.use(serveStatic(__dirname + '/dist/spa'))
app.listen(port)
