const walletSchema=require('../model/walletmodel');
    const ObjectId=require('mongoose').Types.ObjectId;

    module.exports={

        addMoneyToWallet:(userId,amount)=>{
            console.log("++++++++++++");
            return new Promise(async (resolve,reject)=>{
                let wallet=await walletSchema.findOne({user:userId})
                if(!wallet){
                    wallet=new walletSchema({
                        user:userId,
                        walletBalance:amount
                    })
                }else{
                    console.log(typeof wallet.walletBalance,"????");
                    wallet.walletBalance += amount;
                }

                await wallet.save();
                resolve(wallet)
            })
        },


        payUsingWallet:(userId,amount)=>{
            return new Promise(async (resolve,reject)=>{
                let wallet=await walletSchema.findOne({user:userId});
                if(wallet){
                    if(wallet.walletBalance>=amount){
                        wallet.walletBalance-=amount;
                    }else{
                        resolve(false) 
                    }
                    await wallet.save()
                    resolve(true)
                }else{
                    resolve(false) 
                }

                
             
            })
        },

        walletBalance:(userId)=>{
            return new Promise(async (resolve,reject)=>{
                await walletSchema.aggregate([
                {
                    $match:{user:new ObjectId(userId)}
                },
                {
                    $project:{walletBalance:1}
                }
                ])
                .then((balance)=>{
                    console.log("balance walletBalanceWalletHelper",balance);
                    if(!balance.length){
                        resolve(0)
                    }else{
                        resolve(balance[0].walletBalance)
                    }
                })
            })
        }
    }