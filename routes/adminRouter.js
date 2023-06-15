const express = require('express');
const router = express();
const adminController=require('../controller/adminController')
const  {adminCheck} =require('../middlewares/sessionHandling')
router.get('/',adminCheck,adminController.AdminHomePage)
router.get('/login',adminController.AdminloginPage)

router.post('/login',adminController.AdminloginPost)
router.get('/logout',adminCheck,adminController.AdminlogoutGet)
router.get('/userList',adminCheck,adminController.userlist)
router.put('/blockuser/:id',adminCheck,adminController.BlockUser)
router.put('/unblockuser/:id',adminCheck,adminController.UnblockUser)
router.get('/viewDetails/:id',adminCheck,adminController.viewDetails)
router.get('/productList',adminCheck,adminController.productListPage)
router.get('/addProducts',adminCheck,adminController.addProducts)
router.get('/editProduct/:id',adminCheck,adminController.editProductpage)
router.post('/editProduct/:id',adminCheck,adminController.editProductPost)

router.put('/blockProduct/:id',adminCheck,adminController.blockProduct)
router.put('/unblockProduct/:id',adminCheck,adminController.unblockProduct)

router.get('/category',adminController.categoryPage)
router.get('/brand',adminController.brandPage)
router.get('/deleteCategory/:id',adminController.deleteCategory)
router.get('/deleteProduct/:id',adminController.deleteProduct)
router.put('/deleteBrand/:id',adminController.deleteBrand)
router.post('/createcategory',adminController.addCategory)
router.post('/createbrand',adminController.addBrand)

router.post('/addProducts',adminCheck,adminController.addProductPost)

router.get('/orderList',adminCheck,adminController.orderList);
router.get('/orderDetails/:id',adminCheck,adminController.getOrderDetails)

router.get('/coupon',adminCheck,adminController.coupons)
router.post('/addCoupon',adminCheck,adminController.addCouponPost)
router.get('/editCoupon/:id',adminCheck,adminController.editCoupon)
router.post('/edit-coupon',adminCheck,adminController.editCouponPost)
router.get('/deleteCoupon/:id',adminCheck,adminController.deleteCoupon)
router.get('/salesReport',adminCheck,adminController.salesReportPage);
router.post('/sales-report',adminCheck,adminController.salesReport);
router.put('/cancelOrder/:id',adminCheck,adminController.cancelOrder)
router.put('/deliverOrder/:id',adminCheck,adminController.deliverOrder)
router.get("/offer", adminCheck, adminController.offers);
router.post("/addOffer", adminCheck, adminController.addOfferPost);
router.get('/deleteOffer/:id',adminCheck,adminController.deleteOffer)
router.put('/activeOffer/:id',adminCheck,adminController.activeOffer)
router.put('/deActiveOffer/:id',adminCheck,adminController.deActiveOffer)
router.post('/changeStatus/:id',adminCheck,adminController.getChangeStatus)

router.get('/banner',adminCheck,adminController.getBanner)
router.post('/addBanner',adminCheck,adminController.addBanner)

module.exports = router;
