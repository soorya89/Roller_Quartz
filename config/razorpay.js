const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});
module.exports = {
    razorpayOrderCreate:async(orderId,totalAmount)=>{
      console.log("888888888");
      console.log(orderId);
      console.log(totalAmount);
      try {
      
        // var instance = new Razorpay({ key_id: 'rzp_test_gFlxCSnUJ3aK5l', key_secret: 'nvm1ozXmKUEnyqNOjDJCMY80' })
        var options = {
          amount: totalAmount*100,  // amount in the smallest currency unit
          currency: "INR",
          receipt: ""+orderId
        };
        console.log("adadad");
        const order = await razorpay.orders.create (options) 
          console.log(order);
          console.log("555555");
          return order;
        
      } catch (error) {
        
      }
    }
  }