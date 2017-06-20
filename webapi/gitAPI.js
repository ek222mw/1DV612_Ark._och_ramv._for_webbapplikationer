/*jshint esversion: 6 */
//this code orginally from Christopher in wp class, but modified now.
var useragent = "express-github-oauth";
var webhookEnd = "https://207.154.200.30/githubwebhook";
var rp = require('request-promise-native');

function postData(authToken, url, data) {
    var options = {
        method: "POST",
        uri: url,
        headers: {
            'User-Agent': useragent,
            "Authorization": `token ${authToken}`
        },
        json: true,
        body: data
    };
    return rp(options);
}

function fetchData(authToken, url) {
    var options = {
        uri: url,
        headers: {
            'User-Agent': useragent,
            "Authorization": `token ${authToken}`
        },
        json: true
    };
    return rp(options);
}

module.exports = (authToken) => {
    return {

    checkIfOrganizationWebhookExists: function(org) {
        // Does return true organization webhook already have been created
    },
    addOrganizationWebhook: function(org) {
        var events = ["repository", "issues", "push", "release"];
        var url = "https://api.github.com/orgs/"+org+"/hooks";
        events = events || ["push"];
        var webhookdata = {
            "name": "web",
            "active": true,
            "events": events,
            "config": {
                "url": webhookEnd,
                "content_type": "json",
                "secret": process.env['HOOK_SECRET'],
                "insecure_ssl": "1"
            }
        };

        return postData(authToken, url, webhookdata);
    },
    // Orgs
    getAllOrganizations: function() {
        var url = "https://api.github.com/user/orgs";
        return fetchData(authToken, url);
    },
    getOneOrganization: function(org) {
        var url = "https://api.github.com/orgs/"+org;
        return fetchData(authToken, url);
    },
    getUser:function()
    {

      var url = `https://api.github.com/user`;
      return fetchData(authToken, url);
    },
    getOneOrganizationRepos: function(org) {
        var url = "https://api.github.com/orgs/"+org+'/repos';
        return fetchData(authToken, url);
    },
    getOneOrganizationEvents: function(org) {
        var url = "https://api.github.com/orgs/"+org+'/events';
        return fetchData(authToken, url);
    },
    addRepoWebhook: function(repo, authToken) {

    },
    checkIfRepoWebhookExists: function(repo, authToken) {

    }

};
};
