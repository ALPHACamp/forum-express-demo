const bcrypt = require('bcryptjs')
const db = require('../models')
const User = db.User
const Restaurant = db.Restaurant
const Comment = db.Comment
const Favorite = db.Favorite
const Like = db.Like
const Followship = db.Followship

const imgur = require('imgur')
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID

imgur.setClientId(IMGUR_CLIENT_ID)

const userController = {
  signUpPage: (req, res, next) => {
    res.render('signup')
  },
  signUp: (req, res, next) => {
    // confirm password
    if (req.body.passwordCheck !== req.body.password) throw new Error('兩次密碼輸入不同！')

    return User.findOne({ where: { email: req.body.email } })
      .then(user => {
        // confirm unique user
        if (user) throw new Error('信箱重複！')
        // bcrypt.hash(myPlaintextPassword, saltRounds)
        return bcrypt.hash(req.body.password, 10)
      })
      .then(hash => User.create({
        name: req.body.name,
        email: req.body.email,
        password: hash
      }))
      .then(() => {
        req.flash('success_messages', '成功註冊帳號！')
        res.redirect('/signin')
      })
      .catch(err => next(err))
  },
  signInPage: (req, res, next) => {
    res.render('signin')
  },
  signIn: (req, res, next) => {
    req.flash('success_messages', '成功登入！')
    res.redirect('/restaurants')
  },
  logout: (req, res, next) => {
    req.flash('success_messages', '登出成功！')
    req.logout()
    res.redirect('/signin')
  },

  getUser: (req, res, next) => {
    return User.findByPk(req.params.id, {
      include: [
        { model: Comment, include: Restaurant },
        { model: Restaurant, as: 'FavoritedRestaurants' },
        { model: User, as: 'Followers' },
        { model: User, as: 'Followings' }
      ]
    })
      .then(user => {
        if (!user) throw new Error("User didn't exist!")

        user = user.toJSON()
        // arr.reduce(callback[accumulator, currentValue, currentIndex, array], initialValue)
        user.CommentsRestaurants = user.Comments.reduce((acc, c) => {
          if (!acc.some(r => r.id === c.restaurantId)) {
            acc.push(c.Restaurant)
          }
          return acc
        }, [])
        const isFollowed = req.user.Followings.some(d => d.id === user.id)
        res.render('users/profile', {
          profile: user,
          isFollowed: isFollowed
        })
      })
      .catch(err => next(err))
  },
  editUser: (req, res, next) => {
    return User.findByPk(req.params.id)
      .then(user => {
        if (!user) throw new Error("User didn't exist!")

        res.render('users/edit', { user: user.toJSON() })
      })
      .catch(err => next(err))
  },
  putUser: (req, res, next) => {
    if (Number(req.params.id) !== Number(req.user.id)) {
      res.redirect(`/users/${req.params.id}`)
    }
    const { file } = req

    return Promise.all([
      User.findByPk(req.params.id),
      file ? imgur.uploadFile(file.path) : null
    ])
      .then(([user, img]) => {
        if (!user) throw new Error("User didn't exist!")

        return user.update({
          name: req.body.name,
          image: file ? img.link : user.image
        })
      })
      .then(() => res.redirect(`/users/${req.params.id}`))
      .catch(err => next(err))
  },
  addFavorite: (req, res, next) => {
    return Restaurant.findByPk(req.params.restaurantId)
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")

        return Favorite.create({
          userId: req.user.id,
          restaurantId: req.params.restaurantId
        })
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  },
  removeFavorite: (req, res, next) => {
    return Favorite.findOne({
      where: {
        userId: req.user.id,
        restaurantId: req.params.restaurantId
      }
    })
      .then(favorite => {
        if (!favorite) throw new Error("Favorite didn't exist!")

        return favorite.destroy()
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  },
  addLike: (req, res, next) => {
    return Restaurant.findByPk(req.params.restaurantId)
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")

        return Like.create({
          userId: req.user.id,
          restaurantId: req.params.restaurantId
        })
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  },

  removeLike: (req, res, next) => {
    return Like.findOne({
      where: {
        userId: req.user.id,
        restaurantId: req.params.restaurantId
      }
    }).then(like => {
      if (!like) throw new Error("Like didn't exist!")
      like.destroy()
    })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  },
  getTopUser: (req, res, next) => {
    // 撈出所有 User 與 followers 資料
    return User.findAll({
      include: [{ model: User, as: 'Followers' }]
    })
      .then(users => {
        // 整理 users 資料
        users = users.map(user => ({
          ...user.dataValues,
          // 計算追蹤者人數
          FollowerCount: user.Followers.length,
          // 判斷目前登入使用者是否已追蹤該 User 物件
          isFollowed: req.user.Followings.some(d => d.id === user.id)
        }))
        // 依追蹤者人數排序清單
        users = users.sort((a, b) => b.FollowerCount - a.FollowerCount)
        res.render('topUser', { users: users })
      })
      .catch(err => next(err))
  },
  addFollowing: (req, res, next) => {
    return User.findByPk(req.params.userId)
      .then(user => {
        if (!user) throw new Error("User didn't exist!")

        return Followship.create({
          followerId: req.user.id,
          followingId: req.params.userId
        })
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  },

  removeFollowing: (req, res, next) => {
    return Followship.findOne({
      where: {
        followerId: req.user.id,
        followingId: req.params.userId
      }
    })
      .then(followship => {
        if (!followship) throw new Error("Followship didn't exist!")

        followship.destroy()
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  }
}

module.exports = userController
