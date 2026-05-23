import app from './app.mjs'
import proxy from './proxy.mjs'

const appPort = 3001

// Start the application server that will receive all requests from the web app (client).
app.listen(appPort, () => {
  console.log(`Application server is listening on port ${appPort}!`)
})

// Start the proxy that will receive requests from the web scrapper of the application server and decide whether to use the real proxy or not based on the environment variables and the request hostname.
proxy.listen(() => { })