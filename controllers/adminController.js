const db = require('../models')
const Restaurant = db.Restaurant
const User = db.User
const Category = db.Category

const imgur = require('imgur')
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID

imgur.setClientId(IMGUR_CLIENT_ID)

const adminController = {
  getRestaurants: (req, res) => {
    return Restaurant.findAll({
      raw: true,
      nest: true,
      include: [Category]
    })
      .then(restaurants => {
        // console.log(restaurants) // 加入 console 觀察資料的變化
        return res.render('admin/restaurants', { restaurants: restaurants })
      })
  },
  createRestaurant: (req, res) => {
    return Category.findAll({
      raw: true,
      nest: true,
    })
      .then(categories => res.render('admin/create', {
        categories: categories
      }))
  },
  postRestaurant: (req, res) => {
    if (!req.body.name) {
      req.flash('error_messages', "name didn't exist")
      return res.redirect('back')
    }

    const { file } = req
    if (file) {
      imgur
        .uploadFile(file.path)
        .then(img => Restaurant.create({
          name: req.body.name,
          tel: req.body.tel,
          address: req.body.address,
          openingHours: req.body.openingHours,
          description: req.body.description,
          image: file ? img.link : null,
          categoryId: req.body.categoryId
        }))
        .then(() => {
          req.flash('success_messages', 'restaurant was successfully created')
          return res.redirect('/admin/restaurants')
        })
    } else {
      return Restaurant.create({
        name: req.body.name,
        tel: req.body.tel,
        address: req.body.address,
        openingHours: req.body.openingHours,
        description: req.body.description,
        image: null,
        categoryId: req.body.categoryId
      }).then(() => {
        req.flash('success_messages', 'restaurant was successfully created')
        return res.redirect('/admin/restaurants')
      })
    }
  },
  getRestaurant: (req, res) => {
    return Restaurant.findByPk(req.params.id, {
      include: [Category]
    }).then(restaurant => {
      // console.log(restaurant) // 加入 console 觀察資料的變化
      return res.render('admin/restaurant', {
        restaurant: restaurant.toJSON()
      })
    })
  },
  editRestaurant: (req, res) => {
    Promise.all([
      Restaurant.findByPk(req.params.id),
      Category.findAll({
        raw: true,
        nest: true,
      })
    ])
      .then(([restaurant, categories]) => res.render('admin/create', {
        restaurant: restaurant.toJSON(),
        categories: categories
      }))
  },
  putRestaurant: (req, res) => {
    if (!req.body.name) {
      req.flash('error_messages', "name didn't exist")
      return res.redirect('back')
    }

    const { file } = req

    return Promise.all([
      Restaurant.findByPk(req.params.id),
      file && imgur.uploadFile(file.path)
    ])
      .then(([restaurant, img]) => restaurant.update({
        name: req.body.name,
        tel: req.body.tel,
        address: req.body.address,
        openingHours: req.body.openingHours,
        description: req.body.description,
        image: file ? img.link : restaurant.image,
        categoryId: req.body.categoryId
      }))
      .then(() => {
        req.flash(
          'success_messages',
          'restaurant was successfully to update',
        )
        res.redirect('/admin/restaurants')
      })
  },
  deleteRestaurant: (req, res) => {
    return Restaurant.findByPk(req.params.id)
      .then(restaurant => restaurant.destroy())
      .then(() => res.redirect('/admin/restaurants'))
  },
  getUsers: (req, res) => {
    return User.findAll({
      raw: true,
      nest: true,
    })
      .then(users => res.render('admin/users', {
        users: users
      }))
  },
  putUsers: (req, res) => {
    return User.findByPk(req.params.id)
      .then(user => {
        const isAdmin = !user.isAdmin
        return user.update({ isAdmin })
      })
      .then(() => {
        req.flash('success_messages', 'user was successfully to update')
        res.redirect('/admin/users')
      })
  },
}

module.exports = adminController
