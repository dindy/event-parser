const path = require('path');
const express = require("express");
const cors = require('cors');
const { scrap } = require('./controllers/scrapper.js');

global.appRootDir = path.resolve(__dirname);
global.appDebugDir = global.appRootDir + '/debug/';

const app = express();
const port = 3001;

app.use(cors());
app.get("/scrap", scrap);
app.listen(port, () => {
  console.log(`App listening on port ${port}!`);
});
