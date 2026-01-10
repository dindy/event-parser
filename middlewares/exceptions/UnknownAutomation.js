import AppError from "./AppError.js"

export default class UnknownAutomation extends AppError {
    constructor() {
        super("Automation does not exist")
        this.name = "UnknownAutomation"
        this.statusCode = 404
    }
}