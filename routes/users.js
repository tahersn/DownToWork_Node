var express = require('express');
var router = express.Router();
const { registerUser,LoginUser,GetUser ,forgetPassword,resetPassword ,submitotp, blockUser,unblockUser, findById, update, desactivateAccount,verifyUser} = require('../controllers/userController.js');
const { protect } = require ('../middleWares/authMiddleWare.js');
const { validate } = require('../middleWares/validation.js');


router.post('/register',validate,registerUser);
router.post('/verifyUser/:activationCode',verifyUser);
router.post('/login', LoginUser);
router.get('/getuser', protect, GetUser);
router.get('/getById/:id', findById );
router.put('/update/:id', update );
router.put('/desactivate/:id', desactivateAccount );
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
