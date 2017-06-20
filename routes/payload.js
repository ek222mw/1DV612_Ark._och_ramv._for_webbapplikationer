/*jshint esversion:6 */
let router = require("express").Router();

router.route("/")
    .get(function(req, res) {

      res.redirect("./");

    });

module.exports = router;
