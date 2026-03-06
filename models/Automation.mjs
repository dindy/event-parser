import { Sequelize, DataTypes, Model, where } from 'sequelize'
import { sequelize } from '../database/database.mjs'
import { Authorization } from './Authorization.mjs'
import { ImportedEvent } from './ImportedEvent.mjs'
import { AutomationLog } from './AutomationLog.mjs'
import { Application } from './Application.mjs'

export class Automation extends Model { }

Automation.init({
    authorizationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    attributedToId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    organizerActorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false,        
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,        
    },    
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },    
}, {
    modelName: 'automation',
    hooks: {
        beforeDestroy: async (automation, options) => {
            await AutomationLog.destroy({ where: { automationId: automation.id } })
            await ImportedEvent.destroy({ where: { automationId: automation.id } })
        }
    },
    sequelize,
})

Automation.belongsTo(Authorization)
Automation.hasMany(AutomationLog)
Automation.hasMany(ImportedEvent)
AutomationLog.belongsTo(Automation)
ImportedEvent.belongsTo(Automation)

export const exists = async (authorizationId, automationCriterias) => {
    
    return await Automation.findOne({
        where: {
            ...automationCriterias,
            authorizationId
        },
        include: {
            required: true,
            model: Authorization,
            include: {
                required: true,
                model: Application,
            } 
        }
    })
}

export const save = async automationData => await Automation.create({
    ...automationData
})

export const listActive = async () => await Automation.findAll({
    where: {
        active: true
    }
}) 

export const findAuthorized = async (authorizationId, automationCriterias) => {

    return await Automation.findAll({
        where: {
            ...automationCriterias,
            authorizationId
        },
        include: {
            required: true,
            model: Authorization,
            include: {
                required: true,
                model: Application,
            } 
        }
    })    
}

export const findById = async id => await Automation.findOne({
    where: {
        id
    }
})

export const destroy = async id => await Automation.destroy({
    where: {
        id
    },
    force: true,
    individualHooks: true,
})