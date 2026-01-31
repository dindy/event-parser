import AppError from "./AppError.js"

export default class InvalidParameter extends AppError {
    constructor(paramName, paramValue) {
        super(`Value '${paramValue}' for parameter ${paramName} is invalid.`)
        this.name = "InvalidParameter"
        this.paramName = paramName
        this.paramValue = paramValue
        this.statusCode = 400
    }

    getData() {
        return {
            ...(super.getData()),
            param_name: this.paramName,
            param_value: this.paramValue,
        }
    }
}