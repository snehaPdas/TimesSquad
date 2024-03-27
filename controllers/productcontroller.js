const Category = require("../Models/categorySchema");
const Product = require("../Models/productSchema");
const fs = require("fs");
const path = require("path");

const getProductadd = async (req, res) => {
  try {
    const category = await Category.find({ isListed: true });
    res.render("admin/productadd", { catdata: category });
  } catch (error) {
    console.log(error.message);
  }
};

const addProducts = async (req, res, err) => {
  try {
    const products = req.body;
    const productExists = await Product.findOne({
      productName: { $regex: new RegExp(products.productName, "i") },
    });
    if (!productExists) {
      const images = [];
      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          images.push(req.files[i].filename);
        }
      }

      const newProduct = new Product({
        // id: Date.now(),
        productName: products.productName,
        description: products.description,
        category: products.category,
        regularPrice: products.regularPrice,
        salePrice: products.salePrice,
        createdOn: new Date(),
        quantity: products.quantity,
        //color: products.color,
        productImage: images,
      });
      await newProduct.save();

      res.redirect("/admin/products");
      // res.json("success")
    } else {
      const category = await Category.find({});

      //res.json("failed");

      res.render("admin/productadd", {
        catdata: category,
        message: "product already exists",
      });
    }
  } catch (error) {
    console.log("addproduct error", error.message);
  }
};

const getAllProducts = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = req.query.page || 1;
    const limit = 4;
    const productData = await Product.find({
      productName: { $regex: new RegExp(".*" + search + ".*", "i") },
    })
      .sort({ createdOn: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Product.find({
      productName: { $regex: new RegExp(".*" + search + ".*", "i") },
    }).countDocuments();

    res.render("admin/product", {
      data: productData,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.log(error.message);
  }
};

const getBlockProduct = async (req, res) => {
  try {
    let id = req.query.id;
    await Product.updateOne({ _id: id }, { $set: { isBlocked: true } });
    console.log("product blocked");
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error.message);
  }
};
const getUnblockProduct = async (req, res) => {
  try {
    let id = req.query.id;
    await Product.updateOne({ _id: id }, { $set: { isBlocked: false } });
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error.message);
  }
};

const getEditProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const products = await Product.findOne({ _id: id });
    const category = await Category.find({});
    res.render("admin/productedit", { product: products, cat: category });
  } catch (error) {}
};

const editProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;
    const images = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        images.push(req.files[i].filename);
      }
    }
    if (req.files.length > 0) {
      const updatedProduct = await Product.findByIdAndUpdate(id, {
        productName: data.productName,
        description: data.description,
        category: data.category,
        regularPrice: data.regularPrice,
        salePrice: data.salePrice,
        quantity: data.quantity,
        //color:data.color,
        productImage: images,
      });
      res.redirect("/admin/products");
    } else {
      const updatedProduct = await Product.findByIdAndUpdate(id, {
        productName: data.productName,
        description: data.description,
        category: data.category,
        regularPrice: data.regularPrice,
        salePrice: data.salePrice,
        quantity: data.quantity,
        //color:data.color,
      });
      res.redirect("/admin/products");
    }
  } catch (error) {
    console.log(error.message);
  }
};
const deleteSingleImage = async (req, res) => {
  try {
    console.log("hi");
    const id = req.body.productId;
    const image = req.body.filename;
    console.log(id, image);
    const product = await Product.findByIdAndUpdate(id, {
      $pull: { productImage: image },
    });
    // console.log(image);
    const imagePath = path.join("public", "uploads", "product-images", image);
    if (fs.existsSync(imagePath)) {
      await fs.unlinkSync(imagePath);
      console.log(`Image ${image} deleted successfully`);
      res.json({ success: true });
    } else {
      console.log(`Image ${image} not found`);
    }

    // res.redirect(`/admin/editProduct?id=${product._id}`)
  } catch (error) {
    console.log(error.message);
  }
};

const getLogout = async (req, res) => {
  try {
    req.session.admin = null;
    res.redirect("/admin/login");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  getProductadd,
  addProducts,
  getAllProducts,
  getBlockProduct,
  getUnblockProduct,
  editProduct,
  getEditProduct,
  deleteSingleImage,
  getLogout,
};
