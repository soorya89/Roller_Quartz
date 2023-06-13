const dotenv = require("dotenv");
dotenv.config();
const User = require("../model/usermodel");
const adminHelpers = require("../helpers/adminHelpers");
const Product = require("../model/productmodel");
const Category = require("../model/categorymodel");
const Brand = require("../model/brandmodel");
const Order = require("../model/ordermodel");
const Offer = require("../model/offermodel");
const Address = require("../model/addressmodel");
const ObjectId = require("mongoose").Types.ObjectId;
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const generateSalesReport = require("../config/pdfkit");

const toastr = require("toastr");
const { DataSessionInstance } = require("twilio/lib/rest/wireless/v1/sim/dataSession");
module.exports = {
  AdminHomePage: async (req, res) => {
    try {
      const orderStatus = await adminHelpers.getAllOrderStatusesCount();
      const chartData = await adminHelpers.getChartDetails();
      const dashboardDetails = await adminHelpers.getDashboardDetails();
    
      dashboardDetails.totalRevenue = currencyFormat(
        dashboardDetails.totalRevenue
      );
      dashboardDetails.monthlyRevenue = currencyFormat(
        dashboardDetails.monthlyRevenue
      );
     const data={ dashboardDetails,
      req: req, currentUrl: req.url,
      chartData,
      orderStatus,}
      res.render("admin/adminHome", data);
    } catch (err) {
      console.log(err);
    }
  },

  AdminloginPage: (req, res) => {
    if (req.session.admin) {
      res.redirect("/admin");
    } else {
      res.render("admin/adminLogin");
    }
  },

  AdminloginPost: (req, res) => {
    console.log(req.body.email);
    console.log(req.body.password);
    if (
      req.body.email === process.env.ADMIN_EMAIL &&
      req.body.password === process.env.ADMIN_PASSWORD
    ) {
      req.session.admin = true;
      res.redirect("/admin");
    } else {
      res.redirect("/admin/login");
    }
  },
  AdminlogoutGet: async (req, res) => {
    try {
      if (req.session.admin) {
        // req.session.destroy();
        req.session.admin = false;
        res.redirect("/admin");
      }
    } catch (error) {
      console.log(error);
    }
  },

  AdminlogoutGet: (req, res) => {
    req.session.admin = false;
    res.redirect("/admin");
  },

  //order management

  orderList: async (req, res) => {
    try {
      const Orders = await Order.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $sort: {
            createdAt: -1, 
          },
        },
      ]);

      if (req.session.admin) {
     const data={ Orders: Orders, req: req, currentUrl: req.url }
        res.render("admin/orderList",data );
      } else {
        res.redirect("/admin/login");
      }
    } catch (err) {
      console.log(err);
    }
  },
  getOrderDetails: async (req, res, next) => {
    let orderId = req.params.id;

    try {
      const order = await Order.aggregate([
        { $match: { _id: new ObjectId(orderId) } },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $lookup: {
            from: "products",
            localField: "orderedItems.productId",
            foreignField: "_id",
            as: "orderedItems.productId",
          },
        },
        {
          $lookup: {
            from: "addresses",
            localField: "address",
            foreignField: "_id",
            as: "address",
          },
        },
      ]);
      const data={ Order: order[0],req: req, currentUrl: req.url }
      res.render("admin/orderDetails",data );
    } catch (err) {
      console.log(err);
    }
  },

  cancelOrder: async (req, res) => {
    try {
      let orderId = req.params.id;

      await Order.updateOne(
        { _id: orderId },
        {
          $set: {
            orderStatus: "Cancelled",
          },
        }
      );
      res.json({ status: true });
    } catch (error) {}
  },
  deliverOrder: async (req, res) => {
    try {
      let orderId = req.params.id;

      await Order.updateOne(
        { _id: orderId },
        {
          $set: {
            orderStatus: "delivered",
          },
        }
      );
      res.json({ status: true });
    } catch (error) {}
  },

  //coupon management

  coupons: async (req, res) => {
    try {
      let coupons = await adminHelpers.getAllCoupons();
    const data={ coupons,req: req, currentUrl: req.url, }
      res.render("admin/coupon",data );
    } catch (error) {
      console.log(error);
    }
  },
  addCouponPost: async (req, res) => {
    adminHelpers.addCoupon(req.body).then((coupon) => {
      res.status(202).redirect("/admin/coupon");
    });
  },
  editCoupon: async (req, res) => {
    try {
      const couponData = await adminHelpers.getCouponData(req.params.id);
      res.status(200).json({ couponData });
    } catch (error) {
      console.log(error);
    }
  },
  editCouponPost: (req, res) => {
    try {
      const response = adminHelpers.editCoupon(req.body);
      // res.status(202).json({message:"coupon details updated"})
      res.redirect("/admin/coupon");
    } catch (error) {
      console.log(error);
    }
  },
  deleteCoupon: async (req, res) => {
    try {
      const response = await adminHelpers.deleteCoupon(req.params.id);
      res.json({ message: "coupon deleted successfully" });
    } catch (error) {
      console.log(error);
    }
  },

  //offer management
  offers: async (req, res) => {
    try {
     
      const viewCategory = await adminHelpers.getAllCategory();
      let offers = await adminHelpers.getAllOffers();
      const data={viewCategory,offers,req: req, currentUrl: req.url}
      res.render("admin/offer",data);
    } catch (error) {
      console.log(error);
    }
  },


