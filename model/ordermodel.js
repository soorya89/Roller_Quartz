const mongoose = require('mongoose');

const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderedItems: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'products',
          required:true
        },
        quantity: {
          type: Number
        },
        orderedPrice:{
          type: Number,
        
        },
      
      },
     
    ],
  
    address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address'

    },
    orderDate: {
      type: Date,
    },
    totalAmount: {
      type: Number,
    },
    coupon:{
      type: String,
      default: null
  },
    // finalAmount:Number,
    paymentMethod: {
      type: String,
      enum: ["COD", "online-payment","wallet"],
    },
    orderStatus: String
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;