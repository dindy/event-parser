'use strict';
/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Applications', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      name: {
          type: Sequelize.STRING
      },    
      domain: {
          type: Sequelize.STRING,
          allowNull: false,
      },
      scope: {
          type: Sequelize.STRING
      },
      clientId: {
          type: Sequelize.STRING,
      },
      clientSecret: {
          type: Sequelize.STRING,
      }        
    });
    await queryInterface.createTable('Authorizations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      applicationId: {
          type: Sequelize.INTEGER,
          allowNull: false,
      },
      mobilizonUserId: {
          type: Sequelize.INTEGER,
          allowNull: true,
      },
      accessToken: {
          type: Sequelize.STRING(511),
          allowNull: true,
      },
      refreshToken: {
          type: Sequelize.STRING(511),
          allowNull: true,
      },
      expiresIn: {
          type: Sequelize.INTEGER,
          allowNull: true,
      },
      refreshTokenExpiresIn: {
          type: Sequelize.INTEGER,
          allowNull: true,
      },
      scope: {
          type: Sequelize.STRING,
          allowNull: true,
      },    
      hash: {
          type: Sequelize.STRING,
          allowNull: false,        
      }      
    });
    await queryInterface.createTable('Automations', {    
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      authorizationId: {
          type: Sequelize.INTEGER,
          allowNull: false,
      },
      attributedToId: {
          type: Sequelize.INTEGER,
          allowNull: true,
      },
      organizerActorId: {
          type: Sequelize.INTEGER,
          allowNull: false,
      },
      url: {
          type: Sequelize.STRING,
          allowNull: false,        
      },
      type: {
          type: Sequelize.STRING,
          allowNull: false,        
      },    
      active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
      },         
    });
    await queryInterface.createTable('AutomationLogs', {    
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      automationId: {
          type: Sequelize.INTEGER,
          allowNull: false,
      },
      type: {
          type: Sequelize.ENUM(['info', 'error', 'warning', 'success']),
          allowNull: false,        
      },
      message: {
          type: Sequelize.TEXT,
          allowNull: false,
      },      
    });
    await queryInterface.createTable('ImportedEvents', {    
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      automationId: {
          type: Sequelize.INTEGER,
          allowNull: false,
      },
      uid: {
          type: Sequelize.STRING,
          allowNull: false,
      },
      mbzUid: {
          type: Sequelize.STRING,
          allowNull: false,
      },
      mbzId: {
          type: Sequelize.INTEGER,
          allowNull: false,
      },
      hash: {
          type: Sequelize.STRING,
          allowNull: false,
      },
      title: {
          type: Sequelize.STRING,
          allowNull: false,        
      }      
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Applications');
    await queryInterface.dropTable('Authorizations');
    await queryInterface.dropTable('Automations');
    await queryInterface.dropTable('AutomationLogs');
    await queryInterface.dropTable('ImportedEvents');
  }
};