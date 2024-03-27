const mongoose=require("mongoose")

const productSchema=mongoose.Schema({
   
    productName:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    // brand:{
    //     type:String,
    //     required:true,
    // },
    category:{
        type:String,
        required:true,
    },
    regularPrice:{
        type:Number,
        required:true
    },
    salePrice:{
        type:Number,
        required:true
    },
    createdOn:{
        type:String,
        //required:true,

    },
    quantity:{
        type:Number,
        required:true,
        },
        productImage:{
            type:Array,
           // required:true,
        },
        // color:{
        //     type:String,
        //     required:true,
        // },
        isBlocked:{
            type:Boolean,
            default:false,
        },

})


const Product=mongoose.model("product",productSchema)
module.exports=Product