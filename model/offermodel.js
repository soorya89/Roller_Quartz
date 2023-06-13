const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const offerSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  discount: {
    type: Number,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "category",
  },
  endDate: {
    type: Date,
    required: true,
  },
  status:{
    type:Boolean,
    default:true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Offer', offerSchema);