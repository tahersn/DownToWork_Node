var express = require('express');
var router = express.Router();
const { registerUser,LoginUser,GetUser ,forgetPassword,resetPassword ,submitotp, blockUser,unblockUser} = require('../controllers/userController.js');
const { protect } = require ('../middleWares/authMiddleWare.js');
const { validate } = require('../middleWares/validation.js');
const { signinController, signupController } = require("../controllers/userController")


router.post('/register',validate,registerUser);
router.post('/login', LoginUser);
router.post("/signin", signinController);
router.post("/signup", signupController);
router.get('/getuser', protect, GetUser);
router.post('/forget-password', forgetPassword );
router.post('/reset-password',resetPassword);
router.get('/block-user/:id' , blockUser);
router.get('/unblock-user/:id',unblockUser);
router.post('/new-password' , submitotp);
// /* GET users listing. */
// router.get('/', function(req, res, next) {
//   res.send('respond with a resource');
// });

module.exports = router;
