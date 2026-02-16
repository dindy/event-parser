import '../dotenv.mjs'

const config = {
    "username": process.env.MYSQL_USER,
    "password": process.env.MYSQL_PASSWORD,
    "database": process.env.MYSQL_DB,
    "host": process.env.MYSQL_HOST,
    "dialect": "mysql"
}

export default {
    [process.env.NODE_ENV || 'prod']: config,
}