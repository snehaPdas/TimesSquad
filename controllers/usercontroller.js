const User = require("../Models/userSchema");

const authcontroller = require("../Helpers/authcontroller");
const Product = require("../Models/productSchema");
const Category=require("../Models/categorySchema")

const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");


//get home page
const GetHomepage = async (req, res) => {
  try {
    const user = req.session.user;
    const userData = await User.findOne({});
    const productData = await Product.find({ isBlocked: false })
      .sort({ id: -1 })
      .limit(8);

    if (user) {
      if (req.url === "/") {
        res.render("user/homepage", { user: userData, products: productData });
      }
    } else {
      res.render("user/homepage", { products: productData });
    }
  } catch (error) {
    res.status(500).send("server error");
    console.log(error.message);
  }
};

//password bcrypt

const passwordsecure = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

//for load signup page

const GetSignup = (req, res) => {
  try {
    res.render("user/signup");
  } catch (error) {
    res.status(500).send("server error");
    console.log(error.message);
  }
};

//inserting user

let insertuser = async (req, res) => {
  try {
    let { name, email, phone, password } = req.body;
    console.log("Phone Number:", phone);

    const alreadyexist = await User.findOne({ email: email });
    if (alreadyexist) {
      res.send("user already exist");
    }

    req.session.userData = { name, email, phone, password };

    if (req.body.password !== req.body.cpassword) {
      console.log("The confirm password is not matching");
      return res.render("user/signup", {
        message: "The confirm password is not matching",
      });
    }


    const otp = Math.floor(100000 + Math.random() * 900000);
    req.session.otp = otp;
    await authcontroller.sendEmail(req.session.userData.email, req.session.otp);
    res.render("user/verifyotp");
  } catch (error) {
    console.error(error);
  }
};
//for getting otppage
const GetOtppage = async (req, res) => {
  try {
    res.render("verifyotp");
  } catch (error) {
    console.log(error.message);
  }
};

//otp verification
const verifyOtp = async (req, res) => {
  try {
    console.log("data");
    const otp = req.body.otp;
    console.log(otp);
    if (Number(otp) === Number(req.session.otp)) {
      console.log("here");

      const userData = req.session.userData;
      const newUser = new User({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        password: await passwordsecure(userData.password),
      });

      await newUser.save();
      //req.session.user=newUser._id

      res.json({ success: true });
    } else {
      res.send("hi");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const resendOtp = async (req, res) => {
  try {
    const email = req.session.userData.email;

    // Generate a new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000);
    console.log("Resend OTP:", newOtp);
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "snehap7das@gmail.com",
        pass: "txbq sgdu bxjh qhpm",
      },
    });

    const info = await transporter.sendMail({
      from: "snehap7das@gmail.com",
      to: email,
      subject: "Resend OTP ",
      text: `Your new OTP is ${newOtp}`,
      html: `<b><h4>Your new OTP is ${newOtp}</h4><br><a href="">Click here</a></b>`,
    });

    if (info) {
      // Update the session with the new OTP
      req.session.otp = newOtp;
      res.json({ success: true, message: "OTP resent successfully" });
      console.log("Email resent", info.messageId);
    } else {
      res.json({ success: false, message: "Failed to resend OTP" });
    }
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: "Error in resending OTP" });
  }
};

//for getting login
const GetLogin = async (req, res) => {
  try {
    if (!req.session.user) {
      if (req.session.error) {
        let error = req.session.error;
        req.session.error = "";
        res.render("user/login", { message: error });
      } else {
        res.render("user/login");
      }
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
  }
};

//login user
const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const findUser = await User.findOne({
      isAdmin: "0",
      email: email,
    });
    if (findUser) {
      const UserNotBlocked = findUser.isBlocked === false;
      if (UserNotBlocked) {
        const passwordMatch = await bcrypt.compare(password, findUser.password);
        if (passwordMatch) {
          req.session.user = findUser._id;
          console.log("Logged in");
          res.redirect("/");
        } else {
          console.log("password is not matching");
          res.render("user/login", { message: "password is not matching" });
        }
      } else {
        console.log("user has blocked");
        res.render("user/login", { message: "User has blocked by admin" });
      }
    } else {
      console.log("user not found");
      req.session.error = "user not found";
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
    res.render("user/login", { message: "Login failed" });
  }
};

const getLogoutUser = async (req, res) => {
  try {
    req.session.user = null;
    res.redirect("/login");
  } catch (error) {
    console.log(error.message);
  }
};

