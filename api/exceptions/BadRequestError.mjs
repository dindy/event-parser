import { RequestError } from "./RequestError.mjs"

export class BadRequestError extends RequestError {
    constructor(response, body) {
        super('Bad request body', response, body)
        this.name = "BadRequestError"
    }
}