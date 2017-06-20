
var router = require("express").Router();
var slacktoken = process.env['SLACK_API_TOKEN'];
var slackAPI = require("../webapi/slackAPI.js")(slacktoken);
var gitAPI;
var User = require("../models/User.js");

router.route("/")
.get(function(req,res)
{
  if(!res.app.locals.login)
  {
    res.app.locals.flash = {
      message:"Login to send slack invite"
    };
    return res.redirect("../");
  }
  res.render("slack/invite");
}).post(function(req,res)
{
  if(!res.app.locals.login)
  {
    res.app.locals.flash = {
      message:"Login to send slack invite"
    };
    return res.redirect("../");
  }
  var email = req.body.email;

  var expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
  var regex = new RegExp(expression);
  if(!req.body.email.match(regex))
  {
    res.app.locals.flash = {
      message:"Not a valid email adress"
    };
    return res.redirect("../slack");
  }

  if(email.length < 1 || email.length > 60)
  {

    res.app.locals.flash = {
      message:"Email must be between 1 and 60 characters"
    };
    return res.redirect("../slack");
  }
  slackAPI.postInviteTeam(email).then(function(response) {

    var content = JSON.parse(response);

    if(content.ok === false)
    {
      res.app.locals.flash = {
        message:"Error user have already been invited"
      };
      res.redirect("../slack");
    }
    else{
      res.app.locals.flash = {
        message:"Invite successfully sent"
      };
      res.redirect("../slack/addSlackName");
    }

  });



});

router.route("/addSlackName")
.get(function(req,res)
{
  if(!res.app.locals.login)
  {
    res.app.locals.flash ={
      message:"Login to add slackname"
    };
    return res.redirect("../");
  }
  res.render("slack/addSlackName");
}).post(function(req,res)
{
  if(!res.app.locals.login)
  {
    res.app.locals.flash ={
      message:"Login to add slackname"
    };
    return res.redirect("../");
  }
  var username = req.body.username;
  if(username.length < 1 || username.length > 60)
  {

    res.app.locals.flash = {
      message:"Username must be between 1 and 60 characters"
    };
    return res.redirect("../slack/addSlackName");
  }
  //todo save org pick in database
  gitAPI = require("../webapi/gitAPI.js")(req.app.locals.token);
  gitAPI.getUser().then(function(user)
  {
    var githubusername = user.login;
    User.findOne({username:user.login}, function(err, result)
    {
      var user;
      if(result === null)
      {
        user = new User({
          username:githubusername,
          slackusername:username
        });
        user.save().then(function()
        {
          console.log("save");
          res.app.locals.flash = {
            message:"Successfully added slackname"
          };

        }).catch(function(error)
        {
          console.log("catch");
          res.app.locals.flash = {
            message:"Something went wrong when tried to save slackname to database"
          };

        });
        return res.redirect("../slack/addSlackName");
      }
      else{

        result.slackusername = username;
        result.save().then(function()
        {

        }).catch(function(error)
        {
          res.app.locals.flash = {
            message:"Something went wrong when tried to save slackname to database"
          };
          
        });
      }

      res.app.locals.flash = {
        message:"Successfully added or edited slackname in database"
      };
      return res.redirect("../");
    });

  });
});

module.exports = router;
