import app from './app.mjs'

const port = process.env.APP_PORT || 3001

app.listen(port, () => {
  console.log(`Application listening on port ${port}!`)
})