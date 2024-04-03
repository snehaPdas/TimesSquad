
const mongoose = require("mongoose");


const User=require("../Models/userSchema")
const Cart=require("../Models/cartSchema")
const Product=require("../Models/productSchema")
const Order=require("../Models/orderSchema")
const Address=require("../Models/addressSchema")
const getCheckout=async(req,res)=>{
    try {
        const userId=req.session.user
        const userCart=await Cart.findOne({user:userId}).populate('items.product')
        
        const findUser = await User.findOne({ user: userId })
        const addressData = await Address.findOne({ userId: userId })
         
        if(userCart){
            res.render("user/checkoutCart",{userCart,userAddress:addressData})
        }else{
            res.render("user/checkoutCart",{userCart:null})
        }
        
    } catch (error) {
        console.log(error)
    }
}
const getCheckoutAddressEdit=async(req,res)=>{
    try {
        const addressId=req.query.id
        const user=req.session.user
        const currentAddress=await Address.findOne({"address._id":addressId})
        const addressData=currentAddress.address.find((item)=>{
        return item._id.toString()===addressId.toString()
         })
         res.render("user/checkoutedit-address",{address:addressData,user:user})
} catch (error) {
        console.error(error)
        
    }
}

const postCheckoutEditAddress=async(req,res)=>{
    try {
        const data=req.body
        const addressId=req.query.id
        const user=req.session.user
        const findAddress=await Address.findOne({"address._id":addressId})
        const matchedAddress=findAddress.address.find(item=>item._id.toString()===addressId.toString())
        await Address.updateOne({
            "address._id": addressId,
                "_id": findAddress._id,
        },{
            $set:{
                "address.$":{
                    _id: addressId,
                        addressType: data.addressType,
                        name: data.name,
                        city: data.city,
                        landMark: data.landMark,
                        state: data.state,
                        pincode: data.pincode,
                        phone: data.phone,
                        altPhone: data.altPhone,
                },
            }
        }).then((result)=>{
            res.redirect("/checkout")
        })
} catch (error) {
        console.log(error.message)
    }
}

const CheckoutAddressAddPage = async (req, res) => {
    try {
        const user = req.session.user
        res.render("user/checkoutadd-address", { user: user })
    } catch (error) {
        console.log(error.message);
    }
}
const postcheckoutAddress = async (req, res) => {
    try {
        const user = req.session.user
        
        const userData = await User.findOne({ _id: user })
        const {
            addressType,
            name,
            city,
            landMark,
            state,
            pincode,
            phone,
            altPhone,
        } = req.body;
        const userAddress = await Address.findOne({ userId: userData._id })
        
        if (!userAddress) {
        
            
            const newAddress = new Address({
                userId: userData._id,
                address: [
                    {
                        addressType,
                        name,
                        city,
                        landMark,
                        state,
                        pincode,
                        phone,
                        altPhone,
                    },
                ]
            })
            await newAddress.save()
        } else {
            
            userAddress.address.push({
                addressType,
                name,
                city,
                landMark,
                state,
                pincode,
                phone,
                altPhone,
            })
            await userAddress.save()
        }

        res.redirect("/checkout")

    } catch (error) {
        console.log(error.message);
    }
}
const getCheckoutDeleteAddress = async (req, res) => {
    try {

        const addressId = req.query.id
        const findAddress = await Address.findOne({ "address._id":addressId })
        await Address.updateOne(
            { "address._id": addressId },
            {
                $pull: {
                    address: {
                        _id: addressId
                    }
                }
            }
        )
            .then((data) => res.redirect("/checkout")
            )
    } catch (error) {
        console.log(error.message);
    }
}

const orderPlaced = async (req, res) => {
    try {
        console.log("Placing order...");
        const { totalPrice, addressId, payment } = req.body;
        const userId = req.session.user;
        const address = await Address.findOne({ userId: userId })
        const findAddress = address.address.find(item => item._id.toString() === addressId);

        // Retrieve user's cart
        const userCart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!userCart || userCart.items.length === 0) {
            throw new Error("Cart is empty");
        }
        // Extract releva
        const products = userCart.items.map(item => ({
            product: item.product,
            quantity: item.quantity,
            
        }));
        for (const item of products) {
            // Update product quantity
            await Product.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } });
        }

        const newOrder = new Order({
            userId: userId,
            products: products,
            totalPrice: totalPrice,
            address: addressId, 
            address: findAddress,
            payment: payment,
            orderStatus: 'pending' ,
            date: Date.now()
        });
        const savedOrder = await newOrder.save();
        await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [],totalQuantity:0,totalPrice:0 } });
        if (payment === 'cod') {
            return res.status(200).json({ success: true, order: savedOrder });
        } else {
        
            return res.status(200).json({ success: true, paymentData: { /* include payment data here */ } });
        }
    } catch (error) {
        console.error("Error placing order:", error);
    
        res.status(500).json({ success: false, error: error.message });
    }
};



