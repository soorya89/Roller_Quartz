const twilioFunctions = require("../config/twilio");
const User = require("../model/usermodel");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");
const userHelper = require("../helpers/userHelper");
const productHelper = require("../helpers/productHelper");
const dotenv = require("dotenv");
const Product = require("../model/productmodel");
const Cart = require("../model/cartModel");
const Category = require("../model/categorymodel");
const Coupon = require("../model/couponmodel")
const walletSchema = require("../model/walletmodel")
const adminHelpers = require("../helpers/adminHelpers");
const Brand = require("../model/brandmodel");
const Order = require("../model/ordermodel");
const Address = require("../model/addressmodel");
const wishlisthelper = require("../helpers/wishListHelper");
const walletHelper = require("../helpers/walletHelper");
const razorpay = require("../config/razorpay");
const  response  = require("../routes/userRouter");
const ObjectId = require("mongoose").Types.ObjectId;
const bannerData = require('../model/banner')

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);
function hashPassword(password) {
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(password, salt);
  return hash;
}

module.exports = {
  login: async (req, res) => {
    if (req.session.user) {
      res.redirect("/");
    } else {
      const message = res.locals.message; // add this line to get the message from the session
      res.render("shop/user-login/login", {
        other: true,req: req, currentUrl: req.url,
        message, // add message to the data object
      });
    }
  },
  postlogin: async (req, res) => {
    try {
      const response = await userHelper.doLogin(req.body);
      if (response.status === false) {
        req.session.message = response.message;
        const message = req.session.message;
        const data={ message ,req: req, currentUrl: req.url}
        res.render("shop/user-login/login" ,data);
      } else {
        req.session.login = true;
        req.session.user = response.user;
        res.redirect("/");
      }
    } catch (error) {
      console.log(error);
    }
  },

  postSignup: async (req, res) => {
    try {
      const user = await User.findOne({
        $or: [{ email: req.body.email }, { phone: req.body.phone }],
      }).exec();
      if (!user) {
        const hashHead = await bcrypt.hash(req.body.password, 10);
        const newUser = new User({
          name: req.body.name,
          email: req.body.email,
          phone: req.body.phone,
          password: hashHead,
          password2: hashHead,
          isActive: true,
        });
        await newUser.save();
        req.session.login = true;
        req.session.user = user;
        res.redirect("/");
      } else {
        res.redirect("/login");
      }
    } catch (error) {
      res.redirect("/register");
    }
  },

  logout: (req, res) => {
    req.session.user = false;
    res.redirect("/");
  },

  getotpsend: async (req, res) => {
    const message = res.locals.message;
    const data={ other: true, message,req: req, currentUrl: req.url }
    res.render("shop/user-login/otpsend",data );
  },
  getOtpvarify: async (req, res) => {
    const data={req: req, currentUrl: req.url }
    res.render("shop/user-login/otpvarify",data);
  },
  generateOtp: (req, res) => {
    userHelper
      .generateOtp(req.body.phonenumber)
      .then((user) => {
        let response = user;
        const message = req.session.message;
        const data= {
          phonenumber: req.body.phonenumber,
          message,req: req, currentUrl: req.url
        }
        if (response.status) {
          res.render("shop/user-login/otpvarify",data);
        } else {
          const message = response.message;
          res.render("shop/user-login/otpsend", data);
        }
      })
      .catch((error) => {
        console.error(error);
        const message = error.message;
        res.render("catchError", {
          message: error.message,
        });
      });
  },

  verifyOtp: async (req, res) => {
    try {
      const phonenumber = req.body.phone;
      const otp = req.body.otp;
      client.verify.v2
        .services("VAf913db46a166f7e828f161f6acc5e7e6")
        .verificationChecks.create({ to: `+91${phonenumber}`, code: otp })
        .then(async (verificationCheck) => {
          if (verificationCheck.status === "approved") {
            let user = await User.findOne({ phone: phonenumber });
            if (user.status == false) {
              let blockmsg = "Account is blocked...Unable to login";
              res.render("shop/user-login/login", { blockmsg });
            } else {
              req.session.login = true;
              req.session.user = user;
              res.redirect("/");
            }
          } else {
            const msg2 = "INCORRECT OTP!!";
            res.render("shop/user-login/otpvarify", {
              msg2: msg2,
              phonenumber,
            });
          }
        })
        .catch((error) => {
          console.error(error);
        });
    } catch (err) {
      console.error(err);
      // res.render("catchError", {
      //   message: err.message,
      // });
    }
  },

  register: async (req, res, next) => {
    try {
      const data = {
        user: req.session.user,
        req: req,
        currentUrl: req.url,
        successMsg: req.flash("success"),
        errorMsg: req.flash("error"),
      };
      res.render("shop/user-login/register",  data );
    } catch (error) {
      console.log(error);
    }
  },
  home: async (req, res, next) => {
    try {
      const user = req.session.user;
      let userId = req.session.user._id;
      let cartCount = await userHelper.getCartCount(userId);
      wishListCount = await wishlisthelper.getWishListCount(userId); 
      const product = await Product.find({ productStatus: { $eq: true } }).sort({ createdAt: 1 })
      const bannerList= await bannerData.find({})
      console.log(bannerList)
      const data = { user,product, req: req, currentUrl: req.url ,wishListCount,cartCount,bannerList};
      
      res.render("shop/home", data);
    } catch (error) {
      console.log(error);
    }
  },
  landingpage: async (req, res, next) => {
    try {
      const product = await Product.find({ productStatus: { $eq: true } }).sort({ createdAt: 1 })
      const bannerList= await bannerData.find({})
      console.log(bannerList.image)
      const data={currentUrl: req.url,product,bannerList}
      res.render("shop/home",data)
    } catch (error) {
      console.error(err);
    }
  },

  product: async (req, res, next) => {
    try {
      let user = null;
      let userId = null;
      let wishListCount = null;
      let cartCount = null;

      if (req.session.user) {
        user = req.session.user;
        userId = user._id;
        wishListCount = await wishlisthelper.getWishListCount(userId);
        cartCount = await userHelper.getCartCount(userId);
      }
      if (!req.query.filterData) {
        const count = parseInt(req.query.count) || 6;
        const page = parseInt(req.query.page) || 1;
        const totalCount = await Product.countDocuments();
        const startIndex = (page - 1) * count;
        const totalPages = Math.ceil(totalCount / count);
        const randomOffset = Math.floor(Math.random() * (totalCount - count));
        const endIndex = Math.min(count, totalCount - startIndex);

        const pagination = {
          totalCount: totalCount,
          totalPages: totalPages,
          page: page,
          count: count,
          startIndex: startIndex,
          endIndex: endIndex,
        };
        // let userId = req.session.user._id;
        // let cartCount = await userHelper.getCartCount(userId);
        // wishListCount = await wishlisthelper.getWishListCount(userId);
        const viewCategory = await adminHelpers.getAllCategory();
        const viewBrand = await adminHelpers.getAllBrand();
        const product = await Product.find({ productStatus: { $eq: true } })
          .skip(startIndex)
          .limit(count)
          .lean();
        const data = {
          user,
          product,
          viewCategory,
          cartCount,
          viewBrand,
          pagination,
          wishListCount,
          req: req,
          currentUrl: req.url,
        };
        res.render("shop/products", data);
      } else {
        let filterData = JSON.parse(req.query.filterData);

        const product = await productHelper.filterProduct(filterData);

        res.json({ product: product });
      }
    } catch (error) {
      console.log(error);
    }
  },
  about: async (req, res, next) => {
    try {
      let user = null;
      let userId = null;
      let wishListCount = null;
      let cartCount = null;

      if (req.session.user) {
        user = req.session.user;
        userId = user._id;
        wishListCount = await wishlisthelper.getWishListCount(userId);
        cartCount = await userHelper.getCartCount(userId);
      }
    
      const data= {user,currentUrl: req.url,cartCount ,wishListCount,cartCount}
      res.render("shop/abouts",data);
    } catch (error) {
      console.log(error);
    }
  },
  contact: async (req, res) => {
    try {
      let user = null;
      let userId = null;
      let wishListCount = null;
      let cartCount = null;

      if (req.session.user) {
        user = req.session.user;
        userId = user._id;
        wishListCount = await wishlisthelper.getWishListCount(userId);
        cartCount = await userHelper.getCartCount(userId);
      }
      const data={ user,currentUrl: req.url,cartCount,wishListCount }
      res.render("shop/contact",data );
    } catch (error) {
      console.log(error);
    }
  },

  myProfile: async (req, res) => {
    try {
      const user = req.session.user;
      let userId = req.session.user._id;
      const address = await Address.find({ user: userId });
      let coupon=await Coupon.findOne({user:userId})
      let cartCount = await userHelper.getCartCount(userId);
      wishListCount = await wishlisthelper.getWishListCount(userId);
      const orders = await userHelper.getAllOrderDetailsOfAUser(userId);
      const data=  { user, orders, address,coupon,cartCount,wishListCount ,req: req, currentUrl: req.url}
      res.render("shop/userProfiles/myProfile",data);
    } catch (error) {}
  },

  category: async (req, res) => {
    try {
      const category = req.params.id;
      const products = await Product.find({ category: category });
      res.redirect(
        "/shop?array=" + encodeURIComponent(JSON.stringify(products))
      );
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  checkOut: async (req, res, next) => {
    try {
      const user = req.session.user;
      const userId=req.session.user._id
      const Addresses = await Address.find({ user: req.session.user._id });
      const cart = await Cart.findOne({ user: user._id }).populate(
        "products.productId"
      );
      const products = cart.products;
      let total = await userHelper.getCartTotal(user);
      let coupon=await Coupon.find()
      const wallet=await walletSchema.findOne({user:userId})    
      const data = { user,coupon, total,wallet,Addresses, cart, products,req: req, currentUrl: req.url };
      res.render("shop/checkOut", data);
    } catch (error) {
      res.status(500).render('error', { error });
    }
  },

  productDetails: async (req, res, next) => {
    try {
      let productId = req.params.id;
      const user = req.session.user;
      const product = await Product.findById(productId);
      const brand = await Brand.findById(product.brand);
      const cart = await Cart.findOne({ user: user }).populate(
        "products.productId"
      );
      const data = { user, req: req, currentUrl: req.url,product,brand, cart, };
      res.render("shop/components/products/productDetails", data);
    } catch (error) {
      res.status(500).render('error', { error });
    }
  },

  shopCartPage: async (req, res) => {
    try {
      const user = req.session.user;
      const message = req.session.message;
      const data = {
        user,
        message,
        req: req,
        currentUrl: req.url,
      };
      const cart = await Cart.findOne({ user: user._id }).populate(
        "products.productId"
      );
      if (!cart) {
        res.render("shop/emptyCart", data);
        return;
      } else {
        const products = cart.products;
        const message = req.session.message;
        const countCart = products.length;
        let total = await userHelper.getCartTotal(user);
        const data = {
          user,
          products,
          countCart,
          message,
          cart,
          total,
          req: req,
          currentUrl: req.url,
        };
        res.render("shop/shopCart", data);
      }
    } catch (error) {
      console.error(error);
      res.render("catchError", {
        message: error.message,
        user: req.session.user,
      });
    }
  },
  addToCart: async (req, res) => {
    console.log(req.body);
    try {
      let userId = req.session.user._id;
      count = await userHelper.getCartCount(userId)
      userHelper.addToCart(userId, req.body).then((response) => {
        res.json(response);
      });
    } catch (error) {
      res.status(500).render('error', { error });
    }
  },
  changeQuantity: async (req, res, next) => {
    let userid = req.session.user;
    userHelper.changeProductQuantity(req.body).then(async (response) => {
      await userHelper.getCartTotal(userid).then((total) => {
        res.json({ response: response, total: total });
      });
    });
  },
  deleteCartProduct: async (req, res) => {
    let { productId } = req.body;
    let userId = req.session.user._id;
    try {
      const response = await userHelper.deleteProductCart(userId, productId);
      if (response.status) {
        res.json({ success: true, message: response.message });
      } else {
        res.json({ success: false, message: response.message });
      }
    } catch (error) {
      res.status(500).render('error', { error });
    }
  },

  addAddress: async (req, res) => {
    try {
      let userId = req.session.user._id;

      const Addresses = userHelper
        .addAddress(req.body, userId)
        .then((response) => {
          res.redirect("/checkOut");
        });
    } catch (error) {
      res.status(500).render('error', { error });
    }
  },

  editAddress: async (req, res) => {
    try {
      let address = await userHelper.getAnAddress(req.params.id);
      res.json({ address: address });
    } catch (error) {
      res.status(500).render('error', { error });
    }
  },
  editAddressPost: async (req, res) => {
    try {
      let addressUpdated = await userHelper.editAnAddress(req.body);
      res.json({ message: "address updated" });
    } catch (error) {
      res.status(500).render('error', { error });
    }
  },
  deleteAddress: async (req, res) => {
    const addressId = req.body.addressId;
    try {
      await Address.findByIdAndUpdate(addressId, { addStatus: false });
      res.status(200).json({ message: "Address deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting address" });
    }
  },
  addAddressProfile: async (req, res) => {
    try {
      let userId = req.session.user._id;
      await userHelper.addAddressProfile(req.body, userId);
      res.json({ success: "Address added successfully." });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ error: "An error occurred while adding the address." });
    }
  },

  placeOrder: async (req, res) => {
    try {
      let userId = req.session.user._id;      
      const cartItems = await Cart.findOne({ user: userId }).populate(
        {
          path: 'products.productId',
          select: 'productPrice',
        }
      );
      if (!cartItems.products.length) {
        return res.json({
          error: true,
          message: "Please add items to cart before checkout",
        });
      }
      if (req.body.address_id == undefined) {
        return res.json({ error: true, message: "Please Choose Address" });
      }
      if (req.body.payment_method == undefined) {
        return res.json({
          error: true,
          message: "Please Choose Payment Method",
        });
      }      
      const totalAmount = req.body.total;
      let orderId = await userHelper.orderPlacing(
        req.body,
        totalAmount,
        cartItems,
        userId,
        
      );
      if (req.body.payment_method == "COD") {
        await productHelper.decreaseStock(cartItems);
        res.status(202).json({ status: true });
      }
      else if (req.body.payment_method == 'wallet') {
        let isPaymentDone = await walletHelper.payUsingWallet(userId, totalAmount);
        if (isPaymentDone) {

           await Order.findOneAndUpdate(
            { _id: orderId },
            {
              $set: { 
                orderStatus: "placed"
              }
            })
          await productHelper.decreaseStock(cartItems);
          res.status(202).json({status:true, orderId:orderId})
        }
         else {
            res.status(200).json({ payment_method: 'wallet', error: true, msg: "Insufficient Balance in wallet" })
        }
      }
         else {
        await razorpay
          .razorpayOrderCreate(orderId, totalAmount)
          .then((response) => {
            res.status(202).json({ response, status: false });
          });
      }
    } catch (error) {
      res.status(500).send("Failed to place the order: " + error.message);
    }
  },

  applyCoupon: async (req, res) => {
    try {
      const user = req.session.user;
      const total = req.body.totalAmount;
      const couponCode = req.body.couponCode;      
      const coupon = await Coupon.findOne({ code: couponCode });
      const minimumAmt = coupon.minimumAmt;    
      if(total>minimumAmt){
        const response = await userHelper.applyCoupon(
          user._id,
          couponCode,
          total,          
        );
        res.json(response);
      }else{
        res.json({ status: false, message: "Minimum amount not met for coupon" }); 
      }      
    } catch (error) {
      res.status(500).render('error', { error });
    }
  },

  viewOrderDetails: async (req, res) => {
    try {
      const user = req.session.user;
      const orderId = req.params.id;
      let orderdetails = await Order.findOne({
        _id: orderId,
        user: req.session.user._id,
      });
      // let couponDetails=await userHelper.couponDetails(orderId)
      const address = await Address.findOne({ _id: orderdetails.address });
      let productDetails = await userHelper.getOrderedProductsDetails(orderId);
      const data= {
        user,
        orderId,
        
        address,
        orderdetails,
        productDetails,
        req: req, currentUrl: req.url 
      }
      res.render("shop/viewOrderDetails",data );
    } catch (error) {
      res.status(500).render('error', { error });
    }
  },

  getMyOrders: async (req, res) => {
    try {
      const user = req.session.user;
      const order = await Order.findOne({ user: req.session.user._id });
      let allcategory = await Category.find();
      let cartCount = await userHelper.getCartCount(req.session.user._id);
      res.render("shop/userProfiles/myProfile", {
        user,
        cartCount,
        allcategory,
        order,
      });
    } catch (error) {
      res.status(500).render('error', { error });
    }
  },
  
  getOrderPlaced: async (req, res) => {
    let orderId = req.params.id;
    const user = req.session.user;
    let allcategory = await Category.find();
    let cartCount = await userHelper.getCartCount(user);
    await userHelper.clearCart(user);
    const data= { user, cartCount, allcategory, orderId,req: req, currentUrl: req.url  }
    res.render("shop/orderPlaced",data );
  },
  cancelOrder:async(req,res)=>{ 
    try {
      let orderId=req.params.id
      let userId=req.session.user._id
     const cancelledResponse= await Order.findOneAndUpdate(
        { _id: orderId },
        {
          $set: { 
            orderStatus: "Cancelled"
          }
        })
        console.log(cancelledResponse); 

        if(cancelledResponse.payment_method!='COD'){
          await walletHelper.addMoneyToWallet(userId,cancelledResponse.totalAmount);
        }
        res.json({status:true})
      

         
    } catch (error) {
      res.status(500).render('error', { error });
    }
 },

  returnOrder: async (req, res) => {
    try {
      let orderId = req.params.id;
      let user = null;
      let userId = null;
      if (req.session.user) {
        user = req.session.user;
        userId = user._id;
      ;
      }
      const returnResponse= await Order.findOneAndUpdate(
        { _id: orderId },
        {
          $set: {
            orderStatus: "Return",
          },
        }
      );
      if(returnResponse.payment_method!='COD'){
        await walletHelper.addMoneyToWallet(userId,returnResponse.totalAmount);
      }
      res.json({ status: true });
    } catch (error) {
      res.status(500).render('error', { error });
    }
  },

  veryfyPayment: async (req, res) => {
    try {
      try {
        let details = req.body;
        const crypto = require("crypto");
        let hmac = crypto.createHmac("sha256", "hSg3rUTmX4OesY6Yjjd0iqhI");
        hmac.update(
          details["payment[razorpay_order_id]"] +
            "|" +
            details["payment[razorpay_payment_id]"]
        );
        hmac = hmac.digest("hex");
        let orderResponse = details["order[response][receipt]"];
        let orderObjId = new ObjectId(orderResponse);
        if (hmac === details["payment[razorpay_signature]"]) {
          await Order.updateOne(
            { _id: orderObjId },
            {
              $set: {
                orderStatus: "place",
              },
            }
          );

          res.json({ status: true });
        } else {
          await Order.updateOne(
            { _id: orderObjId },
            {
              $set: {
                orderStatus: "failed",
              },
            }
          );

          res.json({ status: false, errMsg: "" });
        }
      } catch (error) {
        console.log(error, "error");
        res.status(500).send("Internal server error");
      }
    } catch (error) {}
  },
  search: async (req, res) => {
    try {
      const count = parseInt(req.query.count) || 3;
      const page = parseInt(req.query.page) || 1;
      const totalCount = await Product.countDocuments();
      const startIndex = (page - 1) * count;
      const totalPages = Math.ceil(totalCount / count);
      const randomOffset = Math.floor(Math.random() * (totalCount - count));
      const endIndex = Math.min(count, totalCount - startIndex);
      const pagination = {
        totalCount: totalCount,
        totalPages: totalPages,
        page: page,
        count: count,
        startIndex: startIndex,
        endIndex: endIndex,
      };
      const user = req.session.user;
      const query = req.query.query;
      const viewCategory = await adminHelpers.getAllCategory();
      const viewBrand = await adminHelpers.getAllBrand();
      const product = await Product.find({
        productName: { $regex:new RegExp('^' + query, 'i') },
      })
        .skip(randomOffset + startIndex)
        .limit(count)
        .lean();
        const data={
          user,
          product,
          viewCategory,
          viewBrand,
          pagination,
          req: req, currentUrl: req.url
        }
      res.render("shop/products",data );
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  },
  wishlist: async (req, res) => {
    try {
      const { user } = req.session;
      const userId = user ? user._id : null;
      const [wishListCount, cartCount] = await Promise.all([
        userId ? wishlisthelper.getWishListCount(userId) : null,
        userId ? userHelper.getCartCount(userId) : null,
      ]);

      let wishList = await wishlisthelper.getAllWishListItems(userId);
      console.log(wishList);

      const data = {
        wishList,
        req: req,
        currentUrl: req.url,
        user,
        wishListCount,
        cartCount,
      };

      res.render("shop/wishlist", data);
    } catch (error) {
      res.redirect("404");
    }
  },

  addToWishList: async (req, res) => {
    try {
      let productId = req.body.productId;
      let userId = req.session.user ? req.session.user._id : null;
      let response = await wishlisthelper.addItemToWishList(productId, userId);
      res.json(response);
    } catch (error) {
      res.status(500).render('error', { error });
    }
  },
  
  removeFromWishList: async (req, res) => {
    try {
      let userId = req.session.user._id;
      let productId = req.params.id;
      let response = await wishlisthelper.removeAnItemFromWishList(
        userId,
        productId
      );
      wishListCount = await wishlisthelper.getWishListCount(userId);      
      console.log(wishListCount);
      if (response.status) {
        res.json({ success: true, message: response.message });
      } else {
        res.json({ success: false, message: response.message });
      }
    } catch (error) {
      res.status(500).render('error', { error });
    }
  },


  
};

