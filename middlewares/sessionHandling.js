module.exports ={
    userAuthenticationCheck: async (req,res,next)=>{
        try{
           if(req.session.user){
            
            next();
           }else{
           res.status(200).redirect('/landingpage')
           }
        }catch(error){
            res.status(500).send({message: "Inernal error occured"})
        }
    },
    userCheck: async (req,res,next) =>{
        try{
            if(req.session.user){
                next()
            }else{
                res.status(200).redirect('/landingpage') 
            }
        }catch(error){
            res.status(500).send({message: "Inernal error occured"})
        }
    },
//    adminAuthenticationChecking: async (req,res,next)=>{
//         try{
//             if(req.session.admin){
//                 res.render("admin/admin-home");
//             }else{
//                 next()
//             }
//         }catch(error){
//             res.status(500).send("Inernal error occured")
//         }
//     },
    
    adminCheck:(req,res,next)=>{
        try {
            if(req.session.admin){
                next()
            }else{
                res.status(200).redirect('/admin/login')
            }
        } catch (error) {
            res.status(500).send("Inernal error occured")
        }
    }
}

