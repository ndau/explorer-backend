const express = require("express");
const Richlist = require("../controllers/richlist_controller");

const router = express.Router();
router.get("/richlist", Richlist.getRichList);
router.get("/numOfAccounts", Richlist.getnumOfAccounts);


module.exports = router;
