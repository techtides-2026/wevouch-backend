const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const moment = require('moment-timezone');

var request = require("request");
const mailSendingApi = 'http://3.136.213.9:5000/api/mail/send';

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "reply@wevouch.in",
    pass: "ReQlaim@1234",
  },
});

const Users = require("../models/users");
const Subscription = require("../models/subscription");
const Product = require("../models/products");
const Ticket = require("../models/tickets");
const TicketPackage = require("../models/ticket-package");
const Address = require("../models/address");
const subscription = require("../models/subscription");
const Notifications = require("../models/notification");
const Support = require("../models/support");
const UserSettings = require("../models/user-settings");
const InfluencerData = require("../models/influencerData");
const Influencer = require("../models/influencer");
const OnesignalUsers = require("../models/onesignal_user");

const sendWhatsappNotification = require("../helper/sendWhatsappNotification");
const sendInfluencerNotification = require("../helper/sendInfluencerNotification");

const PushNotifications = require("../models/fcm_reg_token");
// const sendPushNotification = require("../helper/sendPushNotification");
const sendNotification = require("../helper/sendNotification");
const sendOnesignalPush = require("../helper/sendOnesignalPush");
const userTransactionLog = require("../models/user-transaction-log");
const { mongo } = require("mongoose");
const UserTickets = require("../models/UserTicket");
const userRouter = express.Router();

function randomString(length, chars) {
  var result = "";
  for (var i = length; i > 0; --i)
    result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}
userRouter.get("/list", async (req, res) => {
  const users = await Users.find({ "username": { "$ne": 'admin@wevouch.app' } })
    .sort({ _id: -1 })
    .populate("subscription");
  res.send(users);
});

userRouter.get("/list2", async (req, res, next) => {
  try {
    const userData = await Users.aggregate(
      [
        {
          '$match': {
            'name': /\s{2,}/g
          }
        }
      ]
    );

    // const products = await Product.find({}).sort({_id: -1});

    let userProdutcDatas = [];

    for (let index = 0; index < userData.length; index++) {
      let customUserName = userData[index].name.split(" ").map(e => {
        return e.trim()
      }).filter(e => e.length).join(" ")
      console.log("customUserName >>>>>>>> ", customUserName);
      const userData2 = await Users.findOneAndUpdate(
        { _id: userData[index]._id },
        { name: customUserName },
        { new: true }
      )
      userProdutcDatas.push(userData2)
      // console.log("userData >>>>>>>>>> ", userData);
    }
    return res.status(200).send({error: false, count: userData.length, data2: userProdutcDatas, data: userData})
  } catch (error) {
    next(error)
  }
});

