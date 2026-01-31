import { RequestError } from "./RequestError.js"

export class BadRequestError extends RequestError {
    constructor(response, body) {
        super('Bad request body', response, body)
        this.name = "BadRequestError"
    }
}