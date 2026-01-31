import dotenv from 'dotenv'

const env = process.env.NODE_ENV || 'prod'

dotenv.config({ path: `.env.${env}` })
