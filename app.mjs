import './dotenv.mjs'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'

import { scrap } from './middlewares/scrapper.mjs'
import { register, authorize } from './middlewares/auth.mjs'
import { queryInstance } from './middlewares/mobilizon.mjs'
import { tokenParser } from './middlewares/tokenParser.mjs'
import errorHandler from './middlewares/errorHandler.mjs'
import mobilizonApiErrorHandler from './middlewares/mobilizonApiErrorHandler.mjs'
import {
  deleteAutomation, 
  forceAutomation, 
  createAutomation, 
  executeAutomations, 
  getAutomations, 
  getAutomationHistory
} from './middlewares/automation.mjs'
import { cronSecretChecker } from './middlewares/cronSecretChecker.mjs'
import cluster from './libs/scrappers/page-scrapper/cluster.mjs'

const app = express()
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
app.post("/automation", tokenParser, jsonParser, createAutomation)
app.get("/automations", tokenParser, getAutomations)
app.get("/automation/:id/execute", tokenParser, forceAutomation)
app.get("/automation/:id/history", tokenParser, getAutomationHistory)
app.get("/automation/:id/delete", tokenParser, deleteAutomation)
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

export default app