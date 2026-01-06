import MobilizonApiError from "./exceptions/MobilizonApiError.js"
import { RequestError, BadRequestError, ExpiredTokenError, NetworkError } from "../api/exceptions/index.js"

export default (error, req, res, next) => { 

    if (error instanceof RequestError) {
        throw new MobilizonApiError(error);
    }

    next(error)
}