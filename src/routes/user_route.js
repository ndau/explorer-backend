const express = require('express');
const User = require('../controllers/user_controller');
const auth = require('../middleware/auth');
let multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/creatives');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().getTime() + '-' + file.originalname);
  },
});

const upload = multer({
  storage: storage,
});

const router = express.Router();

// POSTGRES ROUTES
router.get('/user-profile-details', auth, User.PGuserProfileDetails);
router.post('/register', User.PGregisterUser);
router.post('/login', User.PGloginUser);
router.post('/forgot-password', User.PGforgotPassword);
router.put('/reset-password', User.PGresetPassword);
router.put('/verify', User.verifyUser);
router.post('/bookmark', auth, User.createBookmark);
router.get('/bookmarks', auth, User.getBookmarks);
router.put('/SpecificBookmarks', auth, User.getSpecificBookmarks);

module.exports = router;
