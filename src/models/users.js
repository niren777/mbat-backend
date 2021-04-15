const mongoose = require('mongoose');
const q = require('q');

const util = require('../util');

const mongooseMbat = mongoose.connect('mongodb://' + util.config.mongodb.domain + ':' + util.config.mongodb.port + '/mbat', { useFindAndModify: false })
.then(() => {
  console.log('Connected to database');
}).catch(
  (error) => console.log(error)
);


const UserSchema = new mongoose.Schema({
  email: { type: String, unique : true, required: true },
  username: { type: String, required: false },
  role: { type: String, required: true },
  fullName: { type: String, required: false },
  phoneNumber: { type: String, required: false },
  schoolId: { type: String, required: false },
  auth0Id: { type: String, required: true, default: '' },
  emailVerified: { type: Boolean, required: true,  default: false },
  createdAt: { type: String, required: false },
  picture: { type: String, default: '' },
  address: { type: String, required: false },
  country: { type: String, required: false },
  state: { type: String, required: false },
  yearOfGraduation: { type: String, required: false },
  linkedIn: { type: String, required: false },
  program: { type: String, required: false }
});

const User = mongoose.model('User', UserSchema, 'User');

const SchoolSchema = new mongoose.Schema({
  id: { type: String, unique : true, required: true },
  name: { type: String, required: true },
  address: { type: String, required: false },
  phoneNumber: { type: String, required: false },
  logo: { type: String, required: false, default: '' },
  points: { type: String, required: false, default: '' }
});

const School = mongoose.model('School', SchoolSchema, 'School');

const TicketSchema = new mongoose.Schema({
  ticketName: { type: String, required: false },
  ticketId: { type: String, unique : true, required: true },
  email: { type: String, required: true },
  checkin: { type: String, required: true },
  ticketNo: { type: String, unique : true, required: true },
  status: { type: String, required: true },
});

const Ticket = mongoose.model('Ticket', TicketSchema, 'Ticket');

const OrderSchema = new mongoose.Schema({
  orderNo: { type: String, unique : true, required: false },
  orderCost: { type: Number },
  quantity: { type: Number },
  status: { type: String, required: false },
  paidBy: { type: String, required: false },
  paidTo: { type: String, required: false },
  refundAmount: { type: String, required: false },
  purchaseDate: {
      date: { type: String, required: false },
      timezone_type: { type: String, required: false },
      timezone: { type: String, required: false }
  },
  name: { type: String, required: false },
  email: { type: String, required: false },
  city: { type: String, required: false },
  state: { type: String, required: false },
  country: { type: String, required: false },
  address: { type: String, required: false },
  zipcode: { type: String, required: false },
  phoneNo: { type: String, required: false },
  attendee: [String]
});

const Order = mongoose.model('Order', OrderSchema, 'Order');

function insertOrder(order) {
  var deferred = q.defer();
  var tempOrder = JSON.parse(JSON.stringify(order));
  var tempAttendee = [];
  order.attendee.forEach(ticket => {
    tempAttendee.push(ticket.ticketId);
  });
  console.log(tempAttendee);
  tempOrder.attendee = tempAttendee;
  var insertData = new Order(tempOrder);
  insertData.save((err, createdOrder) => {
    if (err || !createdOrder) {
      deferred.reject({ status: "Error", message: err });
    }
    deferred.resolve(createdOrder);
  });
  return deferred.promise;
}

function insertTicket(ticket) {
  var deferred = q.defer();
  var tempTicket = {
    ticketName: ticket.ticketName,
    ticketId: ticket.ticketId,
    email: ticket.email,
    checkin: ticket.checkin,
    ticketNo: ticket.ticketNo,
    status: ticket.status
  }
  var insertData = new Ticket(tempTicket);
  insertData.save((err, createdTicket) => {
    if (err || !createdTicket) {
      deferred.reject({ status: "Error", message: err });
    }
    deferred.resolve(createdTicket);
  });
  return deferred.promise;
}

function getTopFirstOrder() {
  var deferred = q.defer();
  Order.find({}, null, {sort: {'purchaseDate.date': -1}, limit: 1}, (err, order) => {
    console.log(order.email);
    if (err || !order) {
      deferred.reject({ status: "Error", message: err });
    }
    deferred.resolve(order);
  });
  return deferred.promise;
}

