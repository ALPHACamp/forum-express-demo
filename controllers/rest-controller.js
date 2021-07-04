const db = require('../models')
const Restaurant = db.Restaurant
const Category = db.Category
const Comment = db.Comment
const User = db.User

const pageLimit = 9

const restController = {
  getRestaurants: (req, res, next) => {
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
        nest: true
      })
    ])
      .then(([restaurants, categories]) => {
        // data for pagination
        const page = Number(req.query.page) || 1
        const pages = Math.ceil(restaurants.count / pageLimit)
        const totalPage = Array.from({ length: pages }, (_, index) => index + 1)
        const prev = page - 1 < 1 ? 1 : page - 1
        const next = page + 1 > pages ? pages : page + 1

        // clean up restaurant data
        const data = restaurants.rows.map(r => ({
          ...r.dataValues,
          description: r.dataValues.description.substring(0, 50),
          categoryName: r.dataValues.Category.name,
          isFavorited: req.user.FavoritedRestaurants.some(d => d.id === r.id),
          isLiked: req.user.LikedRestaurants.some(d => d.id === r.id)
        }))

        res.render('restaurants', {
          restaurants: data,
          categories: categories,
          categoryId: categoryId,
          page: page,
          totalPage: totalPage,
          prev: prev,
          next: next
        })
      })
      .catch(err => next(err))
  },
  getRestaurant: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: User, as: 'FavoritedUsers' },
        { model: User, as: 'LikedUsers' },
        { model: Comment, include: [User] }
      ]
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")

        return restaurant.increment('viewCount')
      })
      .then(restaurant => {
        const isFavorited = restaurant.FavoritedUsers.some(f => f.id === req.user.id)
        const isLiked = restaurant.LikedUsers.some(l => l.id === req.user.id)
        res.render('restaurant', {
          restaurant: restaurant.toJSON(),
          isFavorited: isFavorited,
          isLiked: isLiked
        })
      })
      .catch(err => next(err))
  },
  getFeeds: (req, res, next) => {
    return Promise.all([
      Restaurant.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [Category],
        raw: true,
        nest: true
      }),
      Comment.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [User, Restaurant],
        raw: true,
        nest: true
      })
    ])
      .then(([restaurants, comments]) => {
        res.render('feeds', {
          restaurants: restaurants,
          comments: comments
        })
      })
      .catch(err => next(err))
  },
  getDashboard: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: Comment, include: [User] },
        { model: User, as: 'FavoritedUsers' }
      ]
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")

        res.render('dashboard', { restaurant: restaurant.toJSON() })
      })
      .catch(err => next(err))
  },
  getTopRestaurants: (req, res, next) => {
    return Restaurant.findAll({
      attributes: {
        include: [
          [
            db.Sequelize.literal(
              '(select count(*) from Favorites where Favorites.restaurant_id = Restaurant.id)'
            ),
            'favoritesCount'
          ]
        ]
      },
      order: [
        [db.Sequelize.literal('favoritesCount'), 'DESC']
      ],
      limit: 10,
      raw: true,
      nest: true
    })
      .then(restaurants => {
        restaurants = restaurants
          .map(rest => ({
            ...rest,
            isFavorited: req.user.FavoritedRestaurants.some(f => f.id === rest.id)
          }))
        res.render('topRestaurants', {
          restaurants: restaurants,
          isAuthenticated: req.isAuthenticated
        })
      })
      .catch(err => next(err))
  }

}

module.exports = restController
