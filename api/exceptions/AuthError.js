import { RequestError } from "./RequestError.js"

export class AuthError extends RequestError {
    constructor(response, body) {
        super('Auth error', response, body)
        this.name = "AuthError"
    }
}