const getProductDetailsPage = async (req, res) => {
  try {
    const user = req.session.user;
    console.log("100");
    const id = req.query.id;
    const findProduct = await Product.findOne({ _id: id });
    console.log(id);
    const allProducts = await Product.find({ isBlocked: false })
      .sort({ id: -1 })
      .limit(4);

    if (user) {
      res.render("user/product-details", {
        prod: allProducts,
        data: findProduct,
        user: user,
      });
    } else {
      res.render("user/product-details", {
        data: findProduct,
        prod: allProducts,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const getShopPage = async (req, res) => {
  try {
    const user = req.session.id;
    const products = await Product.find({ isBlocked: false });
    const count = await Product.find({ isBlocked: false }).count();
    // const brands = await Brand.find({})
    const categories = await Category.find({ isListed: true })

    let itemsPerPage = 6;
    let currentPage = parseInt(req.query.page) || 1;
    let startIndex = (currentPage - 1) * itemsPerPage;
    let endIndex = startIndex + itemsPerPage;
    let totalPages = Math.ceil(products.length / 6);
    const currentProduct = products.slice(startIndex, endIndex);

    res.render("user/shop", {
      user: user,
      product: currentProduct,
       category: categories,
      // brand: brands,
      count: count,
      totalPages,
      currentPage,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const searchProducts = async (req, res) => {
  try {
    const user = req.session.user;
    let search = req.query.search;
    // const brands = await Brand.find({})
   const categories = await Category.find({ isListed: true })

    const searchResult = await Product.find({
      $or: [
        {
          productName: { $regex: ".*" + search + ".*", $options: "i" },
        },
      ],
      isBlocked: false,
    }).lean();

    let itemsPerPage = 6;
    let currentPage = parseInt(req.query.page) || 1;
    let startIndex = (currentPage - 1) * itemsPerPage;
    let endIndex = startIndex + itemsPerPage;
    let totalPages = Math.ceil(searchResult.length / 6);
    const currentProduct = searchResult.slice(startIndex, endIndex);

    res.render("user/shop", {
      user: user,
      product: currentProduct,
      category: categories,
      //brand: brands,
      totalPages,
      currentPage,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const filterByPrice = async (req, res) => {
  try {
    const user = req.session.user;
    //const brands = await Brand.find({});
    const categories = await Category.find({ isListed: true });
    
    const findProducts = await Product.find({
      $and: [
        { salePrice: { $gt: req.query.gt } },
        { salePrice: { $lt: req.query.lt } },
        { isBlocked: false },
      ],
    });

    let itemsPerPage = 6;
    let currentPage = parseInt(req.query.page) || 1;
    let startIndex = (currentPage - 1) * itemsPerPage;
    let endIndex = startIndex + itemsPerPage;
    let totalPages = Math.ceil(findProducts.length / 6);
    const currentProduct = findProducts.slice(startIndex, endIndex);

    res.render("user/shop", {
    user: user, 
      product: currentProduct,
       category: categories,
      totalPages,
      currentPage,
    });
  } catch (error) {
    console.log(error.message);
  }
};


const filterProduct = async (req, res) => {
  try {
      const user = req.session.user;
      const category = req.query.category;
      const brand = req.query.brand;
      //const brands = await Brand.find({});
      const findCategory = category ? await Category.findOne({ _id: category }) : null;
      // const findBrand = brand ? await Brand.findOne({ _id: brand }) : null;

      const query = {
          isBlocked: false,
      };

      if (findCategory) {
          query.category = findCategory.name;
      }

      // if (findBrand) {
      //     query.brand = findBrand.brandName;
      // }

      const findProducts = await Product.find(query);
      const categories = await Category.find({ isListed: true });

      let itemsPerPage = 6;
      let currentPage = parseInt(req.query.page) || 1;
      let startIndex = (currentPage - 1) * itemsPerPage;
      let endIndex = startIndex + itemsPerPage;
      let totalPages = Math.ceil(findProducts.length / 6);
      const currentProduct = findProducts.slice(startIndex, endIndex);

      res.render("User/shop", {
          user: user,
          product: currentProduct,
          category: categories,
        //  brand: brands,
          totalPages,
          currentPage,
          selectedCategory: category || null,
          selectedBrand: brand || null,
      });

  } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error");
  }
};




const sortProduct = async (req, res) => {
  
  try {
    console.log("1")
      let option = req.body.option;
      let itemsPerPage = 6;
      let currentPage = parseInt(req.body.page) || 1;
      let startIndex = (currentPage - 1) * itemsPerPage;
      let endIndex = startIndex + itemsPerPage;
      let data;

      if (option === "highToLow") {
        console.log("for check")
          data = await Product.find({ isBlocked: false }).sort({ salePrice: -1 });
      } else if (option === "lowToHigh") {
        console.log("just check")
          data = await Product.find({ isBlocked: false }).sort({ salePrice: 1 });
      } else {
          throw new Error("Invalid selection");
      }

      res.json({
        status: true,
          data: {
              currentProduct: data,
              count: data.length,
              totalPages: Math.ceil(data.length / itemsPerPage),
              currentPage
          }
          
      });
  } catch (error) {
      console.error("Error sorting products:", error);
      res.status(500).json({ status: false, error: "Failed to sort products" });
  }
};








module.exports = {
  GetHomepage,
  GetSignup,
  insertuser,
  GetOtppage,
  verifyOtp,
  GetLogin,
  userLogin,
  getLogoutUser,
  resendOtp,
  getProductDetailsPage,
  getShopPage,
  searchProducts,
  filterByPrice,
  sortProduct,
  filterProduct,
  
};
