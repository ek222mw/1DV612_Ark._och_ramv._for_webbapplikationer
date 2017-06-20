/*jshint esversion:6*/
//setting up schema to communicate with mongodb through mongoose. this item schema which is infact snippets in view.
let mongoose = require("mongoose");

let hookSchema = mongoose.Schema({
  org: { type: String, required: true },
  username: {type: String, required: true},
  slack: { type: Boolean, required: true, default:true },
  github: { type: Boolean, required: true, default:true },
  events: {type:Object, required: true}
});


let Webhook = mongoose.model("Webhook", hookSchema);
module.exports = Webhook;
