import AppError from "./AppError.mjs"

export default class InvalidRequest extends AppError {
    constructor(message) {
        super(message || "Invalid request")
        this.name = "InvalidRequest"
        this.statusCode = 400
    }
}