import InvalidCronSecret from './exceptions/InvalidCronSecret.mjs'

export const cronSecretChecker = (req, res, next) => {
    
    if (!req.query.secret || req.query.secret !== process.env.CRON_SECRET) {
        throw new InvalidCronSecret
    }

    next()
}