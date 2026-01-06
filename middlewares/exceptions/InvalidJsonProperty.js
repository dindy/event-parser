import InvalidJsonBody from "./InvalidJsonBody.js"

export default class InvalidJsonProperty extends InvalidJsonBody {
    constructor(propertyName, propertyValue = undefined) {
        const message = (typeof propertyValue === 'undefined')
            ? `Property '${propertyName}' is missing`
            : `Value '${propertyValue}' for property '${propertyName}' is invalid`
        super(message)
        this.name = "InvalidJsonProperty"
        this.statusCode = 400
        propertyName = this.propertyName
        propertyValue = this.propertyValue
    }
}