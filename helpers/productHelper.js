const Product = require("../model/productmodel");

module.exports = {
  decreaseStock: (cartItems) => {
    return new Promise(async (resolve, reject) => {
      for (let i = 0; i < cartItems.products.length; i++) {
        let product = await Product.findById({
          _id: cartItems.products[i].productId._id,
        });
        const isProductAvailableInStock =
          product.productQuantity - cartItems.products[i].quantity > 0
            ? true
            : false;
        if (isProductAvailableInStock) {
          product.productQuantity =
            product.productQuantity - cartItems.products[i].quantity;
        }

        await product.save();
      }
      resolve(true);
    });
  },
  filterProduct:(filterData)=>{
    return new Promise(async (resolve,reject)=>{
     
        let filteredProducts = await Product.find({
            category:{$in:filterData.selectedCategories},
            productPrice:{$gte: Number(filterData.min),$lte: Number(filterData.max)}
        }).lean()
      

        resolve(filteredProducts)

    })
},
};
