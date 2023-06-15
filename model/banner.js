const mongoose = require('mongoose')

const bannerModel = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image:[
        { type : Array ,
        required:true}
    ],
   
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: true
    }
}
)

const cartDB = mongoose.model("banners", bannerModel);

module.exports = cartDB