function getOrders(email) {
  var outerDeferred = q.defer();
  Order.find({email: email}, (err, orders) => {
    var promises = [];
    !orders && outerDeferred.resolve([]);
    err && outerDeferred.reject({ status: "Error", message: err });
    let tempOrders = JSON.parse(JSON.stringify(orders));
    tempOrders.forEach(order => {
      var deferred = q.defer();
      let tempTicketIds = JSON.parse(JSON.stringify(order.attendee));
      var innerPromises = [];
      tempTicketIds.forEach(ticketId => {
        var innerDeferred = q.defer();
        getTicket(ticketId).then(function(ticket, err){
          innerDeferred.resolve(ticket);
        }).catch(function(error){
          console.log(error);
          innerDeferred.reject(error.message || error);
        });
        innerPromises.push(innerDeferred.promise);
      });
      q.all(innerPromises).then(function(data){
        order.attendee = data;
        console.log('tempOrders', order);
        deferred.resolve(order);
      }).catch(function(error){
        deferred.reject(error.message || error);
      });
      promises.push(deferred.promise);
    });
    q.all(promises).then(function(data){
      outerDeferred.resolve(data);
    }).catch(function(error){
      outerDeferred.reject(error.message || error);
    });
  });
  return outerDeferred.promise;
}

function getUser(email) {
  var deferred = q.defer();
  User.findOne({email: email}, (err, user) => {
    console.log(user, err, email);
    if (err || !user) {
      deferred.reject({ status: "Error", message: err });
    }
    if (user && user.schoolId) {
      getSchool(user.schoolId).then(function(school, err){
        user = JSON.parse(JSON.stringify(user));
        user['schoolName'] = school.name;
        deferred.resolve(user);
      })
    } else {
      deferred.reject({ status: "Error", message: err });
    }

  });
  return deferred.promise;
}

function insertUser(user, otherData) {
  var deferred = q.defer();
  getSchool(user.user_metadata.schoolId).then(function(school){
    console.log('here...1111');
    var insertData = new User({
      email: user.email,
      fullName: user.name,
      auth0Id: user.user_id,
      role: user.user_metadata.role,
      phoneNumber: user.user_metadata.phoneNumber,
      schoolId: school.id,
      emailVerified: user.email_verified,
      createdAt: user.created_at,
      picture: user.picture,
      yearOfGraduation: otherData.yearOfGraduation,
      linkedIn: otherData.linkedIn,
      program: otherData.program
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

function getTicket(ticketId) {
  var deferred = q.defer();
  Ticket.findOne({ticketId: ticketId}, (err, ticket) => {
    if (err || !ticket) {
      deferred.reject({
        status: "Error",
        message: err
      });
    }
    deferred.resolve(ticket);
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

function getSchools() {
  var deferred = q.defer();
  School.find({}, (err, school) => {
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

function getUsers() {
  var deferred = q.defer();
  User.find({}, (err, users) => {
    if (err || !users) {
      deferred.reject({
        status: "Error",
        message: err
      });
    }
    deferred.resolve(users);
  });
  return deferred.promise;
}

function insertSchool(school) {
  var deferred = q.defer();
  var insertData = new School({
    id: school.id,
    name: school.name,
    address: school.address,
    phoneNumber: school.phoneNumber
  });
  console.log(insertData)
  insertData.save((err, school) => {
    if (err || !school) {
      deferred.reject({ status: "Error", message: err });
    }
    deferred.resolve(school);
  });
  return deferred.promise;
}

function updatePointsForSchool(points, schoolId, callback) {
  var deferred = q.defer();
  School.findOneAndUpdate({id: schoolId}, {points: points}, (err, school) => {
    if (err || !school) {
      deferred.reject({ status: "Error", message: err });
    }
    school.points = points;
    deferred.resolve(school);
  });
  return deferred.promise;
}

module.exports = { UserSchema, User, getUser, insertUser, getSchool, SchoolSchema, School,
  getSchools, insertSchool, getTopFirstOrder, insertTicket, insertOrder, getOrders, getUsers, updatePointsForSchool };
