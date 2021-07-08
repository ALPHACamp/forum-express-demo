const db = require('../models')
const Comment = db.Comment

const commentController = {
  postComment: (req, res, next) => {
    return Comment.create({
      text: req.body.text,
      restaurantId: req.body.restaurantId,
      userId: req.user.id
    })
      .then(() => {
        res.redirect(`/restaurants/${req.body.restaurantId}`)
      })
      .catch(err => next(err))
  },
  deleteComment: (req, res, next) => {
    return Comment.findByPk(req.params.id)
      .then(comment => {
        if (!comment) throw new Error("Comment didn't exist!'")

        return comment.destroy()
      })
      .then(deletedComment => res.redirect(`/restaurants/${deletedComment.restaurantId}`))
      .catch(err => next(err))
  }
}

module.exports = commentController
