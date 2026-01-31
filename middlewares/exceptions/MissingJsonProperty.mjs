import InvalidJsonBody from "./InvalidJsonBody.mjs"

export default class MissingJsonProperty extends InvalidJsonBody {
    constructor(propertyName) {
        super(`Property '${propertyName}' is missing`)
        this.name = "MissingJsonProperty"
        this.statusCode = 400
    }
}