const db = require('../models')
const Restaurant = db.Restaurant
const Category = db.Category
const Comment = db.Comment
const User = db.User
const Favorite = db.Favorite

const pageLimit = 10

const restController = {
  getRestaurants: (req, res) => {
    let offset = 0
    const whereQuery = {}
    let categoryId = ''
    if (req.query.page) {
      offset = (req.query.page - 1) * pageLimit
    }
    if (req.query.categoryId) {
      categoryId = Number(req.query.categoryId)
      whereQuery.categoryId = categoryId
    }
    return Promise.all([
      Restaurant.findAndCountAll({
        include: [Category],
        where: whereQuery,
        offset: offset,
        limit: pageLimit
      }),
      Category.findAll({
        raw: true,
        nest: true,
      })
    ])
      .then(([restaurants, categories]) => {
        // data for pagination
        const page = Number(req.query.page) || 1
        const pages = Math.ceil(restaurants.count / pageLimit)
        const totalPage = Array.from({ length: pages }).map((item, index) => index + 1)
        const prev = page - 1 < 1 ? 1 : page - 1
        const next = page + 1 > pages ? pages : page + 1

        // clean up restaurant data
        const data = restaurants.rows.map(r => ({
          ...r.dataValues,
          description: r.dataValues.description.substring(0, 50),
          categoryName: r.dataValues.Category.name,
          isFavorited: req.user.FavoritedRestaurants.map(d => d.id).includes(r.id),
          isLiked: req.user.LikedRestaurants.map(d => d.id).includes(r.id)
        }))

        return res.render('restaurants', {
          restaurants: data,
          categories: categories,
          categoryId: categoryId,
          page: page,
          totalPage: totalPage,
          prev: prev,
          next: next
        })
      })
  },
  getRestaurant: (req, res) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: User, as: 'FavoritedUsers' },
        { model: User, as: 'LikedUsers' },
        { model: Comment, include: [User] }
      ]
    }).then(restaurant => {
      restaurant.viewCounts += 1
      return restaurant.save()
    }).then(restaurant => {
      const isFavorited = restaurant.FavoritedUsers.map(d => d.id).includes(req.user.id)
      const isLiked = restaurant.LikedUsers.map(d => d.id).includes(req.user.id)
      return res.render('restaurant', {
        restaurant: restaurant.toJSON(),
        isFavorited: isFavorited,
        isLiked: isLiked
      })
    })
  },
  getFeeds: (req, res) => {
    return Promise.all([
      Restaurant.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [Category],
        raw: true,
        nest: true,
      }),
      Comment.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [User, Restaurant],
        raw: true,
        nest: true,
      })
    ]).then(([restaurants, comments]) => {
      return res.render('feeds', {
        restaurants: restaurants,
        comments: comments
      })
    })
  },
  getDashboard: (req, res) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: Comment, include: [User] },
        { model: User, as: 'FavoritedUsers' },
      ]
    }).then(restaurant => {
      return res.render('dashboard', { restaurant: restaurant.toJSON() })
    })
  },
  getTopRestaurants: (req, res) => {
    return Restaurant.findAll({
      attributes: {
        include: [
          [
            db.Sequelize.literal(`(
              SELECT COUNT(*)
              FROM Favorites
              WHERE favorites.restaurant_id = restaurant.id
            )`),
            'favoritesCount',
          ],
        ]
      },
      order: [
        [db.Sequelize.literal('favoritesCount'), 'DESC']
      ],
      limit: 10,
      nest: true,
    })
      .then(restaurants => {
        restaurants = restaurants
          .map(rest => (
            {
              ...rest.dataValues,
              description: rest.description.substring(0, 50),
              isFavorited: req.user.FavoritedRestaurants.map(f => f.id).includes(rest.id)
            }
          ))
        return res.render('topRestaurants', {
          restaurants: restaurants,
          isAuthenticated: req.isAuthenticated
        })
      })
  }

}

module.exports = restController
