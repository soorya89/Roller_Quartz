const User = require("../model/usermodel");
const Category = require("../model/categorymodel");
const Product = require("../model/productmodel");
const Brand = require("../model/brandmodel");
const Cart = require("../model/cartModel");
const Coupon = require("../model/couponmodel");
const Order = require("../model/ordermodel");
const Offer = require("../model/offermodel");
const voucherCode = require("voucher-code-generator");

const Address = require("../model/addressmodel");
const fs = require("fs");

module.exports = {
  blockUser: async (userId) => {
    try {
      const user = await User.findById(userId);
      user.status = false;
      await user.save();
      console.log(`User with ID ${userId} has been blocked`);
    } catch (error) {
      console.error(error);
      throw new Error("Failed to block user");
    }
  },
  unblockUser: async (userId) => {
    try {
      const user = await User.findById(userId);
      user.status = true;
      await user.save();
      console.log(`User with ID ${userId}has been unblocked`);
    } catch (error) {
      console.log(error);
      throw new Error("Failed to unblock user");
    }
  },

  blockProduct: async (productId) => {
    try {
      const product = await Product.findById(productId);

      product.productStatus = false;
      await product.save();
      console.log(`Product with ID ${productId} has been blocked`);
    } catch (error) {
      console.error(error);
      throw new Error("Failed to block product");
    }
  },
  unblockProduct: async (productId) => {
    try {
      const product = await Product.findById(productId);
      product.productStatus = true;
      await product.save();
      console.log(`Product with ID ${productId}has been unblocked`);
    } catch (error) {
      console.log(error);
      throw new Error("Failed to unblock product");
    }
  },
  getAllCategory: async () => {
    try {
      const viewCategory = await Category.find({});
      return viewCategory;
    } catch (error) {
      console.log(error);
    }
  },

  getAllBrand: async () => {
    try {
      const viewBrand = await Brand.find({});

      return viewBrand;
    } catch (error) {
      console.log(error);
    }
  },
  addBrand: async (brand) => {
    try {
      const newBrand = new Brand({
        brandName: brand.brandName,
        brandDescription: brand.brandDescription,
      });
      await newBrand.save();
      return;
    } catch (error) {
      console.error("error adding brand:", error);
    }
  },

  addCategory: async (category) => {
    try {
      if (!category.CategoryName || !category.CategoryName.trim()) {
        return { success: false, message: "Category name cannot be empty" };
      }

      const specialCharsRegex = /[!@#$%^&*()+=\[\]{};':"\\|,.<>\/?]/;
      if (specialCharsRegex.test(category.CategoryName)) {
        return {
          success: false,
          message: "Category name cannot contain special characters",
        };
      }

      const existingCategory = await Category.findOne({
        CategoryName: { $regex: new RegExp(`^${category.CategoryName}$`, "i") },
      });

      if (existingCategory) {
        return { success: false, message: "Category already exists" };
      } else {
        const newCategory = new Category({
          CategoryName: category.CategoryName,
        });
        await newCategory.save();
        return { success: true, message: "Category added successfully" };
      }
    } catch (error) {
      console.error("Error adding category:", error);
      return {
        success: false,
        message: "An error occurred while adding the category",
      };
    }
  },

  getDashboardDetails: async () => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let totalRevenue, monthlyRevenue, totalProducts;

      totalRevenue = await Order.aggregate([
        {
          $match: { orderStatus: "placed" },
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$totalAmount" },
          },
        },
      ]);
      response.totalRevenue = totalRevenue[0].revenue;

      monthlyRevenue = await Order.aggregate([
        {
          $match: {
            orderStatus: "placed",
            orderDate: {
              $gte: new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                1
              ),
            },
          },
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$totalAmount" },
          },
        },
      ]);
      response.monthlyRevenue = monthlyRevenue[0]?.revenue;

      totalProducts = await Product.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: "$productQuantity" },
          },
        },
      ]);
      response.totalProducts = totalProducts[0]?.total;

      response.totalOrders = await Order.find({
        orderStatus: "placed",
      }).count();

      response.numberOfCategories = await Category.find({}).count();

      resolve(response);
    });
  },
  getChartDetails: () => {
    return new Promise(async (resolve, reject) => {
      const orders = await Order.aggregate([
        {
          $match: { orderStatus: "delivered" },
        },
        {
          $project: {
            _id: 0,
            orderDate: "$createdAt",
          },
        },
      ]);

      let monthlyData = [];
      let dailyData = [];

      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];

      let monthlyMap = new Map();
      let dailyMap = new Map();

      orders.forEach((order) => {
        const date = new Date(order.orderDate);
        const month = date.toLocaleDateString("en-US", { month: "short" });

        if (!monthlyMap.has(month)) {
          monthlyMap.set(month, 1);
        } else {
          monthlyMap.set(month, monthlyMap.get(month) + 1);
        }
      });

      for (let i = 0; i < months.length; i++) {
        if (monthlyMap.has(months[i])) {
          monthlyData.push(monthlyMap.get(months[i]));
        } else {
          monthlyData.push(0);
        }
      }

      //taking the count of orders in each day of a week
      orders.forEach((order) => {
        const date = new Date(order.orderDate);
        const day = date.toLocaleDateString("en-US", { weekday: "long" });

        if (!dailyMap.has(day)) {
          dailyMap.set(day, 1);
        } else {
          dailyMap.set(day, dailyMap.get(day) + 1);
        }
      });

      for (let i = 0; i < days.length; i++) {
        if (dailyMap.has(days[i])) {
          dailyData.push(dailyMap.get(days[i]));
        } else {
          dailyData.push(0);
        }
      }

      resolve({ monthlyData: monthlyData, dailyData: dailyData });
    });
  },
  getAllOrderStatusesCount: async () => {
    try {
      const orderStatuses = await Order.find().select({
        _id: 0,
        orderStatus: 1,
      });

      const eachOrderStatusCount = orderStatusCount(orderStatuses);

      return eachOrderStatusCount;
    } catch (error) {
      console.log(error);
    }
  },

  deleteBrand: async (productId) => {
    try {
      await Product.findOneAndDelete(
        productId,
        { isListed: true },
        { new: true }
      );
      return;
    } catch (error) {
      console.error("Error updating product:", error);
    }
  },
  deleteProduct: async (productId) => {
    try {
      await Product.findOneAndDelete(productId);
      return;
    } catch (error) {
      console.error("Error updating category:", error);
    }
  },
  addProductPost: async (productDetails, image) => {
    if (productDetails.productStatus == "Unlisted") {
      productDetails.productStatus = false;
    } else {
      productDetails.productStatus = true;
    }
    try {
      const newProduct = new Product({
        productName: productDetails.productName,
        productColor: productDetails.productColor,
        brand: productDetails.viewBrandId,
        productDescription: productDetails.productDescription,
        productPrice: productDetails.productPrice,
        productSize: productDetails.productSize,
        category: productDetails.viewCategoryId,
        productStatus: productDetails.productStatus,
        productQuantity: productDetails.productQuantity,
        productImage: image.map((image) => image.filename),
      });
      await newProduct.save();
      return;
    } catch (error) {
      console.log(error);
    }
  },
  editProduct: (productId) => {
    return new Promise(async (resolve, reject) => {
      await Product.findById({ _id: productId })
        .then((result) => {
          resolve(result);
        })
        .catch((error) => {
          console.log(error);
        });
    });
  },

  editProductPost: async (productDetails, productId) => {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      if (productDetails.images && productDetails.images.length > 0) {
        // Convert images array to a single-level array
        productDetails.images = productDetails.images.flat();

        // Update the product image field with the new images
        product.productImage = productDetails.images;
      }

      // Update the featured image if provided in the productDetails
      if (productDetails.featuredImage !== undefined) {
        product.featuredImage = productDetails.featuredImage;
      }

      // Update the other product fields if they are provided in the productDetails
      if (productDetails.productName) {
        product.productName = productDetails.productName;
      }
      if (productDetails.productDescription) {
        product.productDescription = productDetails.productDescription;
      }
      if (productDetails.productColor) {
        product.productColor = productDetails.productColor;
      }
      if (productDetails.viewCategoryId) {
        product.category = productDetails.viewCategoryId;
      }
      if (productDetails.viewBrandId) {
        product.brand = productDetails.viewBrandId;
      }
      if (productDetails.productPrice) {
        product.productPrice = productDetails.productPrice;
      }
      if (productDetails.productQuantity) {
        product.productQuantity = productDetails.productQuantity;
      }

      const updatedProduct = await product.save();
      console.log("Updated Product:", updatedProduct);

      return updatedProduct;
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
  deleteCategory: (categoryId) => {
    return new Promise(async (resolve, reject) => {
        try {  
        await Category.deleteOne({categoryId})
        .then((response) => {
            resolve(response)
        })
        } catch (error) {
            reject(error)
        }
    })
},
  
  
  addCoupon: (couponData) => {
    return new Promise(async (resolve, reject) => {
      const dateString = couponData.couponExpiry;
      const [day, month, year] = dateString.split(/[-/]/);
      const date = new Date(`${year}-${month}-${day}`);
      const convertedDate = date.toISOString();

      let couponCode = voucherCode.generate({
        length: 6,
        count: 1,
        charset: voucherCode.charset("alphabetic"),
      });

      console.log("voucher code generator", couponCode[0]);

      console.log(convertedDate);

      const coupon = await new Coupon({
        couponName: couponData.couponName,
        code: couponCode[0],
        discount: couponData.couponAmount,
        minimumAmt:couponData.minimumAmt,
        expiryDate: convertedDate,
      });

      await coupon
        .save()
        .then(() => {
          resolve(coupon._id);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  getCouponData: (couponId) => {
    return new Promise(async (resolve, reject) => {
      await Coupon.findOne({ _id: couponId }).then((result) => {
        resolve(result);
      });
    });
  },
  editCoupon: (couponAfterEdit) => {
    return new Promise(async (resolve, reject) => {
      let coupon = await Coupon.findById({ _id: couponAfterEdit.couponId });
      coupon.couponName = couponAfterEdit.couponName;
      // coupon.code =couponAfterEdit.couponCode;
      coupon.discount = couponAfterEdit.couponAmount;
      coupon.expiryDate = couponAfterEdit.couponExpiry;

      await coupon.save();
      resolve(coupon);
    });
  },
  deleteCoupon: (couponId) => {
    return new Promise(async (resolve, reject) => {
      let result = await Coupon.findOneAndDelete({ _id: couponId });
      resolve(result);
    });
  },

  getAllCoupons: () => {
    return new Promise(async (resolve, reject) => {
      await Coupon.find().then((result) => {
        resolve(result);
      });
    });
  },

  addOffer: (offerData) => {
    console.log(offerData);
    return new Promise(async (resolve, reject) => {
      const dateString = offerData.endDate;
      const [year, month, day] = dateString.split(/[-/]/);
      const date = new Date(`${year}-${month}-${day}`);
      const convertedDate = date.toISOString();


      console.log(convertedDate);

      const offer = await new Offer({
        title: offerData.name,
        discount: offerData.discount,
        category: offerData.categoryname,
        endDate: convertedDate,
      });

      await offer
        .save()
        .then(() => {
          resolve(offer._id);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  getAllOffers: () => {
    return new Promise(async (resolve, reject) => {
      await Offer.aggregate([
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categoryDetails",
          },
        },
      ]).then((result) => {
        console.log(result[0].categoryDetails[0].CategoryName)
        resolve(result);
      });
    });
  },
  deleteOffer: (offerId) => {
    return new Promise(async (resolve, reject) => {
      let result = await Offer.findOneAndDelete({ _id: offerId });
      resolve(result);
    });
  },

  activeOffer:async(offerId)=>{
    try{
      console.log(offerId,'iiii')
      const offer = await Offer.findById(offerId)
      console.log(offer,'ooooo')
      const prodList = await Product.find({category:offer.category})
      console.log(prodList)
      for(const product of prodList){
        product.productPrice=product.productPrice-offer.discount
        product.save()
      }
     
 await Offer.updateOne(
  {_id:offerId},
  {
    $set:{
      status:true
    }
  }
 )
 return {status:true,message:'applied'}

    }catch(error){

    }
   
  },
 deActiveOffer:async(offerId)=>{
    try{   
      const offer=await Offer.findById(offerId)
      const prodList = await Product.find({category:offer.category})
      console.log(prodList)
      for(const product of prodList){
        product.productPrice=product.productPrice+offer.discount
        product.save()
      }
      await Offer.updateOne(
        {_id:offerId},
        {
          $set:{
            status:false
          }
        }
       )
       return {status:false,message:'applied'}
    }catch(error){

    }
   
  },

  getAllDeliveredOrders: () => {
    return new Promise(async (resolve, reject) => {
      await Order.aggregate([
        {
          $match: { orderStatus: "delivered" },
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "userDetails",
          },
        },
      ]).then((result) => {
        resolve(result);
      });
    });
  },
  getAllDeliveredOrdersByDate: (startDate, endDate) => {
    console.log(endDate);
    return new Promise(async (resolve, reject) => {
      await Order.find({
        orderDate: { $gte: startDate, $lte: endDate },
        orderStatus: "delivered",
      })
        .lean()
        .then((result) => {
          console.log("orders in range", result);
          resolve(result);
        });
    });
  },
};
function orderStatusCount(orderStatuses) {
  //to display on doughnut chart
  let counts = {};

  orderStatuses.forEach((oneStatus) => {
    let status = oneStatus.orderStatus;
    // console.log(typeof status);
    if (counts[status]) {
      counts[status]++;
    } else {
      counts[status] = 1;
    }

    console.log(status);
    //need to remove after adding razorpay

    // counts.cancelPending = 3;
    // counts.canceled = 3
  });

  return counts;
}
