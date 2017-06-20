/*jshint esversion: 6 */
require('dotenv').config();
let exphbs = require("express-handlebars");
let bodyParser = require('body-parser');
let path = require('path');
var token;
var express = require("express"),
app = express(),
port = 3000;
var Slack = require("slack-node");
var slackApiToken = process.env['SLACK_API_TOKEN'];
var https = require('https');
var GithubWebHook = require('express-github-webhook');
var webhookHandler = GithubWebHook({ path: '/githubwebhook', secret: process.env['HOOK_SECRET'] });
var gitAPI;
var helmet = require('helmet');
var User = require("./models/User");
var LastSaved = require("./models/LastSaved");
var Webhook = require("./models/Webhook");
var session = require('express-session');
var fs = require('fs');



slack = new Slack(slackApiToken);
require("./libs/helper").initialize();
//use for localhost
/*var server = app.listen(port, function() {
  console.log('Listening on port %d',port);
});*/
//use for production
var server = https.createServer({
    key: fs.readFileSync("./config/sslcerts/key.pem"),
    cert: fs.readFileSync("./config/sslcerts/cert.pem")
}, app).listen(port, function() {
      console.log("Express Server.js started on port %s!", port);
      console.log("Press Ctrl-C to exit and terminate");
});
var io = require("socket.io")(server);
app.set('socket.io', io);

