const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    publisher: {
        type: String,
        required: true
    },
    publication_year: {
        type: Number,
        required: true
    },
    genre: {
        type: String,
        required: true
    },
    summary: {
        type: String,
        required: true
    },
    contents: {
        type: String,
        required: true
    },
    comments: [
        {
            text: String,
            user: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            }
        }
    ]
});

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
