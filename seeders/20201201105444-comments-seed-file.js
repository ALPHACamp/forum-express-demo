'use strict'
const faker = require('faker')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const users = await queryInterface.sequelize.query(
      `SELECT id from Users;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const restaurants = await queryInterface.sequelize.query(
      `SELECT id from Restaurants;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    await queryInterface.bulkInsert('Comments',
      [...Array(150)].map((item, index) => index).map(i =>
      ({
        id: i + 1,
        text: faker.lorem.sentence(),
        user_id: users[Math.floor(Math.random() * users.length)].id,
        restaurant_id: restaurants[Math.floor(Math.random() * restaurants.length)].id,
        created_at: new Date(),
        updated_at: new Date()
      })
      ), {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Comments', null, {})
  }
}
