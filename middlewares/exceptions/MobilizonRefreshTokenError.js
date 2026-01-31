import AppError from "./AppError.js"

export default class MobilizonRefreshTokenError extends AppError {
    constructor(message) {
        super(message)
        this.name = "MobilizonRefreshTokenError"
        this.statusCode = 401
    }
}