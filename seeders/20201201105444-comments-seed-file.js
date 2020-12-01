'use strict'
const faker = require('faker')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Comments',
      [...Array(150)].map((item, index) => index).map(i =>
        ({
          id: i + 1,
          text: faker.lorem.sentence(),
          UserId: Math.floor(Math.random() * 3) * 10 + 1,
          RestaurantId: (i % 50) * 10 + 1,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      ), {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Comments', null, {})
  }
}
