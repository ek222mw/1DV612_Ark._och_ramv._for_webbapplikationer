var router = require("express").Router();
var token;
var Org = require("../models/Org");
var Webhook = require("../models/Webhook");
var User = require("../models/User");
var gitAPI;


router.route("/pickorg")
.get(function(req, res) {

  if(res.app.locals.login)
  {
    res.render("orgs/pick", {orgs:res.app.locals.orgs});
  }
  else{

    res.app.locals.flash ={
      message:"Login to pick org"
    };
    res.redirect("../");


  }
});

router.route("/unsubscribe")
.get(function(req, res) {

  if(!res.app.locals.login)
  {
    res.app.locals.flash = {
      message:"Login to unsubscribe user"
    };
    return res.redirect("../");
  }
  gitAPI = require("../webapi/gitAPI.js")(res.app.locals.token);

  gitAPI.getUser().then(function(user)
  {
    Webhook.find({username:user.login}, function(err, result)
    {
      if(result === null)
      {
        res.app.locals.flash = {
          message:"Couldn't find any subscribtions on webhooks for this user"
        };
        return res.redirect("../github/unsubscribe");
      }
      else{

        res.render("orgs/pickunsubscribe", {orgs:result});
      }

    });
  });


}).post(function(req,res)
{
  gitAPI = require("../webapi/gitAPI.js")(res.app.locals.token);

  gitAPI.getUser().then(function(user)
  {
    Webhook.findOne({username:user.login, org:req.body.org}, function(err, result)
    {

      if(result === null)
      {
        res.app.locals.flash = {
          message:"Couldn't find org to remove"
        };
        return res.redirect("../github/unsubscribe");
      }
      else{
        Webhook.findOneAndRemove({username:user.login, org:req.body.org}).exec().then(function()
        {
          res.app.locals.flash = {
            message:"Successfully removed subscribtion"
          };


        }).catch(function(error)
        {
          console.log(error);
          res.app.locals.flash = {
            message:"Something went wrong when tried to remove subscribtion"
          };

        });
        return res.redirect("../");
      }
    });
  });
});

router.route("/pickorghooks")
.get(function(req, res) {


  if(req.app.locals.login)
  {
    gitAPI = require("../webapi/gitAPI.js")(res.app.locals.token);
    even = ["repository", "issues", "push", "release"];

    res.render("orgs/pickhooks", {orgs:req.app.locals.orgs, events:even});
  }
  else{

      res.app.locals.flash ={
        message:"Login to pick a org for webhooks"
      };
      res.redirect("../");

  }

});

router.route("/orgs")
.get(function(req, res) {
  if(!res.app.locals.login)
  {
    res.app.locals.flash ={
      message:"Login to show orgs"
    };
    return res.redirect("../");
  }
  gitAPI = require("../webapi/gitAPI.js")(res.app.locals.token);

  gitAPI.getUser().then(function(user)
  {
    Org.findOne({username:user.login}, function(err, result)
    {
      if(result === null)
      {
        res.app.locals.flash ={
          message:"No org picked to view"
        };
        return res.redirect("../");
      }
      else{

        gitAPI.getOneOrganizationRepos(result.org).then(function(response)
        {
          var contxt = {
            items: response.map(function(item) {
              return {
                id: item.id,
                name: item.name,
                owner: item.owner.login,
                desc: item.description,
                link:item.html_url,
                dateCreated: item.created_at,
                dateUpdated: item.updated_at,
                forks:item.forks,
                openIssues: item.open_issues_count
              };
            }),
          };

          res.render("orgs/index", {repos:contxt.items});
        });
      }
    });
  }).catch(function(err)
  {
    res.render("orgs/index", {error:"Bad token or no token given in Github Oauth"});
  });



}).post(function(req,res)
{
  if(!res.app.locals.login)
  {
    res.app.locals.flash ={
      message:"Login to pick orgs"
    };
    return res.redirect("../");
  }

  gitAPI = require("../webapi/gitAPI.js")(res.app.locals.token);
  gitAPI.getUser().then(function(user)
  {

    Org.findOne({username:user.login}, function(err, result)
    {

      if(result === null)
      {
        var org = new Org({
          org: req.body.org,
          username: user.login
        });

        org.save().then(function() {

        }).catch(function(error) {
          console.log(error.message);

        });
      }
      else{
        result.org = req.body.org;
        result.save().then(function()
        {

        }).catch(function(error)
        {
          console.log(error.message);
        });
      }

    });

  });

  gitAPI.getOneOrganizationRepos(req.body.org).then(function(response)
  {

    var contxt = {

      items: response.map(function(item) {
        return {
          id: item.id,
          name: item.name,
          owner: item.owner.login,
          desc: item.description,
          link:item.html_url,
          dateCreated: item.created_at,
          dateUpdated: item.updated_at,
          forks:item.forks,
          openIssues: item.open_issues_count
        };
      }),
    };

    res.render("orgs/index", {repos:contxt.items});
  });


});

router.route("/hooks")
.get(function(req, res) {

  res.redirect("../");
}).post(function(req,res)
{

  if(!res.app.locals.login)
  {
    res.app.locals.flash ={
      message:"Login to set webhook on org"
    };
    return res.redirect("../");
  }
  if(req.body.events === undefined)
  {
    res.app.locals.flash ={
      message:"Please pick a event to subscribe too"
    };
    return res.redirect("../");
  }

  gitAPI = require("../webapi/gitAPI.js")(req.app.locals.token);
  gitAPI.getUser().then(function(user)
  {
    Webhook.findOne({username:user.login, org:req.body.org}, function(err, result)
    {

      var webhook;

      if(result === null)
      {

        console.log(req.body.org);
        gitAPI.addOrganizationWebhook(req.body.org).then(function(response)
        {
          console.log("add");
          console.log(response);
          res.app.locals.flash = {
            message:"Webhook added on organisation and user subscribed"
          };

        }).catch(function(error)
        {
          console.log(error);
          res.app.locals.flash = {
            message:"User was added to subscribers, but couldn't add webhook on organisation, maybe already exists. "
          };


        });


        webhook = new Webhook({
          username:user.login,
          org: req.body.org,
          events: req.body.events
        });

        webhook.save().then(function()
        {


        }).catch(function(err)
        {
          res.app.locals.flash ={
            message:"Something went wrong when trying to save webhook"
          };

        });

        return res.redirect("../");
      }
      else{

        res.app.locals.flash ={
          message:"Org webhook choosed already have an subscription by the logged in user"
        };

        return res.redirect("../");
      }
    });

  });

});

module.exports = router;
