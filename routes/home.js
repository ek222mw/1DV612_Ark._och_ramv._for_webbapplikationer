/*jshint esversion: 6 */
var router = require("express").Router();
var port = 3000;
var token;
var Org = require("../models/Org");
var gitAPI;
var User = require("../models/User.js");
var Webhook = require("../models/Webhook");
var LastSaved = require("../models/LastSaved");
var githubOAuth = require('github-oauth')({
  githubClient: process.env['GITHUB_CLIENT_ID'],
  githubSecret: process.env['GITHUB_CLIENT_SECRET'],
  //baseURL: 'http://b7bab060.ngrok.io/:' + port,
  baseURL: 'https://207.154.200.30',
  loginURI: '/login',
  callbackURI: '/callback',
  scope: 'read:org, user, repo, write:repo_hook, write:org, admin:org_hook'
});
var orgnames = [];

githubOAuth.on('error', function(err) {
  console.error('there was a login error', err);
});

router.route("/")
.get(function(req, res) {

  if(res.app.locals.login)
  {
    gitAPI = require("../webapi/gitAPI.js")(req.app.locals.token);
    gitAPI.getUser().then(function(user)
    {
      LastSaved.find({user:user.login}, function(err, result)
      {
        if(result.length > 0)
        {
          var contxt = {

            items: result.map(function(item) {
              return {
                user: item.user,
                message: item.message,
                date: item.date
              };
            }),
          };

          return res.render("home/index", {events:contxt.items});
        }
        else{

          return res.render("home/index");
        }
      });
    });



  }
  else{
    res.render("home/index");
  }



}).post(function(req,res)
{
  gitAPI = require("../webapi/gitAPI.js")(req.app.locals.token);
  gitAPI.getUser().then(function(user)
  {
    if(res.app.locals.login)
    {
      LastSaved.find({user:user.login}, function(err,result)
      {

        if(result.length > 0)
        {
          LastSaved.remove({user:user.login},function(err)
          {
            if(err)
            {
              res.app.locals.flash = {
                message:"Something went wrong in database when tried to remove"
              };
              return res.redirect("../");
            }
            res.app.locals.flash = {
              message:"Successfully removed temp data"
            };
            return res.redirect("../");
          });


        }
        else{
          res.app.locals.flash = {
            message:"Couldn't find any temp data to remove"
          };
          return res.redirect("../");
        }

      });
    }
  });


});

router.route("/webhooksettings")
.get(function(req,res)
{
  if(res.app.locals.login)
  {
    gitAPI = require("../webapi/gitAPI.js")(req.app.locals.token);
    gitAPI.getUser().then(function(user)
    {
      Webhook.find({username:user.login}, function(err, result)
      {
        if(result === null)
        {
          res.app.locals.flash = {
            message: "Couldn't find webhook notifications settings for user, please subscribe to a organisation!"
          };
          return res.redirect("../");

        }
        else{

          var contxt = {

            items: result.map(function(item) {
              return {
                slack: item.slack,
                username: item.username,
                org:item.org,
                github: item.github,
                events: item.events

              };
            }),
          };

          res.render("orgs/webhooksettings", {settings:contxt.items});
        }

      }).catch(function(err)
      {
        console.log(err);
      });

    });
  }
  else{
    res.app.locals.flash = {
      message: "Login in to see webhook settings"
    };
    return res.redirect("../");
  }
}).post(function(req,res)
{

  if(res.app.locals.login)
  {
    if(req.body.events === undefined && req.body.github === undefined && req.body.slack === undefined)
    {
      res.app.locals.flash ={
        message:"Please pick a event to subcribe too"
      };
      return res.redirect("../webhooksettings");
    }
    gitAPI = require("../webapi/gitAPI.js")(req.app.locals.token);
    gitAPI.getUser().then(function(user)
    {

      Webhook.find({username:user.login}, function(err, result)
      {

        if(result === null)
        {
          res.app.locals.flash = {
            message: "Couldn't find webhook notifications settings for user, please subscribe to a organisation!"
          };
          return res.redirect("../");

        }
        else{
          if(req.body.github)
          {
            Webhook.findOne({org:req.body.github,username:user.login }, function(err,orgi)
            {

              orgi.github = req.body.optradio;
              orgi.save().then(function()
              {

              }).catch(function(er)
              {
                console.log(er);
              });
            });

          }
          else if(req.body.slack)
          {

            Webhook.findOne({org:req.body.slack, username:user.login}, function(err,orgi)
            {

              orgi.slack = req.body.optradio;

              orgi.save().then(function()
              {

              }).catch(function(er)
              {
                console.log(er);
              });
            });

          }
          else if(req.body.org)
          {
            Webhook.findOne({org:req.body.org, username:user.login}, function(err,orgi)
            {
              orgi.events = req.body.events;

              orgi.save().then(function()
              {

              }).catch(function(er)
              {
                console.log(er);
              });
            });
          }

          res.app.locals.flash = {
            message: "Status changed"
          };
          return res.redirect("../webhooksettings");

        }

      }).catch(function(err)
      {
        console.log(err);
      });

    });
  }
  else{
    res.app.locals.flash = {
      message: "Login in to post webhook settings"
    };
    return res.redirect("../");
  }
});

router.route("/login")
.get(function(req, res) {

  return githubOAuth.login(req, res);
});
router.route("/callback")
.get(function(req, res) {

  return githubOAuth.callback(req, res);
});

githubOAuth.on('token', function(_token, res) {

  token = _token.access_token;

  gitAPI = require("../webapi/gitAPI.js")(token);
  gitAPI.getUser().then(function(user)
  {
    res.app.locals.loginUser = user.login;
  });
  gitAPI.getAllOrganizations().then(orgs => {

    var orgrepos = orgs[0].login;
    for(j=0; j<orgs.length; j++)
    {
      orgnames.push(orgs[j].login);
    }
    res.app.locals.orgs = orgnames;
    res.app.locals.login = true;
    res.app.locals.token = token;
    res.app.set("token", res.app.locals.token);
    res.app.locals.logout = false;
    res.app.set("login", res.app.locals.login);
    res.app.locals.flash = {
      message: "Successfully logged in!"
    };
    res.redirect("../");
  });

});

router.route("/logout")
.post(function(req, res) {
  res.app.locals.loginUser = "";
  res.app.locals.orgs = "";
  res.app.locals.login = false;
  res.app.locals.token = "";
  res.app.locals.logout = true;
  res.app.set("login", false);
  res.app.set("token", "");
  res.app.locals.flash = {
    message: "Successfully logged out!"
  };
  res.redirect("../");
});



module.exports = router;
