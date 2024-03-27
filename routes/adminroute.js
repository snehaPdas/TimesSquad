const express=require("express")


const route=express.Router()


const adminController=require("../controllers/admincontroller")
const customerController=require("../controllers/customercontroller")
const categoryController=require("../controllers/categorycontroller")
const productController=require("../controllers/productcontroller")
const orderController=require("../controllers/orderController")

const { isAdmin } = require("../Helpers/middleware")



//admin

route.get("/",isAdmin,adminController.getDashboard)
route.get("/login",adminController.getLoginPage)
route.post("/login",adminController.verifylogin)
route.get("/logout", isAdmin, adminController.getLogout)


//customer list Management

route.get("/user",isAdmin,customerController.getCustomerData)
route.get("/blockCustomer", isAdmin, customerController.getCustomerBlocked)
route.get("/unblockCustomer", isAdmin, customerController.getCustomerUnblocked)


//category

route.get("/category",isAdmin,categoryController.getCategory)
route.post("/addcategory",isAdmin,categoryController.addCategory)
route.get("/allcategory",isAdmin,categoryController.getAllCategory)
route.get("/listedcategory",isAdmin,categoryController.getListedCategory)
route.get("/unlistedcategory",isAdmin,categoryController.getUnlistedCategory)
route.get("/editcategory",isAdmin,categoryController.getEditCategory)
route.post("/editCategory/:id", isAdmin,categoryController.editCategory)
route.get("/logout", isAdmin, categoryController.getLogout)



//multer
const multer = require("multer")
const storage = require("../helpers/multer")
const upload = multer({ storage: storage })
route.use("/public/uploads", express.static("/public/uploads"))


//product

route.get("/addProducts",isAdmin,productController.getProductadd)
route.post("/addProducts",isAdmin,upload.array("images",5),productController.addProducts)
route.get("/products",isAdmin,productController.getAllProducts)
route.get("/blockProduct",isAdmin,productController.getBlockProduct)
route.get("/unBlockProduct",isAdmin,productController.getUnblockProduct)
route.get("/editProduct", isAdmin,productController.getEditProduct)
route.post("/editProduct/:id", isAdmin, upload.array("images", 5), productController.editProduct)
route.post("/deleteImage",isAdmin,productController.deleteSingleImage)
route.get("/logout", isAdmin, productController.getLogout)

// orders
route.get("/orderList",isAdmin,orderController.getOrderListPageAdmin)
route.get("/orderDetailsAdmin",isAdmin,orderController.getOrderDetailsPageAdmin)
route.get("/changeStatus",isAdmin,orderController.changeOrderStatus)



module.exports=route
