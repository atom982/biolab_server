var express = require("express");
var router = express.Router();

var racuni = require("../controllers/RacuniController.js");

router.post("/racuni/create", racuni.Create);
router.post("/racuni/generate", racuni.Generate);

module.exports = router;
