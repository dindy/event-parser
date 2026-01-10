import path from 'path'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'

import { scrap } from './middlewares/scrapper.js'
import { register, authorize } from './middlewares/auth.js'
import { queryInstance } from './middlewares/mobilizon.js'
import { tokenParser } from './middlewares/tokenParser.js'
import { fileURLToPath } from 'url'
import errorHandler from './middlewares/errorHandler.js'
import mobilizonApiErrorHandler from './middlewares/mobilizonApiErrorHandler.js'
import { forceAutomation, createAutomation, executeAutomations, getAutomations, getAutomationImportedEvents, getAutomationLogs } from './middlewares/automation.js'
import { cronSecretChecker } from './middlewares/cronSecretChecker.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

global.appRootDir = __dirname
global.appDebugDir = global.appRootDir + '/debug/'

const app = express()
const port = 3001
const jsonParser = bodyParser.json()
const rawParser = bodyParser.raw({
  inflate: true,
  limit: '1gb',
  type: '*/*'
})

app.use(cookieParser())
app.use(cors({origin: true, credentials: true}))
app.get("/scrap", scrap)
app.get("/auth/register", register)
app.post("/auth/authorize", jsonParser, authorize)
app.post("/mbz/query", rawParser, tokenParser, queryInstance)
app.post("/automate", tokenParser, jsonParser, createAutomation)
app.get("/automations", tokenParser, getAutomations)
app.get("/automation/:id/execute", tokenParser, forceAutomation)
app.get("/automation/:id/events", tokenParser, getAutomationImportedEvents)
app.get("/automation/:id/logs", tokenParser, getAutomationLogs)
app.get("/cron/automations", cronSecretChecker, executeAutomations)
app.use(mobilizonApiErrorHandler)
app.use(errorHandler)
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message)
  process.exit(1) // Exit to prevent an unstable state
})
// Handle unhandled promise rejections (async errors outside Express)
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err.message)
  process.exit(1)
})
app.listen(port, () => {
  console.log(`Application listening on port ${port}!`)
})
