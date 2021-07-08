'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Restaurant extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate (models) {
      // define association here
      Restaurant.belongsTo(models.Category)
      Restaurant.hasMany(models.Comment)
      Restaurant.belongsToMany(models.User, {
        through: models.Favorite,
        foreignKey: 'restaurantId',
        as: 'FavoritedUsers'
      })
      Restaurant.belongsToMany(models.User, {
        through: models.Like,
        foreignKey: 'restaurantId',
        as: 'LikedUsers'
      })
    }
  }
  Restaurant.init({
    name: DataTypes.STRING,
    tel: DataTypes.STRING,
    address: DataTypes.STRING,
    openingHours: DataTypes.STRING,
    description: DataTypes.TEXT,
    image: DataTypes.STRING,
    viewCount: DataTypes.INTEGER,
    categoryId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Restaurant',
    underscored: true
  })
  return Restaurant
}

// 以下是使用 sequelize.define 的版本
// 'use strict'
// module.exports = (sequelize, DataTypes) => {
//   const Restaurant = sequelize.define('Restaurant', {
//     name: DataTypes.STRING,
//     tel: DataTypes.STRING,
//     address: DataTypes.STRING,
//     openingHours: DataTypes.STRING,
//     description: DataTypes.TEXT,
//     image: DataTypes.STRING,
//     categoryId: DataTypes.INTEGER
//   }, {})
//   Restaurant.associate = function (models) {
//     // associations can be defined here
//     Restaurant.belongsTo(models.Category)
//   }
//   return Restaurant
// }
