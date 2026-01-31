import { Sequelize, DataTypes, Model } from 'sequelize'
import { sequelize } from '../database/database.js'

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