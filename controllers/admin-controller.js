const db = require('../models')
const Restaurant = db.Restaurant
const User = db.User
const Category = db.Category

const imgur = require('imgur')
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID

imgur.setClientId(IMGUR_CLIENT_ID)

const adminController = {
  getRestaurants: (req, res, next) => {
    return Restaurant.findAll({
      raw: true,
      nest: true,
      include: [Category]
    })
      .then(restaurants => {
        // console.log(restaurants) // 加入 console 觀察資料的變化
        res.render('admin/restaurants', { restaurants: restaurants })
      })
      .catch(err => next(err))
  },
  createRestaurant: (req, res, next) => {
    return Category.findAll({
      raw: true,
      nest: true
    })
      .then(categories => res.render('admin/create', {
        categories: categories
      }))
      .catch(err => next(err))
  },
  postRestaurant: (req, res, next) => {
    const { name, tel, address, openingHours, description, categoryId } = req.body
    if (!name) throw new Error('Restaurant name is required!')

    const { file } = req

    Promise.resolve(file ? imgur.uploadFile(file.path) : null)
      .then(img => Restaurant.create({
        name: name,
        tel: tel,
        address: address,
        openingHours: openingHours,
        description: description,
        image: img ? img.link : null,
        categoryId: categoryId
      }))
      .then(() => {
        req.flash('success_messages', 'restaurant was successfully created')
        res.redirect('/admin/restaurants')
      })
      .catch(err => next(err))
  },
  getRestaurant: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: [Category]
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        // console.log(restaurant) // 加入 console 觀察資料的變化
        res.render('admin/restaurant', {
          restaurant: restaurant.toJSON()
        })
      })
      .catch(err => next(err))
  },
  editRestaurant: (req, res, next) => {
    Promise.all([
      Restaurant.findByPk(req.params.id),
      Category.findAll({
        raw: true
      })
    ])
      .then(([restaurant, categories]) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")

        res.render('admin/edit', {
          restaurant: restaurant.toJSON(),
          categories: categories
        })
      })
      .catch(err => next(err))
  },
  putRestaurant: (req, res, next) => {
    const { name, tel, address, openingHours, description, categoryId } = req.body

    if (!name) throw new Error('Restaurant name is required!')

    const { file } = req

    // const promiseArray = [ Restaurant.findByPk(req.params.id) ]
    // if (file) promiseArray.push(imgur.uploadFile(file.path))

    // return Promise.all(promiseArray)

    return Promise.all([
      Restaurant.findByPk(req.params.id),
      file ? imgur.uploadFile(file.path) : null
    ])
      .then(([restaurant, img]) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")

        return restaurant.update({
          name: name,
          tel: tel,
          address: address,
          openingHours: openingHours,
          description: description,
          image: img ? img.link : restaurant.image,
          categoryId: categoryId
        })
      })
      .then(() => {
        req.flash(
          'success_messages',
          'restaurant was successfully to update'
        )
        res.redirect('/admin/restaurants')
      })
      .catch(err => next(err))
  },
  deleteRestaurant: (req, res, next) => {
    return Restaurant.findByPk(req.params.id)
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")

        return restaurant.destroy()
      })
      .then(() => res.redirect('/admin/restaurants'))
      .catch(err => next(err))
  },
  getUsers: (req, res, next) => {
    return User.findAll({
      raw: true,
      nest: true
    })
      .then(users => res.render('admin/users', {
        users: users
      }))
      .catch(err => next(err))
  },
  putUsers: (req, res, next) => {
    return User.findByPk(req.params.id)
      .then(user => {
        if (!user) throw new Error("User didn't exist!")

        return user.update({ isAdmin: !user.isAdmin })
      })
      .then(() => {
        req.flash('success_messages', 'user was successfully to update')
        res.redirect('/admin/users')
      })
      .catch(err => next(err))
  }
}

module.exports = adminController
