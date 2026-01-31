import { RequestError } from "./RequestError.mjs"

export class NetworkError extends RequestError {
    constructor(url, error) {
        super('Error fetching ' + url, null, null)
        console.log(error);
        this.name = "NetworkError"
    }
}