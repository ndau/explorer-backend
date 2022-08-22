const express = require('express');
const User = require('../controllers/user_controller');
const auth = require('../middleware/auth');
let multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/creatives')
    },
    filename: (req, file, cb) => {
        cb(null, new Date().getTime() + '-' + file.originalname)
    }
})

const upload = multer({
    storage: storage
});

const router = express.Router()
// router.get('/user/user-profile-details',auth,User.userProfileDetails)
// router.post('/user/register', User.registerUser)
// router.post('/user/login', User.loginUser)
// router.post('/user/forgot-password', User.forgotPassword)
// router.put('/user/reset-password', User.resetPassword)


// POSTGRES ROUTES
router.get('/user/user-profile-details',auth,User.PGuserProfileDetails)
router.post('/user/register', User.PGregisterUser)
router.post('/user/login', User.PGloginUser)
router.post('/user/forgot-password', User.PGforgotPassword)
router.put('/user/reset-password', User.PGresetPassword)
router.put('/user/verify', User.verifyUser)
router.post('/bookmark/bookmark',auth,User.createBookmark);
router.get('/user/bookmarks',auth,User.getBookmarks)
router.put
('/user/SpecificBookmarks',auth,User.getSpecificBookmarks)


module.exports = router;