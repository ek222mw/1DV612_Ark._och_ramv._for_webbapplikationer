/*jshint esversion:6*/
//setting up schema to communicate with mongodb through mongoose.
var mongoose = require("mongoose");

var lastSchema = mongoose.Schema({
  date:{type:Date, required:true, default:Date.now},
  user:{type:String, required:true},
  message:{type:String, required:true}

});


var LastSaved = mongoose.model("LastSaved", lastSchema);
module.exports = LastSaved;
