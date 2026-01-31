import AppError from "./AppError.mjs"

export default class AutomationAlreadyExists extends AppError {
    constructor() {
        super("Automation already exists")
        this.name = "AutomationAlreadyExists"
        this.statusCode = 400
    }
}