const  express = require('express');
const  router = express();
const  shopController=require('../controller/shopController')
const  {userCheck} =require('../middlewares/sessionHandling')
/* GET Shop router listing */
router.get('/',userCheck,shopController.home)
router.get('/landingpage',shopController.landingpage)
router.get('/login',shopController.login)
router.get('/product',shopController.product)
router.get('/about',shopController.about)
router.get('/contact',shopController.contact)
router.get('/register',shopController.register)
router.get('/logout',shopController.logout)
router.get('/myprofile',userCheck,shopController.myProfile)
router.get('/productDetails/:id',shopController.productDetails)
router.get('/otpsend',shopController.getotpsend)
router.get('/otpvarify',shopController.getOtpvarify)
router.get('/shopCart',userCheck,shopController.shopCartPage)


router.post('/addToCart',userCheck,shopController.addToCart)
router.get('/checkOut',userCheck,shopController.checkOut)
router.get("/orderPlaced",userCheck,shopController.getOrderPlaced)
router.put('/cancelOrder/:id',userCheck,shopController.cancelOrder)
router.put('/returnOrder/:id',userCheck,shopController.returnOrder)
router.get('/category/:id',shopController.category)

/* POST Shop router listing */

router.post('/changeQuantity',userCheck,shopController.changeQuantity)
router.post('/register',shopController.postSignup)
router.post('/login',shopController.postlogin)
router.post('/generateOtp',shopController.generateOtp)
router.post('/verifyOtp',shopController.verifyOtp)

router.post('/deleteCartProduct',shopController.deleteCartProduct)
router.post('/addAddress',userCheck,shopController.addAddress)
router.get('/editAddress/:id',userCheck,shopController.editAddress)
router.post('/editAddressPost',userCheck,shopController.editAddressPost)
router.post("/deleteAddress", userCheck, shopController.deleteAddress);
// router.put('/deleteaddress/:id',userCheck,shopController.deleteaddress)
router.post("/addAddressProfile", userCheck, shopController.addAddressProfile);

router.post('/placeOrder',userCheck,shopController.placeOrder)
router.get("/GetMyOrders",userCheck,shopController.getMyOrders)
router.get("/viewOrderDetails/:id",shopController.viewOrderDetails)
router.post('/verify-payment',shopController.veryfyPayment)
router.post('/applyCoupon',userCheck,shopController.applyCoupon)
router.get('/search',shopController.search)


router.get('/wishlist',userCheck,shopController.wishlist);
router.post('/add-to-wishList',userCheck,shopController.addToWishList);
router.put('/removeWishList/:id',shopController.removeFromWishList)
module.exports = router;
