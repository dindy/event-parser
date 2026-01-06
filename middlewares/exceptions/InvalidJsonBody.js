import AppError from "./AppError.js"

export default class InvalidJsonBody extends AppError {
    constructor(message) {
        super(message || "No JSON body")
        this.name = "InvalidJsonBody"
        this.statusCode = 400
    }
}