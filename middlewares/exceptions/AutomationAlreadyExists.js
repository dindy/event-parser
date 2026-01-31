import AppError from "./AppError.js"

export default class AutomationAlreadyExists extends AppError {
    constructor() {
        super("Automation already exists")
        this.name = "AutomationAlreadyExists"
        this.statusCode = 400
    }
}