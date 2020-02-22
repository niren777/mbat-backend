const request = require('request');
const requestPromise = require('request-promise');
const q = require('q');

const users = require('./models/users');
const util = require('./util');

function getAccessToken(){
    var deferred = q.defer();
    var options = {
        method: 'POST',
        url: 'https://' + util.config.auth0.domain + '/oauth/token',
        headers: { 'content-type': 'application/json' },
        body: '{"client_id":"' + util.config.auth0.clientId + '","client_secret":"' + util.config.auth0.clientSecret + '","audience":"https://' + util.config.auth0.domain + '/api/v2/","grant_type":"client_credentials"}'
     };
    console.log(options)
    request(options, function (error, response, body) {
        if (error) deferred.reject(error);
        deferred.resolve(JSON.parse(body));
    });
    return deferred.promise;
}
function createUser(req, res, callback) {
    let createUserData = {
        "email": req.body.email,
        "user_metadata": {
            "role": "admin",
            "schoolId": req.body.schoolId,
            "phoneNumber": req.body.phoneNumber
        },
        "blocked": false,
        "email_verified": false,
        "app_metadata": {},
        "given_name": req.body.fullName && req.body.fullName.split(' ')[0] || "",
        "family_name": req.body.fullName && req.body.fullName.split(' ')[1] || "",
        "name": req.body.fullName || "",
        "user_id": req.body.id,
        "connection": "Username-Password-Authentication",
        "password": req.body.password,
        "verify_email": true
    };
    console.log(req.body);
    getAccessToken().then(function(token) {
        console.log(token)
        requestPromise({
            headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token.access_token
            },
            uri: 'https://' + util.config.auth0.domain + '/api/v2/users',
            form: createUserData,
            method: 'POST',
            resolveWithFullResponse: true
        }).then(async function(body){
            var user = JSON.parse(body.body);
            console.log(user);
            await users.insertUser(user);
            callback(user);
        }).catch(function(error){
            console.log(error);
            callback(JSON.parse(error.error || error));
        });
    });
}

function createMultipleUsers(req, res, callback) {
    var promises = [];
    getAccessToken().then(function(token) {
        req.body.forEach(function(user){
            var deferred = q.defer();
            let createUserData = {
                "email": user.email,
                "user_metadata": {
                    "role": "admin",
                    "schoolId": user.schoolId,
                    "phoneNumber": req.body.phoneNumber
                },
                "blocked": false,
                "email_verified": false,
                "app_metadata": {},
                "given_name": user.fullName && user.fullName.split(' ')[0] || "",
                "family_name": user.fullName && user.fullName.split(' ')[1] || "",
                "name": user.fullName || "",
                "user_id": user.id,
                "connection": "Username-Password-Authentication",
                "password": user.password,
                "verify_email": true
            };
            requestPromise({
                headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token.access_token
                },
                uri: 'https://' + util.config.auth0.domain + '/api/v2/users',
                form: createUserData,
                method: 'POST',
                resolveWithFullResponse: true
            }).then(async function(body){
                var user = JSON.parse(body.body);
                await users.insertUser(user);
                deferred.resolve(user);
            }).catch(function(error){
                console.log("error1111");
                deferred.reject(error.message || error);
            });
            promises.push(deferred.promise);
        });
        q.all(promises).then(function(data){
            callback(data);
        }).catch(function(error){
            callback(error.message || error);
        });
    });
}
module.exports = { createUser, createMultipleUsers };
