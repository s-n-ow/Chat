const mongoose = require('mongoose');
const moment = require('moment');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username:String,
    room:String
}); 


var user = mongoose.model('user',userSchema);
module.exports = user;