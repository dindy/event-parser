import MobilizonApiError from "./exceptions/MobilizonApiError.mjs"
import { RequestError, BadRequestError, ExpiredTokenError, NetworkError } from "../api/exceptions/index.mjs"

export default (error, req, res, next) => { 

    if (error instanceof RequestError) {
        throw new MobilizonApiError(error);
    }

    next(error)
}