userRouter.get("/new-list", async (req, res, next) => {
  try {
    const pageNumber = +req.query.page;
    const nPerPage = +req.query.count;
    // let query = [];

    // let andQuery = [{isDeleted: false}];
    let andQuery = [{email: {$ne: 'admin@wevouch.app'}}];

    let date;
    let lessThanDate;
    if (req.query.name) {
      andQuery.push(
        // {$or: [
        //   {fname: {$regex: req.query.name, $options: 'i'}},
        //   {lname: {$regex: req.query.name, $options: 'i'}}
        // ]}
        {name: {$regex: req.query.name, $options: 'i'}}
      )
    }
    if (req.query.email) {
      andQuery.push(
        {email: {$regex: req.query.email, $options: 'i'}}
      )
    }
    if (req.query.mobile) {
      andQuery.push(
        {mobile: {$regex: req.query.mobile, $options: 'i'}}
      )
    }
    if (req.query.date) {
      let currDate = new Date(req.query.date);
      currDate.setUTCDate(currDate.getDate()-1)
      currDate.setUTCHours(18)
      currDate.setUTCMinutes(30)
      currDate.setUTCSeconds(0)
      currDate.setUTCMilliseconds(0)
      // currDate = moment(currDate).tz('Asia/Kolkata')

      let lessThanDate = new Date(req.query.date)
      lessThanDate.setDate(lessThanDate.getDate())
      lessThanDate.setUTCHours(18)
      lessThanDate.setUTCMinutes(30)
      lessThanDate.setUTCSeconds(0)
      lessThanDate.setUTCMilliseconds(0)
      // lessThanDate = moment(lessThanDate).tz('Asia/Kolkata')

      console.log({currDate, lessThanDate});
      andQuery.push(
        {"createdAt": {
          $gte: currDate, 
          $lt: lessThanDate
        }}
      )
    }
    if(req.query.productadd) {
      if(req.query.productadd == 1) {
        andQuery.push(
          {isProductAdded: true}
        )
      } else {
        andQuery.push(
          {$or: [
            {isProductAdded: false},
            {isProductAdded: undefined}
          ]}
        )
      }
    }

    if(req.query.nameAdd) {
      if(req.query.nameAdd == 1) {
        andQuery.push(
          {$or: [
            // {name: {$ne: ""}},
            {name: {$ne: undefined}}
          ]}
        )
      } else {
        andQuery.push(
          {$or: [
            // {name: ""},
            {name: undefined}
          ]}
        )
      }
    }

    console.log({andQuery});

    let totalUser = await Users.countDocuments({$and: andQuery});
    let userData = await Users.find({$and: andQuery})
    .sort({_id: -1})
    .skip( pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0 )
    .limit( nPerPage )
    
    userData = JSON.parse(JSON.stringify(userData))

    for(let i in userData) {
      let productsCount = await Product.countDocuments({users: userData[i]?._id})
      let userAddress = await Address.findOne({user: userData[i]?._id}).sort({_id: -1})
      let userTicket = await UserTickets.findOne({user: userData[i]?._id}).select("totalTicket purchasedTicket usedTicket remainingTicket")

      userData[i].totalProduct = productsCount;
      userData[i].userAddress = userAddress;
      userData[i].userTicket = userTicket;

    }

    userData = userData.map(e => {
      e.createdAtDateTime = moment(e.createdAt).tz('Asia/Kolkata').format("DD MMM YYYY - hh:mm a");
      e.lastLoginDateTime = moment(e.lastLogin).tz('Asia/Kolkata').format("DD MMM YYYY - hh:mm a");
      e.createdAtDate = moment(e.createdAt).tz('Asia/Kolkata').format("DD MMM YYYY");
      return e
    })

    res.status(200).send({ 
      error: false,
      message: 'User list',
      totalUser,
      userPerpage: nPerPage,
      data: userData,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * This method is used to fetch User all details for admin 
 * @returns user details with products tickets and all counts
 */
userRouter.get("/detail-for-admin/:userId", async (req, res, next) => {
    try {
      const userDetail = await Users.findOne({_id: req.params.userId});
      const userTicketDetail = await UserTickets.findOne({user: req.params.userId});

      const userAddress = await Address.findOne({user: req.params.userId});
      const userTickets = await Ticket.find({users: req.params.userId}).populate([
        {path: 'product', select: 'name brand category'}
      ]);
      const userProducts = await Product.aggregate([
        {"$match": { users: mongo.ObjectId(req.params.userId) } },
        {"$group" : { _id:"$brands", count:{$sum:1}} },
        {"$sort" : {count: -1}}
      ]);

      const userCategories = await Product.aggregate([
        {"$match": { users: mongo.ObjectId(req.params.userId) } },
        {"$group" : {_id:"$category", count:{$sum:1}}},
        {"$sort" : {count: -1}}
      ]);

      // const userOutofWarrantyProducts = await Product.aggregate([
      //   {"$match": { users: mongo.ObjectId(req.params.userId), outOfWarranty: 1 } },
      //   {"$group" : { _id:"$outOfWarranty", count:{$sum:1}} },
      //   {"$sort" : {count: -1}}
      // ]);

      // const userInWarrantyProducts = await Product.aggregate([
      //   {"$match": { users: mongo.ObjectId(req.params.userId), outOfWarranty: 0 } },
      //   {"$group" : { _id:"$outOfWarranty", count:{$sum:1}} },
      //   {"$sort" : {count: -1}}
      // ]);

      let allProducts = await Product.find({ users: mongo.ObjectId(req.params.userId) })
      allProducts = JSON.parse(JSON.stringify(allProducts))
      allProducts.map(e => {
        const expiredOn = moment(e?.purchaseDate).add(e?.warrantyPeriod, 'months').format('DD MMM, YYYY');
        // console.log("currentDate, expiredOn, diff", moment(), expiredOn, moment(expiredOn).diff(moment(), 'days'));
        e.warrantyDays = isNaN(moment(expiredOn).diff(moment(), 'days')) ? 0 : moment(expiredOn).diff(moment(), 'days');
        return e;
      })

      // console.log("allProducts >>>>>>>>>> ", allProducts);


      return res.status(200).send({
        error: false,
        message: 'User details',
        data: {
          userDetail,
          userTicketDetail,
          userAddress,
          userTickets,
          userProducts,
          userInWarrantyProducts: allProducts.filter(e => e.warrantyDays > 0 && e.outOfWarranty == 0).reverse(),
          userOutofWarrantyProducts: allProducts.filter(e => e.warrantyDays <= 0 || e.outOfWarranty == 1).reverse(),
          userCategories
        }
      })
    } catch (error) {
      
      next(error)
    }
  }
)

/**
 * This method is used to fetch User wise tickets count list
 * @param {name, email, mobile} request
 * @returns User wise tickets count list as success response else error error response
 */
userRouter.get("/ticket-list", async (req, res, next) => {
  try {
    const pageNumber = +req.query.page;
    const nPerPage = +req.query.count;
    // let andQuery = [{isDeleted: false}];
    let andQuery = [{}];

    if (req.query.name) {
      andQuery.push(
        // {$or: [
        //   {fname: {$regex: req.query.name, $options: 'i'}},
        //   {lname: {$regex: req.query.name, $options: 'i'}}
        // ]}
        {name: {$regex: req.query.name, $options: 'i'}}
      )
    }
    if (req.query.email) {
      andQuery.push(
        {email: {$regex: req.query.email, $options: 'i'}}
      )
    }
    if (req.query.mobile) {
      andQuery.push(
        {mobile: {$regex: req.query.mobile, $options: 'i'}}
      )
    }
    let totalUser = await Users.countDocuments({$and: andQuery});
    let userData = await Users.find({
      $and: andQuery
    })
    .sort({_id: -1})
    .skip( pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0 )
    .limit( nPerPage )
    
    userData = JSON.parse(JSON.stringify(userData))

    for(let i in userData) {
      let userTicket = await UserTickets.findOne({user: userData[i]?._id}).select("totalTicket purchasedTicket usedTicket remainingTicket");
      userData[i].userTicket = userTicket;

    }

    res.status(200).send({ 
      error: false,
      message: 'User ticket list',
      totalUser,
      userPerpage: nPerPage,
      data: userData,
    })
  } catch (error) {
    next(error)
  }
}),

/**
 * Not registered user migration
 * 
 * const onesignalUser = await OnesignalUserModel.update( {}, [ { $set: { deviceToken: "$fcmToken", onesignalId: "$onesignalPlayerId" } } ], { multi: true })
 *  
 */

/**
 * This method is used to fetch Onesignal user list
 */
userRouter.get("/not-registered-user", async (req, res, next) => {
  try {
    const pageNumber = +req.query.page;
    const nPerPage = +req.query.count;

    let query = [{user: undefined}]

    if (req.query.date) {
      let lessThanDate = new Date(req.query.date)
      lessThanDate.setDate(lessThanDate.getDate()+1)

      console.log(new Date(req.query.date), lessThanDate);
      query.push(
        {"createdAt": {
          $gte: new Date(req.query.date), 
          $lt: lessThanDate
        }}
      )
    }

    const onesignalUserData = await OnesignalUsers.find({$and: query})
      .sort({_id: -1})
      .skip( pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0 )
      .limit( nPerPage );

    const onesignalUserCount = await OnesignalUsers.count({$and: query})
    
    if (onesignalUserData.length != 0) {
        res.status(200).send({
          error: false,
          message: "Onesignal Data Found!",
          data: onesignalUserData,
          total: onesignalUserCount,
          dataPerpage: nPerPage,
        });
    } else {
        res.status(400).send({
          error: true,
          message: "No Data Found!",
        });
    }
  } catch (err) {
      next(err)
  }
})

/**
 * User search api 
 * date: 22-07-2022
 */
userRouter.get("/search", async (req, res) => {
  try {
    let users = [];
    let query = {};
    if (req.query.q || (req.query.from && req.query.to)) {

      if (req.query.q && (!req.query.from && !req.query.to)) {
        query = {
          $or: [
            {name: {$regex: req.query.q, $options: 'i'}},
            {email: {$regex: req.query.q, $options: 'i'}},
            {mobile: {$regex: req.query.q, $options: 'i'}},
            {uniqueId: {$regex: req.query.q, $options: 'i'}},
          ]
        };
      } 
      if (req.query.from && req.query.to) {
        query = {
          $and: [
            {$or: [
              {name: {$regex: req.query.q, $options: 'i'}},
              {email: {$regex: req.query.q, $options: 'i'}},
              {mobile: {$regex: req.query.q, $options: 'i'}},
              {uniqueId: {$regex: req.query.q, $options: 'i'}},
            ]},
            {createdAt: { $gte: req.query.from, $lte: req.query.to }}
          ]
        };
      }
      users = await Users.find(query).sort({ _id: -1 });

      res.status(200).send({
        error: false,
        message: "Searched users",
        data: users
      });
    } else {
      users = await Users.find({}).sort({ _id: -1 });

      res.status(200).send({
        error: false,
        message: "All users",
        data: users
      });
    }
  } catch (error) {
    res.status(200).send({
      error: true,
      message: "Bad request"
    });
  }
});

//dt. 08-04-2022
userRouter.get("/get-list", async (req, res) => {
  try {
    let andStatement = {email: { $ne: 'admin@wevouch.app' }}
    let sort = {_id: -1}
    if (req.query.id) {
      andStatement = {
        $and: [
          {_id: {$lt: req.query.id}},
          {email: { $ne: 'admin@wevouch.app' }}
        ]
      }
    }
    if (req.query.search) {
      andStatement = {
        $and: [
          {
            $or: [
              { name: { $regex:req.query.search, $options: 'i' } },
              { email: { $regex:req.query.search, $options: 'i' } },
              { mobile: { $regex:req.query.search, $options: 'i' } },
              { uniqueId: { $regex:req.query.search, $options: 'i' } }
            ]
          },
          { email: { $ne: 'admin@wevouch.app' } }
        ]
      }
    }
    const tottalUser = await Users.find({ email: { $ne: 'admin@wevouch.app' } }).count();
    const users = await Users.find(andStatement).select("name email mobile status gender uniqueId createdAt").sort(sort).limit(parseInt(req.query.limit));

    res.status(200).send({
      error: false,
      message: 'User list',
      data: users,
      tottalUser
    })

  } catch (error) {
    res.status(500).send({
      error: true,
      message: 'Operation failed',
      data: error
    })
  }
});

userRouter.get("/new-list", async (req, res) => {
  const nDate = new Date();
  const start = new Date(
    nDate.getFullYear(),
    nDate.getMonth(),
    nDate.getDate(),
    1,
    0,
    0
  );
  const query = { createdAt: start };
  const users = await Users.find(query).populate("subscription");
  res.send(users);
});

//manual registration
userRouter.post("/add", async (req, res) => {
  try {
    const sDate = new Date();
    if ((req.body.email && req.body.password && req.body.name && req.body.mobile)) {
      const userPresent = await Users.findOne({ email: req.body.email });
      if (userPresent) {
        message = {
          error: true,
          message: "It seems you are already registered on wevouch, please login to continue",
        };
        return res.status(200).send(message);
      }
      const userPresentMobile = await Users.findOne({
        mobile: req.body.mobile,
      });
      if (userPresentMobile) {
        message = {
          error: true,
          message: "It seems you are already registered on wevouch, please login to continue",
        };
        return res.status(200).send(message);
      }
      // Creating empty user object
      let newUser = new Users();

      const subscriptionDetails = await Subscription.findOne({ name: "Free" });

      // Initialize newUser object with request data
      (newUser.name = req.body.name),
        (newUser.mobile = req.body.mobile),
        (newUser.email = req.body.email),
        (newUser.password = req.body.password),
        (newUser.image = req.body.image),
        (newUser.address = req.body.address),
        (newUser.country = req.body.country),
        (newUser.state = req.body.state),
        (newUser.pin = req.body.pin),
        (newUser.dob = req.body.dob),
        (newUser.role = req.body.role),
        (newUser.gender = req.body.gender),
        (newUser.age = req.body.age),
        (newUser.landMark = req.body.landMark),
        (newUser.mobile_otp = Math.floor(1000 + Math.random() * 9000)),
        (newUser.email_otp = Math.floor(1000 + Math.random() * 9000)),
        (newUser.login_otp = Math.floor(1000 + Math.random() * 9000)),
        // (newUser.mobile_otp = 9405),
        // (newUser.email_otp = 9405),

        (newUser.uniqueId =
          "cust_" +
          randomString(
            6,
            "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
          )),
        (newUser.createdAt = new Date(
          sDate.getFullYear(),
          sDate.getMonth(),
          sDate.getDate(),
          sDate.getHours(),
          sDate.getMinutes(),
          sDate.getSeconds(),
          sDate.getMilliseconds()
        ));
      newUser.referralCode = randomString(
        "6",
        "123456789abcdefghijklmnopqrstuvwxyz"
      );
      if (!newUser.role) {
        newUser.role = "customer";
      }
      if (subscriptionDetails) {
        newUser.subscription = mongoose.Types.ObjectId(subscriptionDetails._id);
        newUser.ticketAddedCount = 0;
        newUser.remainingTicketCount = req.body.userReferralCode
          ? subscriptionDetails.ticketCount + 1
          : subscriptionDetails.ticketCount;
      }
      if (req.body.status) {
        newUser.status = req.body.status;
      }

      // Call setPassword function to hash password
      newUser.setPassword(req.body.password);

      // Save newUser object to database
      newUser.save(async (err, data) => {
        if (data) {
          data.subscription = subscriptionDetails;
          if (req.body.userReferralCode) {
            const referallUserDetails = await Users.findOne({
              referralCode: req.body.userReferralCode,
            });
            if (referallUserDetails) {
              referallUserDetails.remainingTicketCount = isNaN(
                referallUserDetails.remainingTicketCount
              )
                ? 1
                : referallUserDetails.remainingTicketCount + 1;
              await Users.findOneAndUpdate(
                { _id: referallUserDetails._id },
                referallUserDetails,
                {
                  new: true,
                }
              );
              let newNotification = new Notifications();
              let newNotification2 = new Notifications();
              (newNotification.title = "Got one extra ticket"),
              (newNotification.description = "Got one extra ticket"),
              (newNotification.createdDate = new Date(
                sDate.getFullYear(),
                sDate.getMonth(),
                sDate.getDate(),
                sDate.getHours(),
                sDate.getMinutes(),
                sDate.getSeconds(),
                sDate.getMilliseconds()
              )),
              (newNotification.user = mongoose.Types.ObjectId(data._id));

              // for second user
              (newNotification2.title = "Got one extra ticket"),
              (newNotification2.description = "Got one extra ticket count "),
              (newNotification2.createdDate = new Date(
                sDate.getFullYear(),
                sDate.getMonth(),
                sDate.getDate(),
                sDate.getHours(),
                sDate.getMinutes(),
                sDate.getSeconds(),
                sDate.getMilliseconds()
              )),
              (newNotification2.user = mongoose.Types.ObjectId(referallUserDetails._id));

              await newNotification.save();
              await newNotification2.save();
              return res.status(200).send({
                error: false,
                message: "User Added successfully",
                user: data,
              });
            } else {
              const whatsappNotification = sendWhatsappNotification({
                template: "new_registrationss",
                to: ticket.users.mobile,
                payload: []
              })

              return res.status(200).send({
                error: false,
                message: "User Added successfully",
                user: data,
              });
            }
              
          } else {
            var options1 = { method: 'POST',
              url: 'https://api.kaleyra.io/v1/HXIN1715939006IN/messages',
              headers: 
              { 'postman-token': '2d2df5dd-541f-a14d-73dd-e8095f019c04',
                'cache-control': 'no-cache',
                'api-key': 'A2f66c3daa74e66ffa590cebe1906b582',
                'content-type': 'application/x-www-form-urlencoded' },
              form: 
              { to: '+91'+req.body.mobile,
                type: 'OTP',
                sender: 'Wvouch',
                body: 'Dear Customer, welcome to wevouch! Your number '+req.body.mobile+' has been successfully registered with us. Start adding products now and leave your warranty woes to us.',
                template_id: '1707162848701603303' } };

            request(options1, function (error, response, body) {
              if (error) throw new Error(error);
              console.log(body);
            });

            var options = { method: 'POST',
              url: 'https://api.kaleyra.io/v1/HXIN1715939006IN/messages',
              headers: 
              { 'postman-token': '2d2df5dd-541f-a14d-73dd-e8095f019c04',
                'cache-control': 'no-cache',
                'api-key': 'A2f66c3daa74e66ffa590cebe1906b582',
                'content-type': 'application/x-www-form-urlencoded' },
              form: 
              { to: '+91'+req.body.mobile,
                type: 'OTP',
                sender: 'Wvouch',
                body: 'Dear Customer, please enter OTP '+newUser.mobile_otp+' to login to your Wevouch account & start managing your warranties effectively.',
                template_id: '1707162848701603303' } };

            request(options, function (error, response, body) {
              if (error) throw new Error(error);
              console.log(body);
            });

            if (newUser.email) {
              var options2 = { method: 'POST',
              url: mailSendingApi,
              headers: 
              { 'postman-token': 'ada6d640-aeee-2368-ef03-510f8ba1a51d',
                'cache-control': 'no-cache',
                'content-type': 'application/json' },
              body: 
              { email: [ newUser.email ],
                subject: 'Welcome to wevouch!',
                text: 'Dear '+newUser.name+' Thank you for choosing WeVouch. Your number '+newUser.mobile+' has been successfully registered with us.',
                html: 'Dear '+newUser.name+',<p>Thank you for choosing wevouch. Your number '+newUser.mobile+' has been successfully registered with us.</p><p>We are committed to providing you a single app to connect directly with brands and authorised service providers for warranty management and repairs.</p>You can now:<ul><li> Connect with Brands and authorised service providers</li> <li> Keep all your products and warranties in one place</li><li> Get hassle-free repairs without waiting in long call centre queues</li><li> Get reminded about expiring warranties and extend them</li></ul><p>Login anytime using this <a href="https://wevouch.in/">link</a>.</p><p>Our dedicated team will be with you every step of the way till you are connected with the right Brand for your repairs</p><p>Feel free to contact our team at support@wevouch.in or reach out to our virtual assistant WeVo on the wevouch app for any further assistance.</p><p>To watch tutorials, visit <a href="https://wevouch.in/">link</a></p><p>Team wevouch</p>' },
              json: true };

              request(options2, function (error, response, body) {
                if (error) throw new Error(error);

                console.log(body);
              });

              var options3 = { method: 'POST',
              url: mailSendingApi,
              headers: 
              { 'postman-token': 'ada6d640-aeee-2368-ef03-510f8ba1a51d',
                'cache-control': 'no-cache',
                'content-type': 'application/json' },
              body: 
              { email: [ newUser.email ],
                subject: 'Wevouch email otp',
                text: 'Dear '+newUser.name+' Thank you for choosing WeVouch. Your email OTP is '+newUser.email_otp,
                html: '<p>Dear '+newUser.name+' Thank you for choosing WeVouch. Your email otp is <b>'+newUser.email_otp+'</b></p>' },
              json: true };

              request(options3, function (error, response, body) {
                if (error) throw new Error(error);

                console.log(body);
              });
            }

            return res.status(200).send({
              error: false,
              message: "User Added successfully",
              user: data,
            });
          }
            
        } else {
          message = {
            error: true,
            message: "Failed to add user.",
            data: err
          };
          return res.status(404).send(message);
        }
      });
    } else {
      let messageText = '';
      if (req.body.email == '') {
        messageText = "Email is required"
      }
      if (req.body.password == '') {
        messageText = "Password is required"
      }
      if (req.body.name == '') {
        messageText = "Name is required"
      }
      if (req.body.mobile == '') {
        messageText = "Mobile is required"
      }
      message = {
        error: true,
        message: messageText,
      };
      return res.status(200).send(message);
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

//mobile number registration
userRouter.post("/add-via-mobile", async (req, res) => {
  try {
    const sDate = new Date();
    if ((req.body.mobile)) {
      const userPresentMobile = await Users.findOne({
        mobile: req.body.mobile,
      });
      if (userPresentMobile) {
        message = {
          error: true,
          message: "It seems you are already registered on wevouch, please login to continue",
        };
        return res.status(200).send(message);
      }
      // Creating empty user object
      let newUser = new Users();

      const subscriptionDetails = await Subscription.findOne({ name: "Free" });

      // Initialize newUser object with request data
        (newUser.mobile = req.body.mobile),
        (newUser.image = 'https://ui-avatars.com/api/?background=random&name='+req.body.mobile),
        (newUser.mobile_otp = Math.floor(1000 + Math.random() * 9000)),
        (newUser.email_otp = Math.floor(1000 + Math.random() * 9000)),
        (newUser.login_otp = Math.floor(1000 + Math.random() * 9000)),
        // (newUser.mobile_otp = 9405),
        // (newUser.email_otp = 9405),

        (newUser.uniqueId =
          "cust_" +
          randomString(
            6,
            "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
          )),
        (newUser.createdAt = new Date(
          sDate.getFullYear(),
          sDate.getMonth(),
          sDate.getDate(),
          sDate.getHours(),
          sDate.getMinutes(),
          sDate.getSeconds(),
          sDate.getMilliseconds()
        ));
      newUser.referralCode = randomString(
        "6",
        "123456789abcdefghijklmnopqrstuvwxyz"
      );
      if (!newUser.role) {
        newUser.role = "customer";
      }
      if (subscriptionDetails) {
        newUser.subscription = mongoose.Types.ObjectId(subscriptionDetails._id);
        newUser.ticketAddedCount = 0;
        newUser.remainingTicketCount = req.body.userReferralCode
          ? subscriptionDetails.ticketCount + 1
          : 0;
      }

      // Save newUser object to database
      newUser.save(async (err, data) => {
        if (data) {
          //dt. 06-04-2022
          //Usersettings add on registration
          const userSettingsData = new UserSettings({user: data.id})
          const result = await userSettingsData.save()

          data.subscription = subscriptionDetails;
          if (req.body.userReferralCode) {
            const referallUserDetails = await Users.findOne({
              referralCode: req.body.userReferralCode,
            });
            if (referallUserDetails) {
              referallUserDetails.remainingTicketCount = isNaN(
                referallUserDetails.remainingTicketCount
              )
                ? 1
                : referallUserDetails.remainingTicketCount + 1;
              await Users.findOneAndUpdate(
                { _id: referallUserDetails._id },
                referallUserDetails,
                {
                  new: true,
                }
              );
              let newNotification = new Notifications();
              let newNotification2 = new Notifications();
              (newNotification.title = "Got one extra ticket"),
                (newNotification.description = "Got one extra ticket count "),
                (newNotification.createdDate = new Date(
                  sDate.getFullYear(),
                  sDate.getMonth(),
                  sDate.getDate(),
                  sDate.getHours(),
                  sDate.getMinutes(),
                  sDate.getSeconds(),
                  sDate.getMilliseconds()
                )),
                (newNotification.uniqueId =
                  "noti_" +
                  randomString(
                    6,
                    "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
                  )),
                (newNotification.user = mongoose.Types.ObjectId(data._id));

                // for second user
                (newNotification2.title = "Got one extra ticket"),
                (newNotification2.description = "Got one extra ticket count "),
                (newNotification2.createdDate = new Date(
                  sDate.getFullYear(),
                  sDate.getMonth(),
                  sDate.getDate(),
                  sDate.getHours(),
                  sDate.getMinutes(),
                  sDate.getSeconds(),
                  sDate.getMilliseconds()
                )),
                (newNotification2.uniqueId =
                  "noti_" +
                  randomString(
                    6,
                    "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
                  )),
                (newNotification2.user = mongoose.Types.ObjectId(referallUserDetails._id));

              await newNotification.save();
              await newNotification2.save();
              return res.status(200).send({
                error: false,
                message: "User Added successfully",
                user: data,
              });
            } else {
              // const whatsappNotification = sendWhatsappNotification({
              //   template: "new_registrationss",
              //   to: req.body.mobile,
              //   payload: []
              // })
              var options3 = {
                'method': 'POST',
                'url': 'https://api.kaleyra.io/v1/HXIN1715939006IN/messages',
                'headers': {
                  'api-key': 'A2f66c3daa74e66ffa590cebe1906b582',
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                form: {
                  'from': '918240052950',
                  'to': `91${data.mobile}`,
                  'type': 'template',
                  'channel': 'whatsapp',
                  'template_name': 'new_registration',
                  'params': 'user',
                  'lang_code': 'en'
                }
              };
              request(options3, function (error, response) {
                if (error) throw new Error(error);
                console.log(response.body);
              });

              return res.status(200).send({
                error: false,
                message: "User Added successfully",
                user: data,
              });
            }
          } else {
            var options1 = { method: 'POST',
              url: 'https://api.kaleyra.io/v1/HXIN1715939006IN/messages',
              headers: 
              { 'postman-token': '2d2df5dd-541f-a14d-73dd-e8095f019c04',
                'cache-control': 'no-cache',
                'api-key': 'A2f66c3daa74e66ffa590cebe1906b582',
                'content-type': 'application/x-www-form-urlencoded' },
              form: 
              { to: '+91'+req.body.mobile,
                type: 'OTP',
                sender: 'Wvouch',
                body: 'Dear Customer, welcome to wevouch! Your number '+req.body.mobile+' has been successfully registered with us. Start adding products now and leave your warranty woes to us.',
                template_id: '1707162848701603303' } };

            request(options1, function (error, response, body) {
              if (error) throw new Error(error);
              console.log(body);
            });

            var options = { method: 'POST',
              url: 'https://api.kaleyra.io/v1/HXIN1715939006IN/messages',
              headers: 
              { 'postman-token': '2d2df5dd-541f-a14d-73dd-e8095f019c04',
                'cache-control': 'no-cache',
                'api-key': 'A2f66c3daa74e66ffa590cebe1906b582',
                'content-type': 'application/x-www-form-urlencoded' },
              form: 
              { to: '+91'+req.body.mobile,
                type: 'OTP',
                sender: 'Wvouch',
                body: 'Dear Customer, please enter OTP '+newUser.login_otp+' to login to your Wevouch account & start managing your warranties effectively.',
                template_id: '1707162848701603303' } };

            request(options, function (error, response, body) {
              if (error) throw new Error(error);
              console.log(body);
            });

            // const whatsappNotification = sendWhatsappNotification({
            //   template: "new_registrationss",
            //   to: req.body.mobile,
            //   payload: []
            // })

            var options3 = {
              'method': 'POST',
              'url': 'https://api.kaleyra.io/v1/HXIN1715939006IN/messages',
              'headers': {
                'api-key': 'A2f66c3daa74e66ffa590cebe1906b582',
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              form: {
                'from': '918240052950',
                'to': `91${data.mobile}`,
                'type': 'template',
                'channel': 'whatsapp',
                'template_name': 'new_registration',
                'params': 'user',
                'lang_code': 'en'
              }
            };
            request(options3, function (error, response) {
              if (error) throw new Error(error);
              console.log(response.body);
            });

            return res.status(200).send({
              error: false,
              message: "User Added successfully",
              user: data,
            });
          }
            
        } else {
          message = {
            error: true,
            message: "Failed to add user.",
            data: err
          };
          return res.status(404).send(message);
        }
      });
    } else {
      let messageText = "Mobile is required";
      message = {
        error: true,
        message: messageText,
      };
      return res.status(200).send(message);
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

//verify both phone and email
userRouter.post("/verify-phone-email", async (req, res) => {
  try {
    if (req.body.email && req.body.mobile_otp && req.body.email_otp) {
      // check if phone exists
      const user = await Users.findOne({ email: req.body.email });
      if (user) {
        if (req.body.mobile_otp === user.mobile_otp && req.body.email_otp === user.email_otp) {
          const verification = {
            is_mobile_verified: true,
            is_email_verified: true
          }
          const result = await Users.updateOne({ email: req.body.email }, verification);
          const againUser = await Users.findOne({ email: req.body.email }).populate("subscription");
          message = {
            error: false,
            message: "User mobile and email verified",
            data: againUser,
          };
          res.status(200).send(message);
        } else {
          message = {
            error: true,
            message: "Otp is not correct"
          };
          res.status(403).send(message);
        }
      } else {
        message = {
          error: true,
          message: "User not found"
        };
        res.status(403).send(message);
      }
    } else {
      message = {
        error: true,
        message: "email, email otp and mobile otp are required"
      };
      res.status(403).send(message);
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

//verify phone
userRouter.post("/verify-phone", async (req, res) => {
  try {
    if (req.body.mobile, req.body.mobile_otp) {
      // check if phone exists
      const user = await Users.findOne({ mobile: req.body.mobile });
      if (user) {
        if (req.body.mobile_otp === user.mobile_otp) {
          const verification = {
            is_mobile_verified: true,
          }
          const result = await Users.findOneAndUpdate({ mobile: req.body.mobile }, verification, {new: true}).populate("subscription");
          message = {
            error: false,
            message: "User mobile verified",
            data: result,
          };
          res.status(200).send(message);
        } else {
          message = {
            error: true,
            message: "Otp is not correct"
          };
          res.status(403).send(message);
        }
      } else {
        message = {
          error: true,
          message: "User not found"
        };
        res.status(403).send(message);
      }
    } else {
      message = {
        error: true,
        message: "mobile and mobile otp are required"
      };
      res.status(403).send(message);
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

//get otp
userRouter.post("/get-otp", async (req, res) => {
  try {
    if (req.body.mobile) {
      // check if phone exists
      let otp = 9405;
      if (req.body.mobile != "9804450986" && req.body.mobile != "8335852184") {
        otp = Math.floor(1000 + Math.random() * 9000);
      }
      const user = await Users.updateOne({ mobile: req.body.mobile }, {login_otp: otp, mobile_otp: otp});
      
      var options = { 
        method: 'POST',
        url: 'https://api.kaleyra.io/v1/HXIN1715939006IN/messages',
        headers: { 'postman-token': '2d2df5dd-541f-a14d-73dd-e8095f019c04',
          'cache-control': 'no-cache',
          'api-key': 'A2f66c3daa74e66ffa590cebe1906b582',
          'content-type': 'application/x-www-form-urlencoded' 
        },
        form: { 
          to: '+91'+req.body.mobile,
          type: 'OTP',
          sender: 'Wvouch',
          body: 'Dear Customer, please enter OTP '+otp+' to login to your WeVouch account & start managing your warranties effectively.',
          template_id: '1707162848701603303' 
        }
      };

      request(options, function (error, response, body) {
        if (error) throw new Error(error);
        console.log(body);
      });
      message = {
        error: false,
        message: "Otp sent to "+req.body.mobile,
        data: otp
      };
      res.status(200).send(message);
    } else {
      message = {
        error: true,
        message: "Mobile number required"
      };
      res.status(403).send(message);
    }
  } catch (error) {
    message = {
      error: true,
      message: error
    };
    res.status(500).send(message);
  }
});

//login with phone otp
userRouter.post("/phone-otp", async (req, res) => {
  try {
    const otp = Number(req.body.otp)
    if (req.body.mobile && otp) {
      // check if phone exists
      const checkUserVerifyTime = await Users.findOne({ mobile: req.body.mobile });

      let requestBody;
      if (checkUserVerifyTime?.verifiedAt) {
        requestBody = {is_mobile_verified: true, lastLogin: Date.now(), fcmToken: req.body.fcmToken}
      } else {
        requestBody = {is_mobile_verified: true, lastLogin: Date.now(), verifiedAt: Date.now(), fcmToken: req.body.fcmToken}
      }

      const user = await Users.findOneAndUpdate({ mobile: req.body.mobile }, requestBody, {new: true}).populate("subscription");
      if (user) {
        if (req.body.fcmToken) {
          let fcmNotificationData = await PushNotifications.findOneAndUpdate({$and: [{user: user._id}, {token: req.body.fcmToken}]}, {user: user._id, token: req.body.fcmToken}, {upsert: true, new: true});
          
        }
        if (otp === user.login_otp) {
          res.status(200).send(user);
        } else {
          res.status(403).send({
            message: "Otp is not correct.",
          });
        }
      } else {
        res.status(403).send({
          message: "The phone number entered by you is incorrect",
        });
      }
    } else {
      res.status(403).send({
        message: "Phone and Otp are required.",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

//check user using email
userRouter.post("/check-with-email", async (req, res) => {
  try {
    if (req.body.email) {
      // check if email exists
      const user = await Users.findOne({ email: req.body.email });
      if (user) {
        res.status(200).send({
          isError: false,
          
          data: user,
        });
      } else {
        res.status(200).send({
          isError: true,
          data: "User not found",
        });
      }
    } else {
      res.status(403).send({
        message: "Email is required.",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

//check user using mobile (For ionic)
userRouter.post("/check-with-phone", async (req, res) => {
  try {
    if (req.body.mobile) {
      // check if mobile exists
      const user = await Users.findOne({ mobile: req.body.mobile });
      if (user) {
        res.status(200).send({
          error: false,
          data: user,
        });
      } else {
        res.status(200).send({
          error: true,
          data: "User not found",
        });
      }
    } else {
      res.status(403).send({
        message: "mobile is required.",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

userRouter.post("/forgot-password", async (req, res) => {
  try {
    if (req.body.email) {
      // check if email exists
      const user = await Users.findOne({ email: req.body.email });
      if (user) {
        const generateOtp = Math.floor(100000 + Math.random() * 900000);
        const mailOptions = {
          from: "reply@reqlaim.in", // sender address
          to: req.body.email, // list of receivers
          subject: "WeVouch - Forgot Password",
          text: "Please find your secret OTP",
          html: `<p>Your otp for forget password is <b>${generateOtp}</b></p>`,
        };
        user.generatedOtp = generateOtp;
        await Users.findOneAndUpdate({ _id: user._id }, user, {
          new: true,
        });
        transporter.sendMail(mailOptions, function (err, info) {
          if (err)
            res.status(403).send({
              message: err,
            });
          else {
            return res.status(200).send({
              message: "Please check your email for OTP.",
            });
          }
        });
        
      } else {
        res.status(403).send({
          message: "User not found",
        });
      }
    } else {
      res.status(403).send({
        message: "Email is required.",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

userRouter.post("/send-email", async (req, res) => {
  try {
    if ((req.body.toEmail, req.body.subject && req.body.text)) {
      const mailOptions = {
        from: "reply@reqlaim.in", // sender address
        to: req.body.toEmail, // list of receivers
        subject: req.body.subject,
        text: req.body.text,
      };
      transporter.sendMail(mailOptions, function (err, info) {
        if (err)
          res.status(403).send({
            message: err,
          });
        else {
          return res.status(200).send({
            message: "Mail Sent.",
          });
        }
      });
    } else {
      res.status(403).send({
        message: "Subject, To Email and Text are required.",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

userRouter.post("/set-new-password", async (req, res) => {
  try {
    if (req.body.email && req.body.otp && req.body.password) {
      // check if email exists
      const user = await Users.findOne({ email: req.body.email });
      if (user) {
        if (user.generatedOtp === req.body.otp) {
          user.setPassword(req.body.password);
          await user.save();
          res.status(200).send({
            message: "Password set successfully.",
          });
        } else {
          res.status(403).send({
            message: "Otp does not match.",
          });
        }
      } else {
        res.status(403).send({
          message: "User not found",
        });
      }
    } else {
      res.status(403).send({
        message: "Email, New Password and Otp are required.",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

//user manual login
userRouter.post("/login", async (req, res) => {
  // Find user with requested email
  try {
    if (req.body.email && req.body.password) {
      const user = await Users.findOne({ email: req.body.email });
      if (user === null) {
        return res.status(200).send({
          error: true,
          message: "The email address entered by you is incorrect",
        });
      } else {
        if (user.validPassword(req.body.password)) {
            const verification = {
              mobile_otp: 9405,
              email_otp: 9405
            }
            const result = await Users.updateOne({ email: req.body.email }, verification);
            const againUser = await Users.findOne({ email: req.body.email }).populate("subscription");
            if (user.status !== "inactive") {
              return res.status(200).send({
                error: false,
                message: "User Logged In",
                user: againUser,
              });
            } else {
              message = {
                error: true,
                message: "User is Inactive",
              };
              return res.status(200).send(message);
            }
        } else {
          message = {
            error: true,
            message: "The password entered by you is incorrect",
          };
          return res.status(200).send(message);
        }
      }
    } else {
      let messageText = '';
      if (req.body.email == '') {
        messageText = "Email is required"
      }
      if (req.body.password == '') {
        messageText = "Password is required"
      }
      res.status(200).send({
        error: true,
        message: messageText,
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

//social login
userRouter.post("/social-login", (req, res) => {
  // Find user with requested social Id
  try {
    if (req.body.socialId && req.body.email) {
      Users.findOne({ socialId: req.body.socialId }, (err, user) => {
        if (err) {
          res.status(500).send({
            message: error,
          });
        }
        if (user === null) {
          // Creating empty user object
          let newUser = new Users();
          
          // Initialize newUser object with request data
          (newUser.name = req.body.name || req.body.email),
            (newUser.socialId = req.body.socialId),
            (newUser.email = req.body.email);
          if (!newUser.role) {
            newUser.role = "customer";
          }
          const sDate = new Date();
          newUser.uniqueId =
            "cust_" +
            randomString(
              6,
              "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
            );
          newUser.createdAt = new Date(
            sDate.getFullYear(),
            sDate.getMonth(),
            sDate.getDate(),
            sDate.getHours(),
            sDate.getMinutes(),
            sDate.getSeconds(),
            sDate.getMilliseconds()
          );
          newUser.uniqueId =
            "cust_" +
            randomString(
              6,
              "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
            );

          Subscription.findOne({ name: "Free" })
            .then((subscriptionDetails) => {
              if (subscriptionDetails) {
                newUser.subscription = mongoose.Types.ObjectId(
                  subscriptionDetails._id
                );
                newUser.ticketAddedCount = 0;
                newUser.remainingTicketCount = subscriptionDetails.ticketCount;
              }
              newUser.save((err, userAddedd) => {
                if (err) {
                  return res.status(400).send({
                    message: "Failed to add user.",
                    err,
                  });
                } else {
                  return res.status(200).send({
                    message: "User Logged In",
                    user: userAddedd,
                  });
                }
              });
            })
            .catch(() => {
              newUser.save((err, userAddedd) => {
                if (err) {
                  return res.status(400).send({
                    message: "Failed to add user.",
                    err,
                  });
                } else {
                  return res.status(200).send({
                    message: "User Logged In",
                    user: userAddedd,
                  });
                }
              });
            });
        } else {
          return res.status(200).send({
            message: "User Logged In",
            user,
          });
        }
      });
    } else {
      res.status(403).send({
        message: "Email and Social Id are required.",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

userRouter.get("/get/:id", async (req, res) => {
  try {
    const user = await Users.findOne({ _id: req.params.id }).populate(
      "subscription"
    );
    if (user) {
      res.status(200).send(user);
    } else {
      res.status(404).send({
        error: "User doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "User doesn't exist!" });
  }
});

//dt 29-04-2022
userRouter.get("/get-user-all-details/:id", async (req, res) => {
  try {
    const user = await Users.findOne({ _id: req.params.id }).populate(
      "subscription"
    );
    const products = await Product.find({ users: req.params.id }).sort({ _id: -1 }).populate("users");
    const tickets = await Ticket.find({ users: req.params.id }).sort({ _id: -1 }).populate(
      "users products executive address"
    )
    const addresses = await Address.find({ user: req.params.id }).sort({ _id: -1 })
    if (user) {
      res.status(200).send({
        error: false,
        message: "User details with products, tickets, addresses",
        data: {
          user,
          products,
          tickets,
          addresses
        }
      });
    } else {
      res.status(404).send({
        error: true,
        message: "User doesn't exist!"
      });
    }
  } catch {
    res.status(500);
    res.send({ error: true, message: "Something went wrong" });
  }
});

userRouter.get("/get-by-unique-id/:uniqueId", async (req, res) => {
  try {
    const user = await Users.findOne({
      uniqueId: req.params.uniqueId,
    }).populate("subscription");
    if (user) {
      res.status(200).send(user);
    } else {
      res.status(404).send({
        error: "User doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "User doesn't exist!" });
  }
});

userRouter.patch("/update/:id", async (req, res) => {
  try {
    let user = await Users.findOne({ _id: req.params.id });
    if (user) {
      const name = req.body.name || user.name;
      if (req.body.userReferralCode) {
        console.log(req.body.userReferralCode);

        //find influencer
        const finndInfluencer = await Influencer.findOne({$or: [{referralCode: req.body.userReferralCode},{otherReferralCodes: {$in: req.body.userReferralCode}}]})
        if (finndInfluencer) {
          const finndInfluencerData = await InfluencerData.findOne({user: req.params.id})
          if (!finndInfluencerData) {
            const influencerData = new InfluencerData();
            (influencerData.user = req.params.id),
            (influencerData.influencer = finndInfluencer._id),
            (influencerData.influencerRefCode = req.body.userReferralCode),
            await influencerData.save()
            req.body.isAddedViaRefferal = true
            let notficationdata = await sendInfluencerNotification({
              user: req.params.id,
              influencer: finndInfluencer._id,
              title: "User signed up using referral code",
              description: "User " + name + " signed up using " + req.body.userReferralCode + " successfully."
            });
          }
        }
      }
      if (req.body.subscriptionId) {
        user.subscription = mongoose.Types.ObjectId(req.body.subscriptionId);
        const subscriptionDetails = await Subscription.findOne({
          _id: req.body.subscriptionId,
        });
        if (subscriptionDetails) {
          user.ticketAddedCount = 0;
          if (isNaN(user.remainingTicketCount)) {
            user.remainingTicketCount = 0;
          }
          user.remainingTicketCount = user.remainingTicketCount + subscriptionDetails.ticketCount;
          req.body.ticketAddedCount = user.ticketAddedCount;
          req.body.remainingTicketCount = user.remainingTicketCount;
          req.body.subscription = user.subscription;
        }
      }
      user = req.body;
      const filter = { _id: req.params.id };
      if (name) {
        user.name = user.name.split(" ").map(e => {
          return e.trim()
        }).filter(e => e.length).join(" ")
        
        const prevUserData = await Users.findOne({ _id: req.params.id });
        delete user.password;
        // delete user.email;
        delete user.salt;
        delete user.hash;

        const newUser = await Users.findOneAndUpdate(filter, user, {
          new: true,
        }).populate("subscription");


        /**
         * Send whatsapp notification
         */
        // console.log('Hello world',prevUserData, req.body);
        if (!prevUserData.name && req.body.name) {
          console.log('hello');
          var options3 = {
            'method': 'POST',
            'url': 'https://api.kaleyra.io/v1/HXIN1715939006IN/messages',
            'headers': {
              'api-key': 'A2f66c3daa74e66ffa590cebe1906b582',
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            form: {
              'from': '918240052950',
              'to': `91${newUser.mobile}`,
              'type': 'template',
              'channel': 'whatsapp',
              'template_name': 'new_registration_1',
              'params': req.body.name.split(" ")[0] || 'user',
              'lang_code': 'en'
            }
          };
          request(options3, function (error, response) {
            if (error) throw new Error(error);
          });
        }

        res.status(200).send(newUser);
      } else {
        res.status(403).send({
          error: "Name is required",
        });
      }
    } else {
      res.status(404).send({
        error: "User doesn't exist!",
      });
    }
  } catch (error) {
    res.status(500);
    res.send({ error: error });
  }
});

userRouter.patch("/update-ticket-count/:id", async (req, res) => {
  try {
    let user = await Users.findOne({ _id: req.params.id });
    if (user) {
      const name = req.body.name || user.name;
      
     
      user = req.body;
      const filter = { _id: req.params.id };
      const prevUserData = await Users.findOne({ _id: req.params.id });

      const newUser = await Users.findOneAndUpdate(filter, {remainingTicketCount: req.body.remainingTicketCount}, {
        new: true,
      }).populate("subscription");
      await UserTickets.findOneAndUpdate({user: req.params.id}, {
        $inc: {
          totalTicket: req.body.ticketAdded,
          remainingTicket: req.body.ticketAdded
        }
      }, {new: true})
      
      res.status(200).send(newUser);
      
    } else {
      res.status(404).send({
        error: "User doesn't exist!",
      });
    }
  } catch (error) {
    res.status(500);
    res.send({ error: error });
  }
});

//buy ticket package dt. 04-03-2022
userRouter.patch("/buy-ticket-package/:userId", async (req, res) => {
  try {
    const ticketPackage = await TicketPackage.findOne({_id: req.body.ticketPackageId});
    if (ticketPackage) {
      const userCheck = await Users.findOneAndUpdate({ _id: req.params.userId }, { $inc: { remainingTicketCount: ticketPackage.ticketCount } }, { new: true })
      if (userCheck) {
        message = {
          error: false,
          message: "Ticket Package bought successful!",
          data: userCheck
        };
      } else {
        message = {
          error: true,
          message: "User not found!",
        };
      }
    } else {
      message = {
        error: true,
        message: "Ticket Package not found!",
      };
    }
    res.status(200).send(message)
  } catch (error) {
    res.status(500);
    res.send({ error: true, message: "Operation failed", data: error });
  }
});

//buy ticket package dt. 29-09-2022
userRouter.patch("/purchase-ticket-package/:userId", async (req, res) => {
  try {
    const ticketPackage = await TicketPackage.findOne({_id: req.body.ticketPackageId});
    if (ticketPackage) {
      const userCheck = await Users.findOneAndUpdate({ _id: req.params.userId }, { $inc: { remainingTicketCount: ticketPackage.ticketCount } }, { new: true })
      const userTicketData = await UserTickets.findOneAndUpdate(
        {user: req.params.userId},
        {
          $inc: { totalTicket: ticketPackage.ticketCount, purchasedTicket: ticketPackage.ticketCount }
        }, 
        {new: true}
      );

      let newTransaction = new userTransactionLog({
        user: req.params.userId,
        transactionId: req.body.transactionId,
        transactionAmount: req.body.transactionAmount
      });

      const userTransactionTResult = await newTransaction.save()

      if (userCheck) {
        message = {
          error: false,
          message: "Ticket Package bought successful!",
          data: userCheck,
          transaction: userTransactionTResult
        };
      } else {
        message = {
          error: true,
          message: "User not found!",
        };
      }
    } else {
      message = {
        error: true,
        message: "Ticket Package not found!",
      };
    }
    res.status(200).send(message)
  } catch (error) {
    res.status(500);
    res.send({ error: true, message: "Operation failed", data: error });
  }
});

userRouter.patch("/first-time-status/:userId", async (req, res) => {
  try {
    let user = await Users.findOneAndUpdate({ _id: req.params.userId }, {isFirstTime: req.body.firstTime}, {new: true});

    if (user) {
      res.status(200).send(
        {
          error: false,
          message: "first-time status updated!",
          data: user
        }
      )
    } else {
      res.status(200).send({
        error: true,
        message: "User not found"
      })
    }

  } catch (error) {
    res.status(500).send({
      error: true,
      message: "Operation failed"
    })
  }
})

// dt. 08-04-2022
userRouter.patch("/first-product-add/:userId", async (req, res) => {
  try {
    let user = await Users.findOneAndUpdate({ _id: req.params.userId }, {isFirstProductAdded: req.body.firstProductAdd});

    if (user.isFirstProductAdded === false && req.body.firstProductAdd === true) {
      const finndInfluencerData = await InfluencerData.findOne({user: req.params.userId})
      if (finndInfluencerData) {
        await Influencer.findOneAndUpdate({_id: finndInfluencerData.influencer}, {$inc: {affiliatedCommission: 25}})
      }
    }

    if (user) {
      res.status(200).send(
        {
          error: false,
          message: "first product added!",
        }
      )
    } else {
      res.status(200).send({
        error: true,
        message: "User not found"
      })
    }

  } catch (error) {
    res.status(500).send({
      error: true,
      message: "Operation failed"
    })
  }
})

userRouter.patch("/toggle-user-status/:id", async (req, res) => {
  try {
    if (req.body.status) {
      let user = await Users.findOne({ _id: req.params.id });
      if (user) {
        const newUser = new Users();
        newUser._id = user._id;
        newUser.status = req.body.status;
        const filter = { _id: req.params.id };
        const updatedUser = await Users.findOneAndUpdate(filter, newUser, {
          new: true,
        });

        res.status(200).send(updatedUser);
      } else {
        res.status(404).send({
          error: "User doesn't exist!",
        });
      }
    } else {
      res.status(403).send({ message: "Status is required" });
    }
  } catch (error) {
    res.status(500);
    res.send({ error: error });
  }
});

userRouter.delete("/delete/:id", async (req, res) => {
  try {
    const user = await Users.findOne({ _id: req.params.id });
    if (user) {
      await Users.deleteOne({ _id: req.params.id });
      res.status(200).send();
    } else {
      res.status(404).send({
        error: "User doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "User doesn't exist!" });
  }
});

userRouter.post("/change-password", (req, res) => {
  try {
    if (req.body.email && req.body.password && req.body.newPassword) {
      Users.findOne({ email: req.body.email }, async (err, user) => {
        if (user === null) {
          return res.status(400).send({
            message: "User not found.",
          });
        } else {
          if (user.validPassword(req.body.password)) {
            user.setPassword(req.body.newPassword);
            await user.save();
            res.status(200).send(user);
          } else {
            return res.status(400).send({
              message: "Wrong Password",
            });
          }
        }
      });
    } else {
      res.status(403).send({
        message: "Email , New Password and Password are required.",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

userRouter.post("/admin-login", (req, res) => {
  try {
    if (req.body.email && req.body.password) {
      if (
        req.body.email === "admin@wevouch.app"
      ) {
        Users.findOne({ email: req.body.email }, (err, user) => {
          if (user === null) {
            return res.status(400).send({
              message: "User not found.",
            });
          } else {
            if (user.validPassword(req.body.password)) {
              if (user.status !== "inactive") {
                return res.status(200).send({
                  message: "User Logged In",
                  user,
                });
              } else {
                return res.status(403).send({
                  message: "User is Inactive",
                });
              }
            } else {
              return res.status(400).send({
                message: "Wrong Password",
              });
            }
          }
        })
      } else {
        res.status(403).send({ message: "Please send correct email" });
      }
    } else {
      res.status(403).send({
        message: "Email and Password are required.",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

userRouter.get("/get-dashboard-data", async (req, res) => {
  try {
    const totalCustomers = await Users.find({ email: { $exists: true, $nin: ["admin@wevouch.app"] } });
    // const nDate = new Date();
    // const start = new Date(
    //   nDate.getFullYear(),
    //   nDate.getMonth(),
    //   nDate.getDate(),
    //   0,
    //   0,
    //   0,
    //   0
    // );
    // start.setDate(start.getDate() - 1);
    // console.log({ start, nDate});
    // // let moment1 = moment().subtract(1, "days");
    // let moment1 = moment().tz('Asia/Kolkata');
    
    // let moment2 = moment({
    //   year: moment1.year(),
    //   month: moment1.month(),
    //   day: moment1.date(),
    //   hour: 0,
    //   minute: 0,
    //   second: 0,
    //   millisecond: 0
    // }).tz('Asia/Kolkata');

    // console.log(moment1);
    // console.log(moment2);

    let currDate = new Date();
    currDate.setUTCDate(currDate.getDate()-1)
    currDate.setUTCHours(18)
    currDate.setUTCMinutes(30)
    currDate.setUTCSeconds(0)
    currDate.setUTCMilliseconds(0)
    // currDate = moment(currDate).tz('Asia/Kolkata')

    let lessThanDate = new Date()
    lessThanDate.setDate(lessThanDate.getDate())
    lessThanDate.setUTCHours(18)
    lessThanDate.setUTCMinutes(30)
    lessThanDate.setUTCSeconds(0)
    lessThanDate.setUTCMilliseconds(0)

    console.log("dashboard date", {currDate, lessThanDate})

    const query = { createdAt: {$gte: currDate} };
    const totalNewCustomers = await Users.find(query);
    let totalProducts = await Product.find().populate({path: "users", select:"name"});
    totalProducts = totalProducts.filter(e => e.users);
    
    let totalNewProducts = await Product.find({ createdAt: {$gte: currDate} }).populate({path: "users", select:"name"});
    totalNewProducts = totalNewProducts.filter(e => e.users);

    let andQuery = [
      {"userData.0": {$exists: true}},
      {"productData.0": {$exists: true}},
      {"$or": [{status: "new"}, {status: "ongoing"}, {status: "completed"}, {status: "cancelled"}]}
    ]
    let totalTickets = await Ticket.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'users',
          foreignField: '_id',
          as: 'userData',
          pipeline: [
            { $project: { name: "$name", email: "$email", mobile: "$mobile", isVerified: "$isVerified" } },
          ]
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'products',
          foreignField: '_id',
          as: 'productData',
          pipeline: [
            { $project: { name: "$name", brands: "$brands", category: "$category", subcCategory: "$subcCategory", modelName: "$modelName", modelNo: "$modelNo" } },
          ]
        }
      },
      {
        $match: {
          $and: andQuery
        }
      },
      {
        $sort: {_id: -1}
      }
    ])

    // let totalTickets = await Ticket.find().populate([
    //   {path: "users", select:"name email phone"},
    //   {path: "products", select: "name brand category createdAt"}
    // ]).sort({ createdAt: -1 });

    // totalTickets = totalTickets.filter(e => e.users);
    const onGoingTickets = totalTickets.filter((t) => t.status == "ongoing");
    const completedTickets = totalTickets.filter((t) => t.status == "completed");
    const totalNewTickets = totalTickets.filter((t) => t.status == "new");
    // const latestTickets = await Ticket.find()
    //   .sort({ createdAt: -1 })
    //   .limit(10)
    //   .populate("users products");
    const toSendData = {
      onGoingTickets: onGoingTickets.length,
      completedTickets: completedTickets.length,
      totalCustomers: totalCustomers.length,
      totalNewCustomers: totalNewCustomers.length,
      totalProducts: totalProducts.length,
      totalNewProducts: totalNewProducts.length,
      totalTickets: totalTickets.length,
      totalNewTickets: totalNewTickets.length,
      latestTickets: totalTickets.splice(0, 10),
    };
    res.status(200).send(toSendData);
  } catch {
    res.status(404);
    res.send({ error: "Operation failed!" });
  }
});

userRouter.post("/get-dashboard-data-executive", async (req, res) => {
  try {
    const query = { executive: mongoose.Types.ObjectId(req.body.executiveId) };
    const totalTickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .populate("users products");
    const newTickets = totalTickets.filter((t) => t.status === "new" && t.users).length;
    const onGoingTickets = totalTickets.filter((t) => t.status === "ongoing" && t.users)
      .length;
    const completedTickets = totalTickets.filter(
      (t) => t.status === "completed" && t.users
    ).length;
    const cancelledTickets = totalTickets.filter(
      (t) => t.status === "cancelled" && t.users
    ).length;
    const toSendData = {
      newTickets,
      onGoingTickets,
      completedTickets,
      cancelledTickets,
    };
    res.status(200).send(toSendData);
  } catch {
    res.status(404);
    res.send({ error: "User doesn't exist!" });
  }
});

userRouter.post("/support/send", async (req, res) => {
  try {
    const SupportData = new Support(req.body);
    const result = await SupportData.save();
    message = {
      error: false,
      message: "Support text send Successfully!",
    };
    res.status(201).send(message);
	} catch (err) {
		message = {
			error: true,
			message: "Operation Failed!",
			data: err,
		};
		res.status(400).send(message);
	}
});

userRouter.get("/support/list", async (req, res) => {
  try {
    const SupportData = await Support.find({}).sort({ createdAt: -1 });
    message = {
      error: false,
      message: "Support texts",
      data: SupportData
    };
    res.status(200).send(message);
	} catch (err) {
		message = {
			error: true,
			message: "Operation Failed!",
			data: err,
		};
		res.status(400).send(message);
	}
});

userRouter.delete("/support/delete/:supportId", async (req, res) => {
  try {
		const result = await Support.deleteOne({ _id: req.params.supportId });
		if (result.deletedCount == 1) {
			message = {
				error: false,
				message: "Support text deleted successfully!",
			};
			res.status(200).send(message);
		} else {
			message = {
				error: true,
				message: "Support text not deleted!",
			};
			res.status(400).send(message);
		}
	} catch (err) {
		message = {
			error: true,
			message: "Operation Failed!",
			data: err,
		};
		res.status(400).send(message);
	}
});


//date 02-08-2022
userRouter.post("/user-check", async (req, res) => {
  try {
    const sDate = new Date();
    
    if ((req.body.mobile)) {
      const userPresentMobile = await Users.findOne({
        mobile: req.body.mobile,
      });
      if (!userPresentMobile) {
        // Creating empty user object
        let newUser = new Users();

        // Initialize newUser object with request data
        (newUser.mobile = req.body.mobile),
        (newUser.image = 'https://ui-avatars.com/api/?background=random&name='+req.body.mobile),
        (newUser.mobile_otp = Math.floor(1000 + Math.random() * 9000)),
        (newUser.login_otp = Math.floor(1000 + Math.random() * 9000)),
        (newUser.email_otp = Math.floor(1000 + Math.random() * 9000)),

        (newUser.uniqueId =
          "cust_" + randomString( 6, "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ" )
        ),
        (newUser.createdAt = new Date(
          sDate.getFullYear(),
          sDate.getMonth(),
          sDate.getDate(),
          sDate.getHours(),
          sDate.getMinutes(),
          sDate.getSeconds(),
          sDate.getMilliseconds()
        ));
        newUser.referralCode = randomString(6, "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
        if (!newUser.role) {
          newUser.role = "customer";
        }

        // const subscriptionDetails = await Subscription.findOne({ name: "Free" });
        // if (subscriptionDetails) {
        //   newUser.subscription = mongoose.Types.ObjectId(subscriptionDetails._id);
        //   newUser.ticketAddedCount = 0;
        //   newUser.remainingTicketCount = req.body.userReferralCode
        //     ? subscriptionDetails.ticketCount + 1
        //     : 0;
        // }
        let expDate = new Date(
          sDate.getFullYear(),
          sDate.getMonth(),
          sDate.getDate(),
          0, 0, 0, 0
        );
        expDate.setDate(expDate.getDate() + 60);

        newUser.ticketAddedCount = 2;
        newUser.remainingTicketCount = 2;
        newUser.ticketExpiryDate = expDate;

        // Save newUser object to database
        newUser.save(async (err, data) => {
          if (data) {

            const userSettingsData = new UserSettings({user: data.id})
            const result = await userSettingsData.save();

            const userTicketData = new UserTickets({user: data.id, totalTicket: 2, remainingTicket: 2})
            const savedUserTicket = await userTicketData.save();
            const userNotification = await sendNotification({userId: data?._id, title: 'Early Bird Offer', desc: 'Dear User, you have been rewarded 2 complimentary SRT (service request tickets) as an Early Bird Offer, valid upto 60 days.' });
            
            // if (req.body.userReferralCode) {
            //   const referallUserDetails = await Users.findOne({
            //     referralCode: req.body.userReferralCode,
            //   });
            //   if (referallUserDetails) {
            //     referallUserDetails.remainingTicketCount = isNaN(
            //       referallUserDetails.remainingTicketCount
            //     )
            //       ? 1
            //       : referallUserDetails.remainingTicketCount + 1;
            //     await Users.findOneAndUpdate(
            //       { _id: referallUserDetails._id },
            //       referallUserDetails,
            //       {
            //         new: true,
            //       }
            //     );
            //     let newNotification = new Notifications();
            //     let newNotification2 = new Notifications();
            //     (newNotification.title = "Got one extra ticket"),
            //       (newNotification.description = "Got one extra ticket count "),
            //       (newNotification.createdDate = new Date(
            //         sDate.getFullYear(),
            //         sDate.getMonth(),
            //         sDate.getDate(),
            //         sDate.getHours(),
            //         sDate.getMinutes(),
            //         sDate.getSeconds(),
            //         sDate.getMilliseconds()
            //       )),
            //       (newNotification.uniqueId =
            //         "noti_" +
            //         randomString(
            //           6,
            //           "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
            //         )),
            //       (newNotification.user = mongoose.Types.ObjectId(data._id));

            //       // for second user
            //       (newNotification2.title = "Got one extra ticket"),
            //       (newNotification2.description = "Got one extra ticket count "),
            //       (newNotification2.createdDate = new Date(
            //         sDate.getFullYear(),
            //         sDate.getMonth(),
            //         sDate.getDate(),
            //         sDate.getHours(),
            //         sDate.getMinutes(),
            //         sDate.getSeconds(),
            //         sDate.getMilliseconds()
            //       )),
            //       (newNotification2.uniqueId =
            //         "noti_" +
            //         randomString(
            //           6,
            //           "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
            //         )),
            //       (newNotification2.user = mongoose.Types.ObjectId(referallUserDetails._id));

            //     await newNotification.save();
            //     await newNotification2.save();
            //     
                // var options3 = {
                //   'method': 'POST',
                //   'url': 'https://api.kaleyra.io/v1/HXIN1715939006IN/messages',
                //   'headers': {
                //     'api-key': 'A2f66c3daa74e66ffa590cebe1906b582',
                //     'Content-Type': 'application/x-www-form-urlencoded'
                //   },
                //   form: {
                //     'from': '918240052950',
                //     'to': `91${data.mobile}`,
                //     'type': 'template',
                //     'channel': 'whatsapp',
                //     'template_name': 'new_registration',
                //     'params': 'user',
                //     'lang_code': 'en'
                //   }
                // };
                // request(options3, function (error, response) {
                //   if (error) throw new Error(error);
                //   console.log(response.body);
                // });
            //     return res.status(200).send({
            //       error: false,
            //       message: "User Added successfully",
            //       user: data,
            //     });
            //   } else {
                  // var options3 = {
                  //   'method': 'POST',
                  //   'url': 'https://api.kaleyra.io/v1/HXIN1715939006IN/messages',
                  //   'headers': {
                  //     'api-key': 'A2f66c3daa74e66ffa590cebe1906b582',
                  //     'Content-Type': 'application/x-www-form-urlencoded'
                  //   },
                  //   form: {
                  //     'from': '918240052950',
                  //     'to': `91${data.mobile}`,
                  //     'type': 'template',
                  //     'channel': 'whatsapp',
                  //     'template_name': 'new_registration',
                  //     'params': 'user',
                  //     'lang_code': 'en'
                  //   }
                  // };
                  // request(options3, function (error, response) {
                  //   if (error) throw new Error(error);
                  //   console.log(response.body);
                  // });
            //     return res.status(200).send({
            //       error: false,
            //       message: "User Added successfully",
            //       user: data,
            //     });
            //   }
            // } else {
              
              // var options1 = { method: 'POST',
              //   url: 'https://api.kaleyra.io/v1/HXIN1715939006IN/messages',
              //   headers: 
              //   { 'postman-token': '2d2df5dd-541f-a14d-73dd-e8095f019c04',
              //     'cache-control': 'no-cache',
              //     'api-key': 'A2f66c3daa74e66ffa590cebe1906b582',
              //     'content-type': 'application/x-www-form-urlencoded' },
              //   form: 
              //   { to: '+91'+req.body.mobile,
              //     type: 'OTP',
              //     sender: 'Wvouch',
              //     body: 'Dear Customer, welcome to wevouch! Your number '+req.body.mobile+' has been successfully registered with us. Start adding products now and leave your warranty woes to us.',
              //     template_id: '1707162848701603303' } };

              // request(options1, function (error, response, body) {
              //   if (error) throw new Error(error);
              //   // console.log(body);
              // });
              

              var options = {
                method: 'POST',
                url: 'https://api.kaleyra.io/v1/HXIN1715939006IN/messages',
                headers: {
                  'api-key': 'A2f66c3daa74e66ffa590cebe1906b582',
                  'content-type': 'application/x-www-form-urlencoded' 
                },
                form: { 
                  to: '+91'+req.body.mobile,
                  type: 'OTP',
                  sender: 'Wvouch',
                  body: 'Dear Customer, please enter OTP '+newUser.login_otp+' to login to your Wevouch account & start managing your warranties effectively.',
                  template_id: '1707162848701603303' 
                } 
              };

              request(options, function (error, response, body) {
                if (error) throw new Error(error);
                // console.log(body);
              });

              // const whatsappNotification = sendWhatsappNotification({
              //   template: "registration_new",
              //   to: req.body.mobile,
              //   payload: []
              // })

              return res.status(200).send({
                error: false,
                message: "User Added successfully",
                user: data,
              });
            // }
              
          } else {
            message = {
              error: true,
              message: "Failed to add user.",
              data: err
            };
            return res.status(404).send(message);
          }
        });
      } else {
        let otp = 9405;
        if (req.body.mobile != "9804450986" && req.body.mobile != "8335852184" && req.body.mobile != "6290130853") {
          console.log(req.body.mobile, typeof req.body.mobile);
          otp = Math.floor(1000 + Math.random() * 9000);
        }
        const user = await Users.findOneAndUpdate({ mobile: req.body.mobile }, {login_otp: otp, mobile_otp: otp}, {new: true});


        var options = { 
          method: 'POST',
          url: 'https://api.kaleyra.io/v1/HXIN1715939006IN/messages',
          headers: { 'postman-token': '2d2df5dd-541f-a14d-73dd-e8095f019c04',
            'cache-control': 'no-cache',
            'api-key': 'A2f66c3daa74e66ffa590cebe1906b582',
            'content-type': 'application/x-www-form-urlencoded' 
          },
          form: { 
            to: '+91'+req.body.mobile,
            type: 'OTP',
            sender: 'Wvouch',
            body: 'Dear Customer, please enter OTP '+otp+' to login to your Wevouch account & start managing your warranties effectively.',
            template_id: '1707162848701603303' 
          } 
        };
        request(options, function (error, response, body) {
          if (error) throw new Error(error);
          // console.log(body);
        });

        return res.status(200).send({
          error: false,
          message: "User Found",
          user: user,
        });
      }
      
    } else {
      let messageText = "Mobile is required";
      message = {
        error: true,
        message: messageText,
      };
      return res.status(200).send(message);
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

userRouter.post("/store-user", async (req, res) => {
  try {
    let onesignalUserData;

    if (req.body.deviceType == 0) {
      req.body.fcmToken = (req.body.fcmToken).replace(/[^a-z0-9]/gi, '');
    }

    var onesignalOptions = {
      'method': 'POST',
      'url': 'https://onesignal.com/api/v1/players',
      'headers': {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "app_id": "37ee6ce1-016c-4993-b2b9-3d83669b0cb3",
        "device_type": req.body.deviceType,
        "identifier": req.body.fcmToken
      })
    
    };

    request(onesignalOptions, async function (error, response) {
      if (error) throw new Error(error);
      let resp = response.body;
      resp = JSON.parse(resp);
      console.log(resp);
      if (resp.success == true) {
        onesignalUserData = await OnesignalUsers.findOneAndUpdate({uuid: req.body.uuid}, {uuid: req.body.uuid, fcmToken: req.body.fcmToken, onesignalPlayerId: resp.id, deviceType: req.body.deviceType}, {upsert: true, new: true})
      }
      if (onesignalUserData) {
        res.status(200).send({
          error: false,
          message: "Onesignal user data",
          data: onesignalUserData
        });
      } else {
        res.status(200).send({
          error: true,
          message: "Onesignal user data not added",
          data: onesignalUserData
        });
      }
    })

  } catch (error) {
    res.status(500).send({
      error: true,
      message: String(error),
    });
  }
})

// new
// Login with phone otp
// 06-09-2022
userRouter.post("/login-with-otp", async (req, res) => {
  try {
    const otp = Number(req.body.otp)
    if (req.body.mobile && otp) {
      // check if phone exists
      const checkUserVerifyTime = await Users.findOne({ mobile: req.body.mobile });

      //generate onesignal player id and subscribe the user

      if (req.body.deviceType == 0) {
        req.body.fcmToken = (req.body.fcmToken).replace(/[^a-z0-9]/gi, '');
      }

      // return res.status(200).send(req.body);
      var onesignalOptions = {
        'method': 'POST',
        'url': 'https://onesignal.com/api/v1/players',
        'headers': {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "app_id": "37ee6ce1-016c-4993-b2b9-3d83669b0cb3",
          "device_type": req.body.deviceType,
          "identifier": req.body.fcmToken
        })
      
      };
      request(onesignalOptions, async function (error, response) {
        if (error) throw new Error(error);
        let resp = response.body;
        resp = JSON.parse(resp);
        // console.log("resp", resp, typeof resp, resp?.success, resp.includes('false'));
        console.log(resp);
        if (resp.success == true) {
          // console.log("resp", resp);
          const onesignalUserData = await OnesignalUsers.findOneAndUpdate({$or: [{user: checkUserVerifyTime._id}, {uuid: req.body.uuid}]}, {user: checkUserVerifyTime._id, uuid: req.body.uuid, fcmToken: req.body.fcmToken, onesignalPlayerId: resp.id, deviceType: req.body.deviceType}, {upsert: true, new: true});

          const userData = await Users.findOneAndUpdate({_id: checkUserVerifyTime._id}, {uuid: req.body.uuid, fcmToken: req.body.fcmToken, player_id: resp.id, deviceType: req.body.deviceType}, {new: true})
          console.log("onesignalUserData",onesignalUserData, userData);

        }
      });


      let requestBody;
      if (checkUserVerifyTime?.verifiedAt) {
        requestBody = {isVerified: true, is_mobile_verified: true, lastLogin: Date.now(), fcmToken: req.body.fcmToken, deviceToken: req.body.fcmToken}
      } else {
        requestBody = {isVerified: true, is_mobile_verified: true, lastLogin: Date.now(), verifiedAt: Date.now(), fcmToken: req.body.fcmToken, deviceToken: req.body.fcmToken}
      }

      const user = await Users.findOneAndUpdate({ mobile: req.body.mobile }, requestBody, {new: true}).populate("subscription");
      if (user) {


        if (req.body.fcmToken) {
          let fcmNotificationData = await PushNotifications.findOneAndUpdate({$and: [{user: user._id}, {token: req.body.fcmToken}]}, {user: user._id, token: req.body.fcmToken}, {upsert: true, new: true});
          
        }
        if (otp === user.login_otp) {
          res.status(200).send(user);
        } else {
          res.status(403).send({
            message: "Otp is not correct.",
          });
        }
      } else {
        res.status(403).send({
          message: "The phone number entered by you is incorrect",
        });
      }
    } else {
      res.status(403).send({
        message: "Phone and Otp are required.",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

userRouter.post("/login-with-otp-ios", async (req, res) => {
  try {
    const otp = Number(req.body.otp)
    if (req.body.mobile && otp) {
      // check if phone exists
      const checkUserVerifyTime = await Users.findOne({ mobile: req.body.mobile });

      //generate onesignal player id and subscribe the user

      if (req.body.deviceType == 0) {
        req.body.fcmToken = (req.body.fcmToken).replace(/[^a-z0-9]/gi, '');
      }

      // return res.status(200).send(req.body);
      var onesignalOptions = {
        'method': 'POST',
        'url': 'https://onesignal.com/api/v1/players',
        'headers': {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "app_id": "33b3f7ae-2a24-4e55-934f-06e2764e6cfc",
          "device_type": req.body.deviceType,
          "identifier": req.body.fcmToken
        })
      
      };
      request(onesignalOptions, async function (error, response) {
        if (error) throw new Error(error);
        let resp = response.body;
        resp = JSON.parse(resp);
        // console.log("resp", resp, typeof resp, resp?.success, resp.includes('false'));
        console.log(resp);
        if (resp.success == true) {
          // console.log("resp", resp);
          const onesignalUserData = await OnesignalUsers.findOneAndUpdate({$or: [{user: checkUserVerifyTime._id}, {uuid: req.body.uuid}]}, {user: checkUserVerifyTime._id, uuid: req.body.uuid, fcmToken: req.body.fcmToken, onesignalPlayerId: resp.id, deviceType: req.body.deviceType}, {upsert: true, new: true});
          const userData = await Users.findOneAndUpdate({_id: checkUserVerifyTime._id}, {uuid: req.body.uuid, fcmToken: req.body.fcmToken, player_id: resp.id, deviceType: req.body.deviceType}, {new: true})
          console.log("onesignalUserData",onesignalUserData, userData);
        }
      });


      let requestBody;
      if (checkUserVerifyTime?.verifiedAt) {
        requestBody = {is_mobile_verified: true, lastLogin: Date.now(), fcmToken: req.body.fcmToken}
      } else {
        requestBody = {is_mobile_verified: true, lastLogin: Date.now(), verifiedAt: Date.now(), fcmToken: req.body.fcmToken}
      }

      const user = await Users.findOneAndUpdate({ mobile: req.body.mobile }, requestBody, {new: true}).populate("subscription");
      if (user) {
        if (req.body.fcmToken) {
          let fcmNotificationData = await PushNotifications.findOneAndUpdate({$and: [{user: user._id}, {token: req.body.fcmToken}]}, {user: user._id, token: req.body.fcmToken}, {upsert: true, new: true});
          
        }
        if (otp === user.login_otp) {
          res.status(200).send(user);
        } else {
          res.status(403).send({
            message: "Otp is not correct.",
          });
        }
      } else {
        res.status(403).send({
          message: "The phone number entered by you is incorrect",
        });
      }
    } else {
      res.status(403).send({
        message: "Phone and Otp are required.",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});


userRouter.post("/send-fcm", async (req, res) => {
  try {
    let resp;
    resp = await sendOnesignalPush({
      title: "abc",
      message: "def",
      player_ids: ["f93eaece-b578-42fe-9bed-34fd87506701"]
    })
    if (resp) {
      console.log(resp, typeof resp);  
      return res.status(200).send({abc: "def", "res": resp})
    }
    
  } catch (error) {
    return res.status(400).send({error})
  }
})

userRouter.post("/create-by-admin", async (req, res) => {
  try {
    const checkUser = await Users.findOne({$or: [
      {mobile: req.body.mobile}
    ]})
    if(checkUser) return res.status(400).send({error: true, message: "User already exist."})
    let sDate = new Date();
    let expDate = new Date(
      sDate.getFullYear(),
      sDate.getMonth(),
      sDate.getDate(),
      0, 0, 0, 0
    );
    expDate.setDate(expDate.getDate() + 60);
    req.body.ticketAddedCount = 2;
    req.body.remainingTicketCount = 2;
    req.body.ticketExpiryDate = expDate;
    req.body.uniqueId = `cust_${Date.now()}`;
    req.body.createdAt = sDate;
    const userData = new Users(req.body)
    const savedUser = await userData.save();

    const userSettingsData = new UserSettings({user: savedUser._id})
    const savedUserSettings = await userSettingsData.save();

    const userTicketData = new UserTickets({user: savedUser._id, totalTicket: 2, remainingTicket: 2})
    const savedUserTicket = await userTicketData.save();
    
    if(savedUser) {
      return res.status(200).send({
        error: false, 
        message: "User created.",
        data: savedUser
      })
    }
    return res.status(400).send({error: true, message: "User not added."})

  } catch (error) {
    return res.status(500).send({error: true, message: String(error)})
  }
})

module.exports = userRouter;
