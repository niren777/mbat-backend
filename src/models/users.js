const mongoose = require('mongoose');
const q = require('q');

const util = require('../util');

const mongooseMbat = mongoose.connect('mongodb://' + util.config.mongodb.domain + ':' + util.config.mongodb.port + '/mbat')
.then(() => {
  console.log('Connected to database');
}).catch(
  (error) => console.log(error)
);


const UserSchema = new mongoose.Schema({
  email: { type: String, required: true },
  username: { type: String, required: false },
  role: { type: String, required: true },
  fullName: { type: String, required: false },
  phoneNumber: { type: String, required: false },
  schoolId: { type: String, required: false }
});

const User = mongoose.model('User', UserSchema, 'User');

const SchoolSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  phoneNumber: { type: String, required: false }
});

const School = mongoose.model('School', SchoolSchema, 'School');

function getUser(req, res, next) {
  var deferred = q.defer();
  User.findOne({email: req.user.email}, (err, user) => {
    if (err || !user) {
      deferred.reject({ status: "Error", message: err });
    }
    deferred.resolve(user);
  });
  return deferred.promise;
}

function insertUser(user) {
  var deferred = q.defer();
  getSchool(user.user_metadata.schoolId).then(function(school){
    console.log('here...1111');
    var insertData = new User({
      email: user.email,
      fullName: user.name,
      auth0Id: user.user_id,
      role: user.user_metadata.role,
      phoneNumber: user.user_metadata.phoneNumber,
      schoolId: school.id
    });
    insertData.save((err, user) => {
      if (err || !user) {
        deferred.reject({ status: "Error", message: err });
      }
      deferred.resolve(user);
    })}).catch(function(err){
      deferred.reject({ status: "Error", message: err });
    });
  return deferred.promise;
}

function getSchool(id) {
  var deferred = q.defer();
  School.findOne({id: id}, (err, school) => {
    if (err || !school) {
      deferred.reject({
        status: "Error",
        message: err
      });
    }
    deferred.resolve(school);
  });
  return deferred.promise;
}

module.exports = { UserSchema, User, getUser, insertUser, getSchool, SchoolSchema, School };