import { Sequelize, DataTypes, Model } from 'sequelize'
import { sequelize } from '../database/database.mjs'

export class AutomationLog extends Model { }

AutomationLog.init({
    automationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    type: {
        type: DataTypes.ENUM(['info', 'error', 'warning', 'success']),
        allowNull: false,        
    },
    message: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'AutomationLog',   
})

/**
 * Returns AutomationLog items linked to an automationId, with pagination.
 * @param {number} automationId - The automation id to filter logs.
 * @param {number} [page=1] - The page number (1-based).
 * @param {number} [pageSize=20] - Number of items per page.
 * @returns {Promise<{rows: AutomationLog[], count: number}>}
 */
export async function getLogsByAutomationId(automationId, page = 1, pageSize = 20) {
    return await AutomationLog.findAndCountAll({
        where: { automationId },
        offset: (page - 1) * pageSize,
        limit: pageSize,
        order: [['createdAt', 'DESC']]
    });
}