import { AutomationLog } from "../models/AutomationLog.mjs"

export default class AutomationLogger {

    automationId = null

    log = async (type, message, automationId) =>
    {    
        await AutomationLog.create({
            automationId,
            type,
            message,
        })
    }

    error = async (...args) => await this.log('error', ...args)
    success = async (...args) => await this.log('success', ...args)
    info = async (...args) => await this.log('info', ...args)
    warning = async (...args) => await this.log('warning', ...args)
}