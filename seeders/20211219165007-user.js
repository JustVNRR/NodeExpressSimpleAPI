'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Users', [
      {
        pseudo: 'admin',
        login: 'admin@toto.com',
        password: 'admin',
        avatar: 'mystery-avatar.png',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date() 
      },
      {
        pseudo: 'user',
        login: 'user@toto.com',
        password: 'user',
        avatar: 'mystery-avatar.png',

        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date() 
      }

    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
