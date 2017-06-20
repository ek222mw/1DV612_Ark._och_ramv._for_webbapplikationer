var mongoose = require("mongoose");

var userSchema = mongoose.Schema({
  username: {type: String, required: true, unique:true},
  slackusername: {type: String, required: true}
});


var User = mongoose.model("User", userSchema);
module.exports = User;
