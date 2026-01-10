import AppError from "./AppError.js"

export default class InvalidCronSecret extends AppError {
    constructor() {
        super("Invalid password")
        this.name = "InvalidCronSecret"
        this.statusCode = 401
    }
}