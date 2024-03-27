const Category=require("../Models/categorySchema")


const getCategory=async(req,res)=>{
    
    try {
        const categoryData=await Category.find({})

        res.render("admin/category", { catdata: categoryData })

    } catch (error) {
        console.log(error.message)
        // res.status(500).send("Internal Server Error");
        
    }
}

const addCategory=async(req,res)=>{
    try {
        console.log("10")
        const {name,description}=req.body
        const categoryExist = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });

        if (description && description.trim() !== "") {
            if(!categoryExist){
                const newcategory=new Category({
                    name:name,
                    description:description
                })
               await newcategory.save()
               res.redirect(302,"/admin/category")

            }else{
                const category=await Category.find({})

                res.render("admin/category",{catdata:category,message:"category already exist"})
                console.log("category alread exist")
            }
        }else{
            console.log("description need")
        }


    } catch (error) {
        console.log(error.message)()
        
    }
}

const getAllCategory=async (req,res)=>{
    try {
        console.log("50")
        const categoryData =await Category.find({})
        res.render("admin/category", { catdata: categoryData })
        console.log("correct")
    } catch (error) {
        console.log(error.message)
    }
}

const getListedCategory=async(req,res)=>{
    try {
        console.log("51")
        let id=req.query.id
        const data=await Category.updateOne({_id:id},{$set:{isListed:false}})
        res.redirect('/admin/category')
        console.log(data)

    } catch (error) {
        console.log(error.message)
    }
}

const getUnlistedCategory=async(req,res)=>{
    try{
     let id=req.query.id
     const data=await Category.updateOne({_id:id},{$set:{isListed:true}})
     res.redirect('/admin/category')
     console.log(data)
    }catch(error){
        console.log(error)
     
    }
}
const getEditCategory = async (req, res) => {
    try {
        const id = req.query.id
        const category = await Category.findOne({ _id: id })
        res.render("admin/categoryedit", { category: category })
    } catch (error) {
        console.log(error.message);
    }
}
const editCategory = async (req, res) => {
    try {
        const id = req.params.id
        const { categoryName, description } = req.body
        const findCategory = await Category.find({ _id: id })
        if (findCategory) {
            await Category.updateOne(
                { _id: id },
                {
                    name: categoryName,
                    description: description
                })
            res.redirect("/admin/category")
        } else {
            console.log("Category not found");
        }

    } catch (error) {
        console.log(error.message);
    }
}
const getLogout = async (req, res) => {
    try {
        req.session.admin = null
        res.redirect("/admin/login")
    } catch (error) {
        console.log(error.message);
    }
}

module.exports={
    getCategory,
    addCategory,
    getAllCategory,
    getListedCategory,
    getUnlistedCategory,
    getEditCategory,
    editCategory,
    getLogout
}