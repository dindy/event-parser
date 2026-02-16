import dotenv from 'dotenv'

const isDocker = process.env.IS_DOCKER || false

if (!isDocker) {
    const env = process.env.NODE_ENV || 'prod'
    dotenv.config({ path: `.env.${env}` })
}
