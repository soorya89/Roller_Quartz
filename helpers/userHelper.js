const User = require("../model/usermodel");
const shopController = require("../controller/shopController");
const Product = require("../model/productmodel");
const bcrypt = require("bcrypt");
const twilioFunctions = require("../config/twilio");
const Cart = require("../model/cartModel");
const Address = require("../model/addressmodel");
const ObjectId = require("mongoose").Types.ObjectId;
const Order = require("../model/ordermodel");
const Coupon = require("../model/couponmodel");

function orderDate() {
  const date = new Date();
  console.log(date);
  return date;
}

module.exports = {
  doLogin: async (user) => {
    return new Promise(async (resolve, reject) => {
      try {
        const validUser = await User.findOne({ email: user.email });
        if (validUser) {
          if (validUser.status === true) {
            const isPasswordMatch = await bcrypt.compare(
              user.password,
              validUser.password
            );
            if (isPasswordMatch) {
              resolve({ status: true, user: validUser });
            } else {
              resolve({
                status: false,
                message: "Incorrect username or password",
              });
            }
          } else {
            resolve({
              status: false,
              message: "Your account is blocked please contact to admin",
            });
          }
        } else {
          resolve({
            status: false,
            message:
              "We couldn't find a user with that email address. Please register to create an account",
          });
        }
      } catch (err) {
        console.error(err);
        reject(err);
      }
    });
  },

  generateOtp: (phoneNumber) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (
          phoneNumber &&
          phoneNumber.length == 10 &&
          /^\d+$/.test(phoneNumber)
        ) {
          const user = await User.findOne({ phone: phoneNumber });
          if (user) {
            if (user.status === true) {
              twilioFunctions.generateOtp(user.phone);
              resolve({ status: true, user });
            } else {
              resolve({
                status: false,
                message: "Your account is blocked please contact to admin",
              });
            }
          } else {
            resolve({
              status: false,
              message:
                "No user found with this phone number, Please register to create an account",
            });
          }
        } else {
          resolve({
            status: false,
            message: "Please enter a valid 10-digit phone number",
          });
        }
      } catch (err) {
        console.error(err);
        reject(err);
      }
    });
  },

  getshopCart: async (userId) => {
    try {
      const cart = await Cart.findOne({ user: userId });
      if (!cart) {
        return false;
      }

      return cart.products;
    } catch (error) {
      console.error(error);
    }
  },

  addToCart: async (userId, body) => {
    try {
      if (!userId) {
        return { response: false };
      }
      const productId = body.productId;
      const productdetail = await Product.findById(productId);
      if (!productdetail) {
        return { response: false, error: "Product not found" };
      }
      const quantity = productdetail.productQuantity;
      if (quantity < 1) {
        return { response: false, error: "Product is out of stock" };
      }
      let added;
      const cartuser = await Cart.findOne({ user: userId });
      if (cartuser) {
        added = await Cart.updateOne(
          { user: userId, "products.productId": productId },
          { $inc: { "products.$.quantity": 1 } }
        );
      }
      const cart = await Cart.findOneAndUpdate(
        { user: userId, "products.productId": { $ne: productId } },
        { $push: { products: { productId, quantity: 1 } } },
        { new: true }
      );
      if (!cart && !added) {
        await Cart.updateOne(
          { user: userId },
          { $push: { products: { productId, quantity: 1 } } },
          { upsert: true }
        );
        throw new Error("Could not update cart");
      }
      return { response: true };
    } catch (error) {
      console.error(error);
    }
  },

  applyCoupon: (userId, couponCode, totalAmount) => {
    return new Promise(async (resolve, reject) => {
      let coupon = await Coupon.findOne({ code: couponCode });
      if (coupon && coupon.isActive == "Active") {
        if (!coupon.usedBy.includes(userId)) {
          let cart = await Cart.findOne({ user: userId });
          const discount = coupon.discount;
          let total = totalAmount - discount;
          cart.coupon = couponCode;
          await cart.save();
          coupon.usedBy.push(userId);
          await coupon.save();
          resolve({ status: true, total,discount, message: "coupn added successfully" });
        } else {
          resolve({ status: false, message: "Coupon code already used" });
        }
      } else {
        resolve({ status: false, message: "invalid Coupon code" });
      }
    });
  },
  changeProductQuantity: async (body) => {
    try {
      body.count = parseInt(body.count);
      body.quantity = parseInt(body.quantity);
      const productId = body.product;
      const cartId = body.cart;
      const count = body.count;
      return new Promise((resolve, reject) => {
        if (body.count == -1 && body.quantity == 1) {
          Cart.updateOne(
            { _id: cartId },
            { $pull: { products: { productId: productId } } }
          ).then((response) => {
            resolve({ response: response, remove: true });
          });
        } else {
          Cart.updateOne(
            { _id: cartId, "products.productId": productId },
            { $inc: { "products.$.quantity": count } }
          ).then((response) => {
            resolve(false);
          });
        }
      });
    } catch (error) {
      console.log(error);
    }
  },

  getAllOrderDetailsOfAUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      const userOrderDetails = await Order.aggregate([
        {
          $match: { user: new ObjectId(userId) },
        },
        {
          $lookup: {
            from: "addresses",
            localField: "address",
            foreignField: "address._id",
            as: "addressLookedup",
          },
        },
      ]);
      resolve(userOrderDetails);
    });
  },

  getCartTotal: async (userId) => {
    try {
      const cart = await Cart.findOne({ user: userId }).populate(
        "products.productId"
      );
      if (!cart) {
        return { status: false, message: "cart not found" };
      }
      let total = 0;
      cart.products.forEach((item) => {
        total += item.productId.productPrice * item.quantity;
      });
      carttotal = parseInt(total);
      return carttotal;
    } catch (error) {
      console.error(error);
      return { status: false, message: "cart not found" };
    }
  },


 
  deleteProductCart: async (userId, productId) => {
    try {
      const userProduct = await Product.findById(productId).select(
        "productPrice"
      );
      if (!userProduct) {
        return { status: false, message: "product not found" };
      }
      const cart = await Cart.findOne({ user: userId });
      if (cart) {
        const itemIndex = cart.products.findIndex((item) =>
          item.productId.equals(productId)
        );
        if (itemIndex > -1) {
          cart.products.splice(itemIndex, 1);
          await cart.save();
          return { status: true, message: "product removed from cart" };
        } else {
          return { status: false, message: "product not found in cart" };
        }
      } else {
        return { status: false, message: "cart not found" };
      }
    } catch (error) {
      console.error(error);
    }
  },

  addAddress: async (body, userId) => {
    try {
      await Address.create(
        {
          firstname: body.firstname,
          lastname: body.lastname,
          address: body.address,
          city: body.city,
          state: body.state,
          zip: body.zip,
          phone: body.phone,
          email: body.email,
          user: userId,
        },

        { upsert: true }
      );
    } catch (error) {
      console.log(error);
    }
  },
  deleteaddress: async (body) => {
    try {
      let addressid = body;
      let address=await Address.findById(addressid);
      address.status=false
      address.save()
      return({status:true})
    } catch (error) {}
  },
  addAddressProfile: async (body, userId) => {
    try {
      await Address.create(
        {
          firstname: body.firstname,
          lastname: body.lastname,
          address: body.address,
          city: body.city,
          state: body.state,
          zip: body.zip,
          phone: body.phone,
          email: body.email,
          user: userId,
        },

        { upsert: true }
      );
    } catch (error) {
      console.log(error);
    }
  },
  getAnAddress: (addressId) => {
    return new Promise(async (resolve, reject) => {
      await Address.findById(addressId).then((result) => {
        console.log("inside helper");
        resolve(result);
      });
    });
  },
  editAnAddress: (editedAddress) => {
    return new Promise(async (resolve, reject) => {
      console.log("edit address post inside helper", editedAddress);
      console.log("Edited address ID:", editedAddress.addressId);

      let address = await Address.findById(editedAddress.addressId);
      console.log("edit address post inside helper address=", address);

      if (address) {
        address.firstname = editedAddress.firstname;
        address.lastname = editedAddress.lastname;
        address.phone = editedAddress.phone;
        address.email = editedAddress.email;
        address.address = editedAddress.address;
        address.country = editedAddress.country; // Assuming you meant 'country' instead of 'state' here
        address.state = editedAddress.state;
        address.city = editedAddress.city;
        address.zip = editedAddress.zip;

        await address.save();
        resolve(address);
      } else {
        reject(new Error("Address not found"));
      }
    });
  },

  orderPlacing: (order, totalAmount, cartItems, userid) => {
    return new Promise(async (resolve, reject) => {
      let status = order.payment_method == "COD" ? "placed" : "pending";
      let date = orderDate();
      let userId = userid;
      let paymentMethod = order.payment_method;
      let addressId = order.address_id;
      let orderedItems = cartItems;     
      let couponOffer;

      let orderedPrice=[]
      if (cartItems) {
        cartItems.products.forEach((product) => {
          console.log('Product Price:', product.productId.productPrice);
          orderedPrice.push(product.productId.productPrice)
        });        
      }
      if(order.coupon){
        couponOffer =  order.coupon;
      }
      let ordered = new Order({
        user: userId,
        address: addressId,
        orderDate: date,
        totalAmount: totalAmount,
        paymentMethod: paymentMethod,
        orderStatus: status,
        coupon:couponOffer,
        orderedItems: orderedItems.products,
        orderedPrice:orderedPrice
        
      });
      await ordered.save();
      let orderId = ordered._id;
      resolve(orderId);
    });
  },

  clearCart: async (userId) => {
    await Cart.findOneAndUpdate(
      { user: userId },
      { $set: { products: [] } },
      { new: true }
    );
  },
  // orderPlacing: (order, totalAmount, cartItems, userId) => {
  
  //   return new Promise(async (resolve, reject) => {
  //     let status = order.payment_method == "COD" ? "placed" : "pending";
  //     let date = orderDate();
  //     let paymentMethod = order.payment_method;
  //     let addressId = order.address_id;
  
  //     // Iterate over each cart item
  //     let orderedItems = [];
  //     for (const item of cartItems.products) {
  //       const product = await Product.findById(item.productId);
  //       if (product) {
  //         // Retrieve the current price of the product
  //         const orderedPrice = product.productPrice;
        
         
  //         // Add the ordered item to the list
  //         orderedItems.push({
  //           productId: item.productId,
  //           quantity: item.quantity,
  //           orderedPrice: orderedPrice,
  //         });
  //       }
  //     }
  
  //     let ordered = new Order({
  //       user: userId,
  //       address: addressId,
  //       orderDate: date,
  //       totalAmount: totalAmount,
  //       paymentMethod: paymentMethod,
  //       orderStatus: status,
  //       orderedItems: orderedItems,
  //     });
  
  //     await ordered.save();
  
  //     let orderId = ordered._id;
  //     console.log(orderId);
  //     resolve(orderId);
  //   });
  // },
  

  getCartCount: async (userId) => {
    try {
      const cart = await Cart.findOne({ user: userId });
      if (!cart) {
        return { status: false, message: "cart not found" };
      }
      return cart.products.length;
    } catch (error) {
      console.error(error);
      return { status: false, message: "cart not found" };
    }
  },
  getOrderedUserDetailsAndAddress: (orderId) => {
    return new Promise(async (resolve, reject) => {
      await Order.aggregate([
        {
          $match: { _id: new ObjectId(orderId) },
        },

        {
          $lookup: {
            from: "addresses",
            localField: "address",
            foreignField: "address._id",
            as: "userAddress",
          },
        },
        {
          $project: {
            user: 1,
            totalAmount: 1,
            paymentMethod: 1,
            address: {
              $arrayElemAt: ["$userAddress", 0],
            },
          },
        },
      ]).then((result) => {
        resolve(result[0]);
      });
    });
  },

  getOrderedProductsDetails: (orderId) => {
    return new Promise(async (resolve, reject) => {
      await Order.aggregate([
        {
          $match: { _id: new ObjectId(orderId) },
        },
        {
          $unwind: "$orderedItems",
        },
        {
          $lookup: {
            from: "products",
            localField: "orderedItems.productId",
            foreignField: "_id",
            as: "orderedProduct",
          },
        },
        {
          $lookup: {
            from: "addresses",
            localField: "address",
            foreignField: "_id",
            as: "userAddress",
          },
        },
        {
          $unwind: "$orderedProduct",
        },
        {
          $lookup: {
            from: "categories",
            localField: "orderedProduct.category",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $lookup: {
            from: "brands",
            localField: "orderedProduct.brand",
            foreignField: "_id",
            as: "brand",
          },
        },
        {
          $unwind: "$category",
        },
        {
          $unwind: "$brand",
        },
      ]).then((result) => {
        console.log("orders", result);
        resolve(result);
      });
    });
  },
  searchQuery: async (query) => {
    try {
      const product = await Product.find({
        $or: [
          { productName: { $regex: query, $options: "i" } },
          { productDescription: { $regex: query, $options: "i" } },
        ],
      }).populate("category");
      if (product.length > 0) {
        return product;
      }
      return [];
    } catch (err) {
      console.error(err);
    }
  },
};
