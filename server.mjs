import app from './app.mjs'

const port = 3001

app.listen(port, () => {
  console.log(`Application listening on port ${port}!`)
})