const getOrderDetailsPage = async (req, res) => {
    try {
        const userId = req.session.user
        const orderId = req.query.id
        const findOrder = await Order.findOne({ _id: orderId }).populate({
            path:'products.product',
            select : "productName salePrice productImage"
        })
        const findUser = await User.findOne({ _id: userId })
        console.log(findOrder, findUser);
        res.render("User/orderDetails", { orders: findOrder, user: findUser, orderId })
    } catch (error) {
        console.log(error.message);
    }
}

const cancelOrder=async(req,res)=>{
    try {
        const userId=req.session.user 
        const findUser= await User.findOne({_id:userId})
        if(!findUser){
            return res.status(404).json({message:"user not found"})}
         const orderId=req.query.orderId
         const selectedValue=req.query.selectedValue

         await Order.updateOne({ _id: orderId },
           {$set: { orderStatus: selectedValue }}
        ).then((data) => console.log("userchangeoption:",data))

        const findOrder = await Order.findOne({ _id: orderId }).populate('products.product')
        const pro=findOrder.products
        console.log("j.........",pro)
        for (const productData of findOrder.products) {
            const productId = productData.product;
            const quantity = productData.quantity;

            const product = await Product.findById(productId)

            if (product) {
                product.quantity += quantity;
                console.log("Updated quantity.............................:", product.quantity);

                await product.save();
            }
        }

        res.redirect('/profile');

        
    } catch (error) {
        console.log(error)
    }
}







const cancelOrderAdmin=async(req,res)=>{
    try {
        
    const finUser=await User.findOne({
        
        isAdmin:1
    })
    if(!finUser){
        return res.status(404).json({message:"user not found"})}
        const orderId=req.query.orderId
        const selectedValue=req.query.status
        await Order.updateOne({ _id: orderId },
            {$set: { orderStatus: selectedValue }}
         ).then((data) => console.log("userchangeoption:",data))
         const findOrder = await Order.findOne({ _id: orderId }).populate('products.product')
        const pro=findOrder.products
        console.log("jkkkk.........",pro)
        for (const productData of findOrder.products) {
            const productId = productData.product;
            const quantity = productData.quantity;

            const product = await Product.findById(productId)

            if (product) {
                product.quantity += quantity;
                console.log("Updated quantity adminside.............................:", product.quantity);

                await product.save();
            }
        }
        res.redirect("/admin/orderList")

        
    } catch (error) {
        console.log(error)
    }
    

}








const getOrderListPageAdmin=async(req,res)=>{
    try {
        const orders = await Order.find({}).sort({ createdAt: -1 }).populate({
            path:'products.product',
            select : "salePrice"
        });

        orders.forEach(order => {
            const timestamp = parseInt(order.date);
            order.createdOn = new Date(timestamp);
            
        });
        let itemsPerPage = 5
        let currentPage = parseInt(req.query.page) || 1
        let startIndex = (currentPage - 1) * itemsPerPage
        let endIndex = startIndex + itemsPerPage
        let totalPages = Math.ceil(orders.length / 3)
        const currentOrder = orders.slice(startIndex, endIndex)

        res.render("Admin/orderlist", { orders: currentOrder, totalPages, currentPage })
    } catch (error) {
        console.log(error.message);
    }
}




const getOrderDetailsPageAdmin=async(req,res)=>{
    try {   
       const orderId=req.query.id
        findOrder=await Order.findOne({_id:orderId}).populate({
            path:'products.product',
            select : "productName salePrice productImage"
        })
         const timestamp = parseInt(findOrder.date)
        if (!isNaN(timestamp)) {
            findOrder.createdOn = new Date(timestamp);
        } else {
            findOrder.createdOn = null;
        }
        res.render("Admin/orderDetails",{orders:findOrder,orderId})

    } catch (error) {
        console.log(error)
    }
}

const changeOrderStatus = async (req, res) => {
    
    try {
        console.log(req.query);
        const orderId = req.query.orderId
        console.log(orderId);
        console.log(req.query.status)
        await  Order.updateOne({ _id: orderId },
           {$set: { orderStatus : req.query.status }}
        ).then((data) => console.log(data))
       res.redirect('/Admin/orderList');
      } catch (error) {
        console.log(error.message);
      }
   }



   




module.exports={
    getCheckout,
    getCheckoutAddressEdit,
    postCheckoutEditAddress,
    CheckoutAddressAddPage,
    postcheckoutAddress,
    getCheckoutDeleteAddress,
    orderPlaced,
    getOrderListPageAdmin,
    getOrderDetailsPageAdmin,
    changeOrderStatus   ,
    getOrderDetailsPage  ,
    cancelOrder  ,
    cancelOrderAdmin
}