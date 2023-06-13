const mongoose = require('mongoose');



const addressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Types.ObjectId,
    ref: 'user',
    required: true
  },


  firstname: {
    type: String
  },
  lastname: {
    type: String
  },
  address: {
    type: String
  },
  city: {
    type: String
  },
  state: {
    type: String
  },
  zip: {
    type: Number
  },
  phone: {
    type: String
  },
  email: {
    type: String
  },
  addStatus: {
    type: Boolean,
    default: true,
  },


},
  {
    timestamps: true,
  }
);


const Address = mongoose.model('address', addressSchema)
module.exports = Address