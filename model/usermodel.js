const mongoose = require('mongoose')
const userSchema=new mongoose.Schema({
  name: { 
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50 },
    email: { type: String,
    required: true,
    unique: true,
    minlength: 5,
    maxlength: 255},
  password: { type: String,
    required: true,
    minlength: 5,
    maxlength: 1024 },
  phone: { type: String,
    required: true,
     },
     password2:{type: String,
      required: true,
      minlength: 5,
      maxlength: 1024},
      status:{type:Boolean,default:true}

},{timestamps:true})
const User = mongoose.model('User', userSchema);
module.exports = User;