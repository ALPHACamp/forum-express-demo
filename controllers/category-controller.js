const db = require('../models')
const Category = db.Category

const categoryController = {
  getCategories: (req, res, next) => {
    return Promise.all([
      Category.findAll({
        raw: true,
        nest: true
      }),
      req.params.id ? Category.findByPk(req.params.id) : null
    ])
      .then(([categories, category]) => {
        res.render('admin/categories', {
          categories: categories,
          category: category && category.toJSON()
        })
      })
      .catch(err => next(err))
  },
  postCategory: (req, res, next) => {
    const { name } = req.body

    if (!name) throw new Error('Category name is required!')

    return Category.create({
      name: req.body.name
    })
      .then(() => res.redirect('/admin/categories'))
      .catch(err => next(err))
  },
  putCategory: (req, res, next) => {
    const { name } = req.body
    if (!name) if (!name) throw new Error('Category name is required!')

    return Category.findByPk(req.params.id)
      .then(category => {
        if (!category) throw new Error("Category didn't exist!")

        return category.update(req.body)
      })
      .then(() => res.redirect('/admin/categories'))
      .catch(err => next(err))
  },
  deleteCategory: (req, res, next) => {
    return Category.findByPk(req.params.id)
      .then(category => {
        if (!category) throw new Error("Category didn't exist!")

        return category.destroy()
      })
      .then(() => res.redirect('/admin/categories'))
      .catch(err => next(err))
  }
}
module.exports = categoryController
