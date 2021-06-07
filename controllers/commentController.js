const db = require('../models')
const Comment = db.Comment

const commentController = {
  postComment: (req, res) => {
    return Comment.create({
      text: req.body.text,
      restaurantId: req.body.restaurantId,
      userId: req.user.id
    })
      .then(() => {
        res.redirect(`/restaurants/${req.body.restaurantId}`)
      })
  },
  deleteComment: (req, res) => {
    return Comment.findByPk(req.params.id)
      .then(comment => comment.destroy())
      .then((comment) => res.redirect(`/restaurants/${comment.restaurantId}`))
  }
}

module.exports = commentController