addOfferPost: async (req, res) => {
  try{
    console.log(req.body);
    adminHelpers.addOffer(req.body).then((offer) => {
      res.status(202).redirect("/admin/offer");
    });
  }catch(error){
    console.log(error);
  }
  
},
deleteOffer: async (req, res) => {
  try {
    const response = await adminHelpers.deleteOffer(req.params.id);
    res.json({ message: "coupon deleted successfully" });
  } catch (error) {
    console.log(error);
  }
},
activeOffer:async(req,res)=>{
  try{
    
   const response = await adminHelpers.activeOffer(req.params.id)  
   res.json(response)
  }catch(error){

  }
},
deActiveOffer:async(req,res)=>{
  try{  
   const response = await adminHelpers.deActiveOffer(req.params.id)   
   res.json(response)
  }catch(error){

  }
},
      
  //User list

  userlist: async (req, res) => {
    try {
      let adminDetails = req.session.admin;
      const userList = await User.find({});
      const data={ userList, admin: true, adminDetails ,req: req, currentUrl: req.url}
      res.render("admin/userList",data );
    } catch (error) {
      console.log(error);
    }
  },
  viewDetails: async (req, res) => {
    let userId = req.params.id;
    try {
      const user = await User.findById(userId);
      const data={ user ,req: req, currentUrl: req.url}
      res.render("admin/viewDetails",data );
    } catch (error) {
      console.log(error);
    }
  },
  BlockUser: async (req, res) => {
    if (req.session.admin) {
      let userId = req.params.id;

      try {
        await adminHelpers.blockUser(userId);

        req.session.user = false;
        res.redirect("/admin/userList");
      } catch (error) {
        console.error(error);
      }
    }
  },
  UnblockUser: async (req, res) => {
    if (req.session.admin) {
      let userId = req.params.id;

      try {
        await adminHelpers.unblockUser(userId);
        res.redirect("/admin/userList");
      } catch (error) {
        console.log(error);
      }
    }
  },

  // product

  productListPage: async (req, res) => {
    try {
      const viewCategory = await adminHelpers.getAllCategory();
      const viewBrand = await adminHelpers.getAllBrand();
      let productList = await Product.find({}).sort({ createdAt: -1 });

      const data={
        product: productList,
        viewCategory,
        viewBrand,
        req: req, currentUrl: req.url
      }
      res.render("admin/productList",data );
    } catch (error) {
      console.log(error);
    }
  },
  productList: async (req, res) => {
    const products = await Product.find();
    const viewCategory = await adminHelpers.getAllCategory();
    const viewBrand = await adminHelpers.getAllBrand();
    try {
     
      if (req.session.admin) {
        const data= {
          product: products,
          viewCategory,
          viewBrand,
          req: req, currentUrl: req.url
        }
        res.render("admin/productList",data);
      } else {
        res.redirect("/admin/login");
      }
    } catch (err) {
      console.log(err);
    }
  },
  addProducts: async (req, res) => {
    try {
      if (req.session.admin) {
        const viewBrand = await adminHelpers.getAllBrand();
        const viewCategory = await adminHelpers.getAllCategory();
        const data={ viewCategory, viewBrand,req: req, currentUrl: req.url }
        res.render("admin/addProducts", data);
      } else {
        res.redirect("/admin/login");
      }
    } catch (err) {
      console.log(err);
    }
  },
  addProductPost: async (req, res) => {
    const productDetails = req.body;

    const image = req.files;

    try {
      await adminHelpers.addProductPost(productDetails, image);

      res.redirect("/admin/addProducts");
    } catch (error) {
      console.log(error);
    }
  },
  editProductpage: async (req, res) => {
    const viewBrand = await adminHelpers.getAllBrand();

    const viewCategory = await adminHelpers.getAllCategory();

    adminHelpers
      .editProduct(req.params.id)
      .then((response) => {
        if (response == "") {
          res.status(401).redirect("/admin");
        } else {
        const data= {
          product: response,
          viewBrand,
          viewCategory,
          req: req, currentUrl: req.url
        }
          res.status(200).render("admin/editProduct",data);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  },

  editProductPost: async (req, res) => {
    try {
      const { body, params, files } = req;
      const productDetails = { ...body, images: [] };
      if (files && files.length > 0) {
        for (const file of files) {
          const filename = file.filename;
          productDetails.images.push(filename);
        }
      }
      const updatedProduct = await adminHelpers.editProductPost(
        productDetails,
        params.id
      );

      res.status(200).redirect("/admin/productList");
    } catch (error) {
      console.log("error:", error);
      res.status(500).send("An error occurred");
    }
  },

  deleteProduct: async (req, res) => {
    let productId = req.params.id;

    try {
      await adminHelpers.deleteProduct(productId);
      res.redirect("/admin/productList");
    } catch (error) {
      console.error(error);
    }
  },

  blockProduct: async (req, res) => {
    if (req.session.admin) {
      let productId = req.params.id;
      try {
        await adminHelpers.blockProduct(productId);
        res.redirect("/admin/productList");
      } catch (error) {
        console.error(error);
      }
    }
  },
  unblockProduct: async (req, res) => {
    if (req.session.admin) {
      let productId = req.params.id;

      try {
        await adminHelpers.unblockProduct(productId);
        res.redirect("/admin/productList");
      } catch (error) {
        console.log(error);
      }
    }
  },

  //Category

  categoryPage: async (req, res) => {
    try {
      if (req.session.admin) {
        const viewCategory = await adminHelpers.getAllCategory();
        const data={
          viewCategory,req: req, currentUrl: req.url,
          error: req.flash("error"),
        }
        res.render("admin/category",data );
      } else {
        res.redirect("/admin/login");
      }
    } catch (err) {
      console.log(err);
    }
  },

  addCategory: async (req, res) => {
    try {
      const category = req.body;
      const result = await adminHelpers.addCategory(category);

      if (result.success) {
        res.status(200).json({ success: true, message: result.message });
      } else {
        res.status(400).json({ success: false, message: result.message });
      }
    } catch (error) {
      console.error("Error adding category:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while adding the category",
      });
    }
  },

  // deleteCategory: async (req, res) => {
  //   try {
  //     const categoryId = req.params.id;
  //     const products = await Product.find({ category: categoryId });
  
  //     if (products.length === 0) {
  //       const result = await Category.findByIdAndDelete(categoryId);
  //       if (result) {
  //         // Category deleted successfully
  //         res.redirect("/admin/category");
  //       } else {
  //         // Failed to delete the category
  //         res.redirect("/admin/category");
  //       }
  //     } else {
  //       const viewCategory = await adminHelpers.getAllCategory();
  //       res.render("admin/category", { existing: true, viewCategory });
  //     }
  //   } catch (error) {
  //     console.log(error);
  //     // Handle the error appropriately
  //   }
  // },
  deleteCategory: async (req, res) => {
    try {
      const categoryId = req.params.id;
      const products = await Product.find({ category: categoryId });
  
      if (products.length === 0) {
        const result = await Category.findByIdAndDelete(categoryId);
        if (result) {
          req.flash('success', 'Category deleted successfully');
        } else {
          req.flash('error', 'Failed to delete the category');
        }
        res.redirect("/admin/category");
      } else {
        const viewCategory = await adminHelpers.getAllCategory();
        res.render("admin/category", { existing: true, viewCategory });
      }
    } catch (error) {
      console.log(error);
      // Handle the error appropriately
    }
  },
  
  
  
  
  


  //Brand

  brandPage: async (req, res) => {
    try {
      if (req.session.admin) {
        const viewBrand = await adminHelpers.getAllBrand();
        const data={ viewBrand ,req: req, currentUrl: req.url}
        res.render("admin/brand",data );
      } else {
        res.redirect("/admin/login");
      }
    } catch (err) {
      console.log(err);
    }
  },
  addBrand: async (req, res) => {
    try {
      await adminHelpers.addBrand(req.body);

      res.redirect("/admin/brand");
    } catch (error) {
      console.log(error);
    }
  },
  deleteBrand: async (req, res) => {
    let productId = req.params.id;

    try {
      await Brand.findByIdAndDelete(productId);
      res.redirect("/admin/brand");
    } catch (error) {
      console.error(error);
    }
  },

  salesReportPage: async (req, res) => {
    const sales = await adminHelpers.getAllDeliveredOrders();
    console.log("sales", sales);
    sales.forEach((order) => {
      order.orderDate = dateFormat(order.orderDate);
      // order.totalAmount=dateFormat(order.totalAmount)
    });
    const data={ sales,req: req, currentUrl: req.url }
    res.render("admin/salesReport",data );
  },
  salesReport: async (req, res) => {
    console.log(req.body);
    try {
      let { startDate, endDate } = req.body;

      startDate = new Date(startDate);
      endDate = new Date(endDate);

      const salesReport = await adminHelpers.getAllDeliveredOrdersByDate(
        startDate,
        endDate
      );
      for (let i = 0; i < salesReport.length; i++) {
        salesReport[i].orderDate = dateFormat(salesReport[i].orderDate);
        salesReport[i].totalAmount = currencyFormat(salesReport[i].totalAmount);
      }
      res.status(200).json({ sales: salesReport });
    } catch (error) {
      console.log(error);
    }
  },

};

function currencyFormat(amount) {
  return Number(amount).toLocaleString("en-in", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  });
}
function dateFormat(date) {
  return date.toISOString().slice(0, 10);
}
