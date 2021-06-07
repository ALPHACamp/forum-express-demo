const db = require('../models')
const Category = db.Category
const categoryController = {
  getCategories: (req, res) => {
    return Promise.all([
      Category.findAll({
        raw: true,
        nest: true,
      }),
      req.params.id && Category.findByPk(req.params.id)
    ])
      .then(([categories, category]) => {
        return res.render('admin/categories', {
          categories: categories,
          category: category && category.toJSON()
        })
      })
  },
  postCategory: (req, res) => {
    if (!req.body.name) {
      req.flash('error_messages', 'name didn\'t exist')
      return res.redirect('back')
    } else {
      return Category.create({
        name: req.body.name
      })
        .then((category) => {
          res.redirect('/admin/categories')
        })
    }
  },
  putCategory: (req, res) => {
    if (!req.body.name) {
      req.flash('error_messages', 'name didn\'t exist')
      return res.redirect('back')
    } else {
      return Category.findByPk(req.params.id)
        .then(category => category.update(req.body))
        .then(() => res.redirect('/admin/categories'))
    }
  },
  deleteCategory: (req, res) => {
    return Category.findByPk(req.params.id)
      .then((category) => category.destroy())
      .then(() => res.redirect('/admin/categories'))
  }
}
module.exports = categoryController
