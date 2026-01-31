import AppError from "./AppError.js"

export default class MissingParameter extends AppError {
    constructor(paramName) {
        super(`Parameter ${paramName} is missing`)
        this.name = "MissingParameter"
        this.paramName = paramName
        this.statusCode = 400
    }

    getData() {
        return {
            ...(super.getData()),
            param_name: this.paramName
        }
    }
}