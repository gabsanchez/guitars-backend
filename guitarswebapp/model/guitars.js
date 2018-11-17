var mongoose = require('mongoose');
var guitarSchema = new mongoose.Schema({
    id: Number,
    imageUrl: String,
    brand: String,
    type: String,
    owner: String,
    likes: Number
});
mongoose.model('Guitar', guitarSchema);