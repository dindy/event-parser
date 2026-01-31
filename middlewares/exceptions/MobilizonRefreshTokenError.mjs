import AppError from "./AppError.mjs"

export default class MobilizonRefreshTokenError extends AppError {
    constructor(message) {
        super(message)
        this.name = "MobilizonRefreshTokenError"
        this.statusCode = 401
    }
}