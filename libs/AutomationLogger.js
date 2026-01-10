import { AutomationLog } from "../models/AutomationLog.js"

export default class AutomationLogger {

    automationId = null

    setAutomationId = (id) =>
    {
        this.automationId = id
    }

    log = async (type, message) =>
    {    
        await AutomationLog.create({
            automationId: this.automationId,
            type,
            message,
        })
    }

    error = async message => await this.log('error', message)
    success = async message => await this.log('success', message)
    info = async message => await this.log('info', message)
    warning = async message => await this.log('warning', message)
}