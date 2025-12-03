import path from 'path';
import express from 'express';
import cors from 'cors';
import { scrap } from './controllers/scrapper.js';
import { login } from './controllers/auth.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

global.appRootDir = __dirname;
global.appDebugDir = global.appRootDir + '/debug/';

const app = express();
const port = 3001;

app.use(cors());
app.get("/scrap", scrap);
app.get("/login", login);
app.listen(port, () => {
  console.log(`App listening on port ${port}!`);
});
