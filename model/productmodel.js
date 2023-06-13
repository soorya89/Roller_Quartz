const mongoose = require('mongoose')
const Schema = mongoose.Schema

const productSchema = new Schema({
    productName:{
        type : String,
        require : true
    },
   
    productDescription:{
        type : String,
        require : true
    },
    productPrice:{
        type : Number,
        required : true
    },
    brand:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "brand",
    },
    productQuantity:{
        type: Number,
        required:true
    },
    productStatus: {
        type: Boolean,
        default: true,
      },
      productColor: {
        type: String,
       
      },
      category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "category",
      },
      stock:{type:Number,},
      featuredImage:{
        type : String,
        require : true
    },
          
    productImage:[
        { type : Array ,
        required:true}
    ]},
   {
    timestamps:true
     
   }
)
const Product = mongoose.model('Product',productSchema)
module.exports=Product