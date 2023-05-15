import express from 'express'
import serveStatic from 'serve-static'
import history from 'connect-history-api-fallback'
const port = process.env.PORT || 5000

const app = express()

app.use(history())
app.use(serveStatic(__dirname + '/dist/pwa'))
app.listen(port)
