const mongoose = require('mongoose')

const brandSchema=new mongoose.Schema({
    brandName:{type:String,
         required:true,
         unique:true
        },
         brandDescription:{
             type:String,
            
         },
         isListed:{
             type:Boolean,
            default:true,
      },
})
const Brand = mongoose.model('Brand',brandSchema)
module.exports=Brand