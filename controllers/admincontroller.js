const User = require("../Models/userSchema");
const bcrypt = require("bcrypt");

const getLoginPage = async (req, res) => {
  try {
    res.render("admin/adminlogin");
  } catch (error) {
    console.log(error.message);
  }
};

const verifylogin = async (req, res) => {
  console.log("just entered");
  try {
    const { email, password } = req.body;
    const findAdmin = await User.findOne({
      email,
      isAdmin: "1",
    });

    console.log("yes");
    if (findAdmin) {
      console.log("read");
      const passwordMatch = await bcrypt.compare( password, findAdmin.password );
      if (passwordMatch) {
        req.session.admin = true;
        res.redirect("/admin");
      } else {
        res.redirect("/admin/login", { message: "Invalid Password" });
      }
    } else {
      res.render("admin/adminlogin", { message: "Admin Not Found" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const getDashboard = async (req, res) => {
  try {
    res.render("admin/dashboardindex");
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
  getLoginPage,
  verifylogin,
  getDashboard,
  getLogout,
};
