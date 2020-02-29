const request = require('request');
const requestPromise = require('request-promise');
const q = require('q');

const usersModel = require('./models/users');
const users = require('./users');
const util = require('./util');

function getAttendees (eventId) {
    var deferred = q.defer();
    var options = {
        method: 'POST',
        url: 'https://www.explara.com/api/e/attendee-list',
        headers: {
            'content-type': 'multipart/form-data; boundary=',
            'authorization': 'Bearer ' + util.config.explaraAccessToken
        },
        body: "--\r\nContent-Disposition: form-data; name=\"eventId\"\r\n\r\n" + eventId + "\r\n--\r\nContent-Disposition: form-data; name=\"fromRecord\"\r\n\r\n0\r\n--\r\nContent-Disposition: form-data; name=\"toRecord\"\r\n\r\n50\r\n----"
    };
    request(options, function (error, response, body) {
        if (error) deferred.reject(error);
        deferred.resolve(JSON.parse(body));
    });
    return deferred.promise;
};

function getEvent () {
    var deferred = q.defer();
    var options = {
        method: 'POST',
        url: 'https://in.explara.com/api/e/get-all-events',
        headers: {
            'authorization': 'Bearer ' + util.config.explaraAccessToken
        },
    };
    request(options, function (error, response, body) {
        if (error) deferred.reject(error);
        deferred.resolve(JSON.parse(body));
    });
    return deferred.promise;
};

function syncAttendees (orders, callback) {
    var promises = [];
    var previousDeferred = q.defer();
    usersModel.getTopFirstOrder().then(function(latestOrder){
        orders.forEach(function(order){
            var deferred = q.defer();
            if(latestOrder.length !== 0 && order.purchaseDate.date < latestOrder[0].purchaseDate.date){
                deferred.resolve();
            } else {
                usersModel.insertOrder(order).then(function(createdOrder){
                    console.log('buyer.attendee', order.email);
                    var innerPromises = [];
                    usersModel.getUser(order.email).then(function(buyer){
                        order.attendee.forEach(ticket => {
                            var innerDeferred = q.defer();
                            usersModel.insertTicket(ticket).then(async function(){
                                if (ticket.email !== buyer.email) {
                                    let createUserData = {
                                        "email": ticket.email,
                                        "user_metadata": {
                                            "role": "member",
                                            "schoolId": buyer.schoolId,
                                            "phoneNumber": ticket.phoneNumber || ''
                                        },
                                        "blocked": false,
                                        "email_verified": false,
                                        "app_metadata": {},
                                        "given_name": ticket.details["First Name"],
                                        "family_name": ticket.details["Last Name"],
                                        "name": ticket.details["First Name"] + " " + ticket.details["Last Name"],
                                        "user_id": ticket.id,
                                        "connection": "Username-Password-Authentication",
                                        "password": 'User12345',
                                        "verify_email": true
                                    };
                                    await users.makeUserAPICall(createUserData, callback);
                                }
                                deferred.resolve();
                                previousDeferred.resolve();
                            }).catch(function(error){
                                console.log('insertTicket..', error);
                                deferred.reject(error.message || error);
                            });
                            innerPromises.push(innerDeferred.promise);
                        });
                        q.all(innerPromises).then(function(data){
                            deferred.resolve(data);
                        }).catch(function(error){
                            deferred.reject(error.message || error);
                        });
                    }).catch(function(error){
                        console.log('getUser..', error);
                        deferred.reject(error.message || error);
                    });
                }).catch(function(error){
                    console.log('insertOrder..', error);
                    deferred.reject(error.message || error);
                });
            }
            promises.push(deferred.promise);
        });
        q.all(promises).then(function(data){
            callback(data);
        }).catch(function(error){
            callback(error.message || error);
        });
    });
    return previousDeferred.promise;
}
function getAndStoreAttendees (callback) {
    getEvent().then(function(event){
        getAttendees(event.events[0].eventId).then(async function(attendees){
            attendees.attendee.sort(function(a,b){return new Date(a.purchaseDate.date) - new Date(b.purchaseDate.date);});
            await syncAttendees(attendees.attendee, callback)
        }).catch(function(error){
            console.log('getAttendees..', error);
        });
    }).catch(function(error){
        console.log('getEvent..', error);
    });
};
module.exports = { getAndStoreAttendees, syncAttendees };