import AppError from "./AppError.mjs"

export default class InvalidToken extends AppError {
    constructor() {
        super("Invalid token")
        this.name = "InvalidToken"
        this.statusCode = 401
    }
}