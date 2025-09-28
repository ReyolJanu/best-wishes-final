const express = require('express');

const {registerUser, loginUser, logoutUser, getUserProfile, changePassword, updateUserProfile, otp, twoFactor, verifyOtp, forgotPassword, resetPassword, verifyResetCode} = require('../controllers/authController');


const { isAuthenticated } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/register').post(registerUser);
router.route('/otp').post(otp);
router.route('/twoFactor').put(twoFactor);
router.route('/login').post(loginUser);
router.route('/logout').post(logoutUser);
router.route('/myprofile').get(isAuthenticated, getUserProfile);
router.route('/getUserProfile').get(isAuthenticated ,getUserProfile);
router.route('/changepassword').put(isAuthenticated ,changePassword);
router.route('/updateprofile').put(isAuthenticated, updateUserProfile);
router.route('/verify-otp').post(verifyOtp);
router.route('/forgot-password').post(forgotPassword);
router.route('/verify-reset-code').post(verifyResetCode);
router.route('/reset-password').post(resetPassword);


module.exports = router;