app.engine(".hbs", exphbs({
  defaultLayout: "main",
  extname: ".hbs"
}));
app.set("view engine", ".hbs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
//use for localhost
//app.use(express.static(path.join(__dirname, "public")));
app.use(webhookHandler);

//http headers protection.
app.use(helmet());


//send webhook to slack and user gets notification from the slackbot.
webhookHandler.on('repository', function (repo, data) {
  var ev = "repository";

  Webhook.find({org:data.repository.owner.login}, function(err, result)
  {
    console.log(result);
    for(i=0; i<result.length; i++)
    {

      for(j=0; j<result[i].events.length; j++)
      {
        if(result[i].events[j] === ev)
        {
          console.log("event found");


          if(result[i].slack)
          {

            User.findOne({username:result[i].username}, function(err, resu)
            {
              console.log(resu);
              if(resu === null)
              {
                app.locals.flash = {
                  message:"Could not find slack username for github user"+result[i].username+" for offline notes"
                };

              }
              else{
                var hookmsg ='New Github repository notification. Action: '+data.action+', Title: '+data.repository.name+', Org: '+data.organization.login+' by User: '+data.sender.login+'';
                var slackAPI = require("./webapi/slackAPI.js")(slackApiToken);
                slackAPI.postWebhook(resu.slackusername, hookmsg).then(function(response)
                {
                  console.log(response);
                });
                //save tempdata for user until next login.
                if(!app.get('login'))
                {

                  var lastSaved = new LastSaved({
                    message:hookmsg,
                    user: resu.username
                  });

                  lastSaved.save().then(function() {
                    console.log("saved in db 1");
                  }).catch(function(error) {
                    console.log(error.message);

                  });
                }
              }


            });
          }
          else{
            if(!app.get('login'))
            {

              var hookmsg ='New Github repository notification. Action: '+data.action+', Title: '+data.repository.name+', Org: '+data.organization.login+' by User: '+data.sender.login+'';
              var lastSaved = new LastSaved({
                message:hookmsg,
                user: result[i].username
              });

              lastSaved.save().then(function() {
                console.log("saved in db 2");
              }).catch(function(error) {
                console.log(error.message);

              });
            }
          }
        }
      }


    }

  });
});

webhookHandler.on('issues', function (repo, data) {
  var ev = "issues";

  Webhook.find({org:data.repository.owner.login}, function(err, result)
  {
    console.log(result);
    for(i=0; i<result.length; i++)
    {

      for(j=0; j<result[i].events.length; j++)
      {
        if(result[i].events[j] === ev)
        {
          console.log("event found");


          if(result[i].slack)
          {

            User.findOne({username:result[i].username}, function(err, resu)
            {

              if(resu === null)
              {
                app.locals.flash = {
                  message:"Could not find slack username for github user"+result[i].username+" for offline notes"
                };

              }
              else{
                var hookmsg ='New Github issue notification. Action: '+data.action+', Title: '+data.issue.title+' in Repository: '+data.repository.name+',Org: '+data.organization.login+' by User: '+data.issue.user.login+'';
                var slackAPI = require("./webapi/slackAPI.js")(slackApiToken);
                slackAPI.postWebhook(resu.slackusername, hookmsg).then(function(response)
                {
                  console.log(response);
                });
                if(!app.get('login'))
                {

                  var lastSaved = new LastSaved({
                    message:hookmsg,
                    user: resu.username
                  });

                  lastSaved.save().then(function() {
                    console.log("saved in db 1");
                  }).catch(function(error) {
                    console.log(error.message);

                  });
                }
              }


            });
          }
          else{
            if(!app.get('login'))
            {
              console.log("slack notes off");
              var hookmsg ='New Github issue notification. Action: '+data.action+', Title: '+data.issue.title+' in Repository: '+data.repository.name+',Org: '+data.organization.login+' by User: '+data.issue.user.login+'';
              var lastSaved = new LastSaved({
                message:hookmsg,
                user: result[i].username
              });

              lastSaved.save().then(function() {
                console.log("saved in db 2");
              }).catch(function(error) {
                console.log(error.message);

              });
            }
          }
        }
      }


    }

  });
});

webhookHandler.on('*', function (event, repo, data) {
  console.log(event);

  if(event !== 'repository' && event !== 'issues')
  {

    Webhook.find({org:data.repository.owner.login}, function(err, result)
    {

      for(i=0; i<result.length; i++)
      {

        for(j=0; j<result[i].events.length; j++)
        {
          if(result[i].events[j] === event)
          {
            console.log("event found");


            if(result[i].slack)
            {

              User.findOne({username:result[i].username}, function(err, resu)
              {

                if(resu === null)
                {
                  app.locals.flash = {
                    message:"Could not find slack username for github user"+result[i].username+" for offline notes"
                  };

                }
                else{
                  var hookmsg;
                  if(event === 'push')
                  {
                    hookmsg ='New Github '+event+' notification. Commit message: '+data.head_commit.message+', Repository: '+data.repository.name+', Org: '+data.organization.login+' by User: '+data.sender.login+'';
                  }
                  else if(event === 'release')
                  {
                    hookmsg ='New Github '+event+' notification. Action: '+data.action+', Title: '+data.release.name+', Repository: '+data.repository.name+', Org: '+data.organization.login+' by User: '+data.sender.login+'';
                  }

                  var slackAPI = require("./webapi/slackAPI.js")(slackApiToken);
                  slackAPI.postWebhook(resu.slackusername, hookmsg).then(function(response)
                  {
                    console.log(response);
                  });
                  if(!app.get('login'))
                  {

                    var lastSaved = new LastSaved({
                      message:hookmsg,
                      user: resu.username
                    });

                    lastSaved.save().then(function() {
                      console.log("saved in db 1");
                    }).catch(function(error) {
                      console.log(error.message);

                    });
                  }
                }


              });
            }
            else{
              if(!app.get('login'))
              {
                var hookmsg;
                if(event === 'push')
                {
                  hookmsg ='New Github '+event+' notification. Commit message: '+data.head_commit.message+', Repository: '+data.repository.name+', Org: '+data.organization.login+' by User: '+data.sender.login+'';
                }
                else if(event === 'release')
                {
                  hookmsg ='New Github '+event+' notification. Action: '+data.action+', Title: '+data.release.name+', Repository: '+data.repository.name+', Org: '+data.organization.login+' by User: '+data.sender.login+'';
                }
                console.log("slack notes off");

                var lastSaved = new LastSaved({
                  message:hookmsg,
                  user: result[i].username
                });

                lastSaved.save().then(function() {
                  console.log("saved in db 2");
                }).catch(function(error) {
                  console.log(error.message);

                });
              }
            }

          }
        }


      }

    });
  }
});



io.on('connection', function (socket) {

  if(app.get("login"))
  {
    webhookHandler.on('repository', function (repo, data) {
      var ev = "repository";
      gitAPI = require("./webapi/gitAPI.js")(app.get("token"));
      gitAPI.getUser().then(function(user)
      {
        Webhook.findOne({username:user.login,org:data.repository.owner.login}, function(err, res)
        {
          if(res !== null)
          {
            for(j=0; j<res.events.length; j++)
            {
              if(res.events[j] === ev)
              {
                console.log("event found github");
                console.log("github status "+res.github);
                if(res.github)
                {
                  console.log("github webhook on");
                  socket.emit("repomessage", {action: data.action, title:data.repository.name, user:data.sender.login });

                  if(data.action === 'created')
                  {
                    socket.emit("repoadd", {title:data.repository.name, forks:data.repository.forks, issues:data.repository.open_issues_count, dateCreated:data.repository.created_at,
                      dateUpdated:data.repository.updated_at, link:data.repository.html_url,id:data.repository.id, owner:data.repository.owner.login, desc: data.repository.description   });
                    }
                    if(data.action === 'deleted')
                    {
                      socket.emit("reporemove", {id:data.repository.id});
                    }
                  }
                }
              }
            }
            else{
              app.locals.flash = {
                message:"Could not find github username or organisation for online notes"
              };
            }
          });

        });

      });
      webhookHandler.on("issues", function (repo, data) {
        var ev = "issues";
        gitAPI = require("./webapi/gitAPI.js")(app.get("token"));
        gitAPI.getUser().then(function(user)
        {
          Webhook.findOne({username:user.login,org:data.repository.owner.login}, function(err, res)
          {
            if(res !== null)
            {
              for(j=0; j<res.events.length; j++)
              {
                if(res.events[j] === ev)
                {
                  console.log("event found github");

                  if(res.github)
                  {

                    socket.emit("issuemessage", {action: data.action, title:data.issue.title, repository:data.repository.name, user:data.issue.user.login });
                    if(data.action === 'opened')
                    {
                      socket.emit("issueadd", {action: data.action, title:data.issue.title, repository:data.repository.name, user:data.issue.user.login, id:data.repository.id,
                        openIssuesCount:data.repository.open_issues_count });
                      }
                    }
                  }
                }
              }
              else{
                app.locals.flash = {
                  message:"Could not find github username or organisation for online notes"
                };
              }
            });

          });


        });
        webhookHandler.on('*', function (event,repo, data) {

          if(event !== 'repository' && event !== 'issues')
          {
            gitAPI = require("./webapi/gitAPI.js")(app.get("token"));
            gitAPI.getUser().then(function(user)
            {
              Webhook.findOne({username:user.login,org:data.repository.owner.login}, function(err, res)
              {
                if(res !== null)
                {
                  for(j=0; j<res.events.length; j++)
                  {
                    if(res.events[j] === event)
                    {
                      console.log("event found github");

                      if(res.github)
                      {
                        console.log("github webhook on");
                        if(event === 'push')
                        {
                          socket.emit("pushmessage", {message: data.head_commit.message, title:data.repository.name, user:data.sender.login });
                        }
                        else if(event === 'release')
                        {
                          socket.emit("releasemessage", {action: data.action, repo:data.repository.name, user:data.sender.login, title:data.release.name });
                        }
                      }
                    }
                  }
                }
                else{
                  app.locals.flash = {
                    message:"Could not find github username or organisation for online notes"
                  };
                }
              });

            });
          }
        });
      }
    });


webhookHandler.on('error', function (err, req, res) {
  if(err)
  {
    console.log(err);
    res.render("error/500hook");
  }

});

app.use("/", require("./routes/home.js"));
app.use("/slack", require("./routes/slack.js"));
app.use("/github", require("./routes/github.js"));
app.use("/githubwebhook", require("./routes/payload.js"));

app.use(function(req,res, next) {
  res.locals.login = res.app.locals.login;
  res.locals.loginUser = res.app.locals.loginUser;
  res.locals.logout = res.app.locals.logout;
  res.app.locals.flash = "";

  next();
});


//handles 404 errors.
app.use(function(req, res, next) {

  res.status(404).render("error/404");
});

//handles error 500 errors
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).render("error/500");
});
