import AppError from "./AppError.js"

export default class MissingToken extends AppError {
    constructor() {
        super("No authentication token found")
        this.name = "MissingToken"
        this.statusCode = 401
    }
}