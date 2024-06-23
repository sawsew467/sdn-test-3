const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Book = require("../models/books");
const authenticate = require("../authenticate");

const bookRouter = express.Router();
bookRouter.use(bodyParser.json());

bookRouter
  .route("/")
  .get((req, res, next) => {
    Book.find({})
      .then((books) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(books);
      })
      .catch((err) => next(err));
  })
  .post(
    authenticate.verifyUser,
    authenticate.verifyfAdmin,
    (req, res, next) => {
      Book.create(req.body)
        .then((book) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(book);
        })
        .catch((err) => next(err));
    }
  )
  .delete(
    authenticate.verifyUser,
    authenticate.verifyfAdmin,
    (req, res, next) => {
      Book.deleteMany({})
        .then((resp) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(resp);
        })
        .catch((err) => next(err));
    }
  );

bookRouter
  .route("/:bookId")
  .get((req, res, next) => {
    Book.findById(req.params.bookId)
      .then((book) => {
        if (book) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(book);
        } else {
          const err = new Error("Book " + req.params.bookId + " not found");
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .put(authenticate.verifyUser, authenticate.verifyfAdmin, (req, res, next) => {
    Book.findByIdAndUpdate(
      req.params.bookId,
      {
        $set: req.body,
      },
      { new: true }
    )
      .then((book) => {
        if (book) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(book);
        } else {
          const err = new Error("Book " + req.params.bookId + " not found");
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .delete(
    authenticate.verifyUser,
    authenticate.verifyfAdmin,
    (req, res, next) => {
      Book.findByIdAndRemove(req.params.bookId)
        .then((resp) => {
          if (resp) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(resp);
          } else {
            const err = new Error("Book " + req.params.bookId + " not found");
            err.status = 404;
            return next(err);
          }
        })
        .catch((err) => next(err));
    }
  );

bookRouter
  .route("/:bookId/comments")
  .get((req, res, next) => {
    Book.findById(req.params.bookId)
      .then((book) => {
        if (book) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(book.comments);
        } else {
          const err = new Error("Book " + req.params.bookId + " not found");
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .post(authenticate.verifyUser, (req, res, next) => {
    Book.findById(req.params.bookId)
      .then((book) => {
        if (book) {
          book.comments.push(req.body);
          book
            .save()
            .then((book) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(book);
            })
            .catch((err) => next(err));
        } else {
          const err = new Error("Book " + req.params.bookId + " not found");
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  });

bookRouter.get("/:bookId/comments", (req, res, next) => {
  Book.findById(req.params.bookId)
    .populate("comments.user") // Populate thông tin user trong comments
    .then((book) => {
      if (book) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(book.comments);
      } else {
        const err = new Error("Book " + req.params.bookId + " not found");
        err.status = 404;
        return next(err);
      }
    })
    .catch((err) => next(err));
});

// Endpoint POST /books/:bookId/comments - Tạo mới comment cho một cuốn sách
bookRouter.post(
  "/:bookId/comments",
  authenticate.verifyUser,
  (req, res, next) => {
    Book.findById(req.params.bookId)
      .then((book) => {
        if (book) {
          req.body.user = req.user._id; // Lấy user ID từ JWT
          book.comments.push(req.body);
          return book.save();
        } else {
          const err = new Error("Book " + req.params.bookId + " not found");
          err.status = 404;
          throw err;
        }
      })
      .then((book) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(book);
      })
      .catch((err) => next(err));
  }
);

// Endpoint GET /books/:bookId/comments/:commentId - Lấy thông tin một comment cụ thể của một cuốn sách
bookRouter.get("/:bookId/comments/:commentId", (req, res, next) => {
  Book.findById(req.params.bookId)
    .populate("comments.user") // Populate thông tin user trong comments
    .then((book) => {
      if (book && book.comments.id(req.params.commentId)) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(book.comments.id(req.params.commentId));
      } else if (!book) {
        const err = new Error("Book " + req.params.bookId + " not found");
        err.status = 404;
        return next(err);
      } else {
        const err = new Error("Comment " + req.params.commentId + " not found");
        err.status = 404;
        return next(err);
      }
    })
    .catch((err) => next(err));
});

// Endpoint PUT /books/:bookId/comments/:commentId - Cập nhật thông tin một comment cụ thể của một cuốn sách
bookRouter.put(
  "/:bookId/comments/:commentId",
  authenticate.verifyUser,
  (req, res, next) => {
    Book.findById(req.params.bookId)
      .then((book) => {
        if (book && book.comments.id(req.params.commentId)) {
          if (req.body.text) {
            book.comments.id(req.params.commentId).text = req.body.text;
          }
          return book.save();
        } else if (!book) {
          const err = new Error("Book " + req.params.bookId + " not found");
          err.status = 404;
          throw err;
        } else {
          const err = new Error(
            "Comment " + req.params.commentId + " not found"
          );
          err.status = 404;
          throw err;
        }
      })
      .then((book) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(book);
      })
      .catch((err) => next(err));
  }
);

// Endpoint DELETE /books/:bookId/comments/:commentId - Xóa một comment cụ thể của một cuốn sách
bookRouter.delete(
  "/:bookId/comments/:commentId",
  authenticate.verifyUser,
  authenticate.verifyfAdmin,
  (req, res, next) => {
    Book.findById(req.params.bookId)
      .then((book) => {
        if (book && book.comments.id(req.params.commentId)) {
          book.comments.id(req.params.commentId).remove();
          return book.save();
        } else if (!book) {
          const err = new Error("Book " + req.params.bookId + " not found");
          err.status = 404;
          throw err;
        } else {
          const err = new Error(
            "Comment " + req.params.commentId + " not found"
          );
          err.status = 404;
          throw err;
        }
      })
      .then((book) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(book);
      })
      .catch((err) => next(err));
  }
);
// Endpoint GET /books/:bookId/populate - Lấy các comment trong một cuốn sách với điều kiện filter
bookRouter.get("/:bookId/populate", (req, res, next) => {
  // Lấy bookId từ request params
  const bookId = req.params.bookId;

  // Tìm sách theo bookId và populate thông tin user trong comments
  Book.findById(bookId)
    .populate("comments.user")
    .then((book) => {
      if (!book) {
        const err = new Error(`Book ${bookId} not found`);
        err.status = 404;
        throw err;
      }

      // Lọc các comment chứa từ "excellent" hoặc "good"
      const filteredComments = book.comments.filter(
        (comment) =>
          comment.text.includes("excellent") || comment.text.includes("good")
      );

      // Trả về kết quả
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(filteredComments);
    })
    .catch((err) => next(err));
});

module.exports = bookRouter;
