const express = require("express");
const Tickets = require("../models/tickets");
const TicketLog = require("../models/ticket-log");
const Users = require("../models/users");
const Products = require("../models/products");
const SupportExecutive = require("../models/support-executive-users");
const mongoose = require("mongoose");
const Notifications = require("../models/notification");
const ServiceExecutiveNotifications = require("../models/service-executive-notification");
const ticketRouter = express.Router();

var request = require("request");
const sendNotification = require("../helper/sendNotification");
const sendWhatsappNotification = require("../helper/sendWhatsappNotification");
const ticketIssue = require("../models/ticket-issue");
const ticketIssueComment = require("../models/ticket-issue-comment");
const UserTickets = require("../models/UserTicket");

const mailSendingApi = 'http://3.136.213.9:5000/api/mail/send';

function randomString(length , chars) {
  var result = "";
  for (var i = length; i > 0; --i)
    result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

async function randomTicketNumber() {
  var result = "";
  var chars1 = "23456789";
  var chars2 = "0123456789";
  for (var i = 6; i > 0; --i) {
    result += chars1[Math.floor(Math.random() * chars1.length)];
  }
  for (var i = 2; i > 0; --i) {
    result += chars2[Math.floor(Math.random() * chars2.length)];
  }
  var checkTicketNum = await Tickets.findOne({uniqueId: result});
  if (checkTicketNum) {
    return randomTicketNumber();
  }
  return result;
}

ticketRouter.get("/list", async (_req, res) => {
  const tickets = await Tickets.find().populate(
    "users products executive address"
  );
  res.send(tickets);
});

/**
 * fetch all ticket list here
 */
ticketRouter.get("/new-list", async (req, res, next) => {
  try {
    const pageNumber = +req.query.page;
    const nPerPage = +req.query.count;

    let andQuery = [
      {"userData.0": {$exists: true}},
      {"productData.0": {$exists: true}}
    ]
    
    if(req.query.ticketid) {
      andQuery.push(
        {uniqueId: {$regex: req.query.ticketid, $options: 'i'}}
      )
    }
    if(req.query.mobile) {
      andQuery.push(
        {"userData.0.mobile": {$regex: req.query.mobile, $options: 'i'}}
      )
    }
    if(req.query.brand) {
      andQuery.push(
        {"productData.0.brands": {$regex: req.query.brand, $options: 'i'}}
      )
    }
    if(req.query.category) {
      andQuery.push(
        {"productData.0.category": {$regex: req.query.category, $options: 'i'}}
      )
    }
    if(req.query.status) {
      andQuery.push(
        {"status": {$regex: req.query.status, $options: 'i'}}
      )
    }
    if(req.query.date) {
      let lessThanDate = new Date(req.query.date)
      lessThanDate.setDate(lessThanDate.getDate()+1)
      console.log(new Date(req.query.date), lessThanDate);
      andQuery.push(
        {"createdAt": {$gte: new Date(req.query.date), $lt: lessThanDate}}
      )
    }

    console.log(andQuery);

    /**
     * For current usage
     */
    let ticketData = await Tickets.aggregate([
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
        $lookup: {
          from: 'supportexecutives',
          localField: 'executive',
          foreignField: '_id',
          as: 'executiveData',
          pipeline: [
            { $project: { name: "$name", email: "$email" } },
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
      },
      {
        $skip: pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0
      },
      {
        $limit: nPerPage
      }
    ])

    const totalTicket = await Tickets.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'users',
          foreignField: '_id',
          as: 'userData',
          pipeline: [
            { $project: { name: "$name", email: "$email", mobile: "$mobile" } },
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
        $count: "total"
      }
    ])
// console.log("totalTicket >>>>>>>>>>> ", totalTicket.length);
    res.status(200).send({ 
      error: false,
      message: 'Ticket list',
      totalTicket: totalTicket.length ? totalTicket[0].total : 0,
      dataPerpage: nPerPage,
      data: ticketData
    })
  } catch (error) {
    next(error)
  }
})

/**
 * Fetch complete ticket detail
 */
ticketRouter.get("/all-detail/:ticketId", async (req, res, next) => {
  try {
    const ticketData = await Tickets.findOne({ _id: req.params.ticketId }).populate([
      {
        path: "users",
        select: "name email mobile isVerified"
      },
      {
        path: "products"
      },
      {
        path: "executive",
        select: "name email mobile address country pin state"
      },
      {
        path: "address"
      }
    ])

    let ticketIssues = await ticketIssue.find({ticket: req.params.ticketId}).sort({_id: -1})
    ticketIssues = JSON.parse(JSON.stringify(ticketIssues))

    for (element in ticketIssues) {
      const ticketComments = await ticketIssueComment.find({ticketIssue: ticketIssues[element]._id}).sort({_id: -1})
      ticketIssues[element].comments = ticketComments;
    }

    res.status(200).send({ 
      error: false,
      message: 'Ticket all detail',
      data: ticketData,
      ticketIssues
    })
  } catch (error) {
    next(error)
  }
})

/**
 * Ticket search api 
 * date: 22-07-2022
 */
ticketRouter.get("/search", async (req, res) => {
  try {

    if (req.query.q) {
      /**
       * This block is to check ticket by uniqueId/category/brand
       * 
       */
      const query = {
        $or: [
          {uniqueId: {$regex: req.query.q, $options: 'i'}},
          {category: {$regex: req.query.q, $options: 'i'}},
          {brand: {$regex: req.query.q, $options: 'i'}}
        ]
      };
      let tickets = await Tickets.find(query).sort({ _id: -1 }).populate(
        [
          {
            path: "users"
          },
          {
            path: "products"
          }
        ]
      );
      let check2 = false;

      /**
       * This block is after getting no ticket by uniqueId/category/brand
       * Here we check the tickets by user name 
       */
      if (!tickets.length) {
        tickets = await Tickets.find({}).sort({ _id: -1 }).populate(
          [
            {
              path: "users",
              match: {name: {$regex: req.query.q, $options: 'i'}}
            },
            {
              path: "products"
            }
          ]
        );
        tickets = tickets.filter(e => e.users != null && e.products != null)
        check2 = tickets.length? false : true
      }

      /**
       * This block is after getting no ticket by user name
       * Here we check the tickets by product name 
       */
      if (check2) {
        tickets = await Tickets.find({}).sort({ _id: -1 }).populate(
          [
            {
              path: "users"
            },
            {
              path: "products",
              match: {name: {$regex: req.query.q, $options: 'i'}}
            }
          ]
        );
        tickets = tickets.filter(e => e.users != null && e.products != null)
        check2 = tickets.length? false : true
      }

      res.status(200).send({
        error: false,
        message: "Searched tickets",
        data: tickets
      });
    } else if (req.query.from && req.query.to) {
      console.log(req.query.from, req.query.to);
      const tickets = await Tickets.find({createdAt: { $gte: req.query.from, $lte: req.query.to }}).populate(
        "users products executive address"
      );
      res.status(200).send({
        error: false,
        message: "All tickets",
        data: tickets.filter(e => e.users != null && e.products != null)
      });
    } else {
      const tickets = await Tickets.find({}).populate(
        "users products executive address"
      );
      res.status(200).send({
        error: false,
        message: "All tickets",
        data: tickets.filter(e => e.users != null && e.products != null)
      });
    }
  } catch (error) {
    res.status(200).send({
      error: true,
      message: "Bad request"
    });
  }
});

ticketRouter.post("/list-by-status", async (req, res) => {
  if (req.body.status) {
    const query = { status: req.body.status };
    const tickets = await Tickets.find(query).sort({ createdAt: -1 }).populate(
      "users products executive address"
    );
    res.send(tickets);
  } else {
    res.status(403).send({
      error: "status is required",
    });
  }
});

ticketRouter.get("/get-by-unique-id/:uniqueId", async (req, res) => {
  try {
    const ticket = await Tickets.findOne({
      uniqueId: req.params.uniqueId,
    }).populate("users products executive address");
    if (ticket) {
      res.status(200).send(ticket);
    } else {
      res.status(404).send({
        error: "Ticket doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Ticket doesn't exist!" });
  }
});

ticketRouter.post("/get-by-unique-id", async (req, res) => {
  try {
    const ticket = await Tickets.findOne({
      uniqueId: req.body.ticketId,
    }).populate("users products executive address");
    if (ticket) {
      res.status(200).send(ticket);
    } else {
      res.status(200).send({
        status: "Ticket doesn't exist!",
      });
    }
  } catch {
    res.status(200);
    res.send({ status: "Ticket doesn't exist!" });
  }
});

ticketRouter.post("/add", async (req, res) => {
  try {
    // return res.status(200).send(await randomTicketNumber())
    if (
      req.body.issueType &&
      req.body.functionType &&
      req.body.selectedDate &&
      req.body.userId &&
      req.body.productId &&
      req.body.category &&
      req.body.brandId
    ) {
       // check if email exists
       const userCheck = await Users.findOne({ _id: req.body.userId }).populate("subscription");
       const productDetail = await Products.findOne({ _id: req.body.productId });
      
       if(isNaN (userCheck.remainingTicketCount) === true || userCheck.remainingTicketCount > 0 )
       {
        let newTicket = new Tickets();
        const sDate = new Date();
  
        // Initialize newTicket object with request data
        (newTicket.issueType = req.body.issueType),
          (newTicket.functionType = req.body.functionType),
          (newTicket.transportationType = req.body.transportationType),
          (newTicket.selectedDate = req.body.selectedDate),
          (newTicket.selectedTime = req.body.selectedTime),
          (newTicket.srn = req.body.srn),
          (newTicket.products = mongoose.Types.ObjectId(req.body.productId)),
          (newTicket.category = req.body.category),
          (newTicket.brand = req.body.brandId),
          (newTicket.description = req.body.description),
          (newTicket.multipleAddress = req.body.multipleAddress),
          (newTicket.uniqueId = await randomTicketNumber()),
          (newTicket.createdAt = new Date(
            sDate.getFullYear(),
            sDate.getMonth(),
            sDate.getDate(),
            sDate.getHours(),
            sDate.getMinutes(),
            sDate.getSeconds(),
            sDate.getMilliseconds()
          )),
          (newTicket.users = mongoose.Types.ObjectId(req.body.userId));
        if (req.body.addressId) {
          newTicket.address = mongoose.Types.ObjectId(req.body.addressId);
        }
  
        // Save newTicket object to database
        newTicket.save(async (err, data) => {
          if (err) {
            return res.status(400).send({
              message: "Failed to add ticket.",
            });
          } else {

            if (userCheck) {
              
              if(isNaN(userCheck.ticketAddedCount))
              {
                userCheck.ticketAddedCount = 1;
              }
              else{
                userCheck.ticketAddedCount = userCheck.ticketAddedCount + 1;
              }
              if(isNaN(userCheck.remainingTicketCount)) {
                userCheck.remainingTicketCount = userCheck.subscription.ticketCount - userCheck.ticketAddedCount;
                const userTicketData = await UserTickets.findOneAndUpdate(
                  {user: mongoose.Types.ObjectId(req.body.userId)},
                  {
                    $inc: { usedTicket: userCheck.ticketAddedCount, remainingTicket: -userCheck.ticketAddedCount }
                  }, 
                  {new: true}
                );

              } else {
                userCheck.remainingTicketCount = userCheck.remainingTicketCount - 1;
                const userTicketData = await UserTickets.findOneAndUpdate(
                  {user: mongoose.Types.ObjectId(req.body.userId)},
                  {
                    $inc: { usedTicket: 1, remainingTicket: -1 }
                  }, 
                  {new: true}
                );
              }

              delete userCheck._id;

              await Users.findOneAndUpdate({_id: req.body.userId }, userCheck,{upsert: true});
            }

            if (userCheck.email) {
              var options2 = { method: 'POST',
              url: mailSendingApi,
              headers: 
              { 'postman-token': 'ada6d640-aeee-2368-ef03-510f8ba1a51d',
                'cache-control': 'no-cache',
                'content-type': 'application/json' },
              body: 
              { email: [ userCheck.email ],
                subject: `wevouch SRT number ${data.uniqueId}`,
                text: 'Dear '+userCheck.name+' Thank you for choosing WeVouch! We have successfully registered your request and the ticket no. for the same is '+data.uniqueId+'.',
                html: 'Dear '+userCheck.name+',<p>Thank you for choosing wevouch! We have successfully registered your request and the ticket no. for the same is '+data.uniqueId+'. We will get in touch with the brand & register your problem within 4 working hours. The ticket number is valid for future communication till the time your request is resolved.</p><p>Feel free to contact our team at support@wevouch.in or reach out to our virtual assistant WeVo on the wevouch app for any further assistance.</p><p>Team wevouch</p>' },
              json: true };

              request(options2, function (error, response, body) {
                if (error) throw new Error(error);

                console.log(body);
              });

              // send sms notification
              var options1 = { method: 'POST',
                url: 'https://api.kaleyra.io/v1/HXIN1715939006IN/messages',
                headers: {
                  'api-key': 'A2f66c3daa74e66ffa590cebe1906b582',
                  'content-type': 'application/x-www-form-urlencoded' 
                },
                form: { 
                  to: '+91'+userCheck.mobile,
                  type: 'TXN',
                  sender: 'Wvouch',
                  body: `Your SRT no. ${data.uniqueId} with wevouch has been raised. We will register your problem with the brand within 4 working hours.`,
                  template_id: '1707166841101098850' 
                } 
              };
  
              request(options1, function (error, response, body) {
                // if (error) throw new Error(error);
                console.log(body);
              });
            }

            // Send user Notification
            const userNotification = await sendNotification({userId: req.body.userId, title: 'New Ticket', desc: `Dear ${userCheck.name}, we are getting in touch with ${productDetail.brands} to register your complaint for your ${productDetail.category}. Your wevouch SRT number is ${data.uniqueId}` });

            //send whatsapp notification
            var options3 = {
              'method': 'POST',
              'url': 'https://api.kaleyra.io/v1/HXIN1715939006IN/messages',
              'headers': {
                'api-key': 'A2f66c3daa74e66ffa590cebe1906b582',
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              form: {
                'from': '918240052950',
                'to': `91${userCheck.mobile}`,
                'type': 'template',
                'channel': 'whatsapp',
                'template_name': 'add_ticket_1',
                'params': `"${userCheck.name}","${data.uniqueId}"`,
                'lang_code': 'en'
              }
            };
            request(options3, function (error, response) {
              // if (error) throw new Error(error);
              console.log(response.body);
            });

            return res.status(200).send({
              message: "Ticket added successfully.",
              ticket: data,
            });
          }
        });
       }
       else
       {
        res.status(403).send({
          message:
            "Maximum no of tickets reached.",
        });
       }
      
    } else {
      res.status(403).send({
        message:
          "Prodcut Id,Selected Time, Selected Date, Address, Function Type, Issue Type, User Id, Brand Id and Title are required.",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

ticketRouter.post("/assign-executive", async (req, res) => {
  try {
    
    /**
     * Changes made on 16-02-2023
     * To assign tickets to executive in round-robin format
     */
    const supportExecutiveData = await SupportExecutive.find({status: 'active'}).sort({"ticketCount" : 1});
    const assignableExecutive = supportExecutiveData[0];
    
    if (assignableExecutive._id && req.body.ticketId) {
      const ticket = await Tickets.findOne({ _id: req.body.ticketId }).populate("products");
      if (ticket) {
        if (assignableExecutive._id) {
          ticket.executive = mongoose.Types.ObjectId(assignableExecutive._id);
          const executiveTicketCount = await SupportExecutive.findOneAndUpdate({_id: assignableExecutive._id}, { $inc: {ticketCount: 1} })
        }


        await ticket.save();
        const sDate = new Date();
        
        // Send user Notification
        const userNotification = await sendNotification({userId: ticket.users, title: 'Executive assigned to ticket', desc: 'Execuive assigned to ticket '+ticket.uniqueId });

        // Initialize new Notification object with request data for executive
        let newSrvcNotification = new ServiceExecutiveNotifications();
        
        (newSrvcNotification.title = "New ticket assigned"),
          (newSrvcNotification.description = "New ticket assigned"),
          (newSrvcNotification.createdDate = new Date(
            sDate.getFullYear(),
            sDate.getMonth(),
            sDate.getDate(),
            sDate.getHours(),
            sDate.getMinutes(),
            sDate.getSeconds(),
            sDate.getMilliseconds()
          )),
          (newSrvcNotification.uniqueId =
            "srvc_noti_" +
            randomString(
              6,
              "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
            )),
          (newSrvcNotification.supportExecutive = mongoose.Types.ObjectId(
            assignableExecutive._id
          ));
        newSrvcNotification.save();
        res.status(200).send(ticket);
      } else {
        res.status(404).send({
          error: "Ticket doesn't exist!",
        });
      }
    } else {
      res.status(403).send({
        message: "Executive Id and Ticket Id are required.",
      });
    }
    // res.send(assignableExecutive)
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

ticketRouter.post("/list-by-executive", async (req, res) => {
  try {
    if (req.body.executiveId && req.body.status) {
      const query = {
        status: req.body.status,
        executive: mongoose.Types.ObjectId(req.body.executiveId),
      };
      const tickets = await Tickets.find(query).sort({ createdAt: -1 }).populate(
        "users products executive address"
      );
      res.status(200).send(tickets);
    } else {
      res.status(403).send({
        message: "Executive Id and Ticket Status are required.",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

ticketRouter.post("/get-by-category", async (req, res) => {
  try {
    if (req.body.categoryId) {
      const query = {
        category: mongoose.Types.ObjectId(req.body.categoryId),
      };
      const tickets = await Tickets.find(query).populate(
        "users products executive address"
      );
      res.status(200).send(tickets);
    } else {
      res.status(403).send({
        message: "Category Id is  required.",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

ticketRouter.post("/get-by-category-user", async (req, res) => {
  try {
    if (req.body.categoryId && req.body.userId) {
      const query = {
        category: mongoose.Types.ObjectId(req.body.categoryId),
        users: mongoose.Types.ObjectId(req.body.userId),
      };
      const tickets = await Tickets.find(query).populate(
        "users products executive address"
      );
      res.status(200).send(tickets);
    } else {
      res.status(403).send({
        message: "Category Id and User Id are  required.",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

ticketRouter.patch("/update-status/:id", async (req, res) => {
  try {
    const ticket = await Tickets.findOne({ _id: req.params.id }).populate("users");
    if (ticket) {
      if (req.body.status) {
        ticket.status = req.body.status;
      }

      if (req.body.status === 'completed' && ticket.users.email) {
        var options2 = 
        { 
          method: 'POST',
          url: mailSendingApi,
          headers: 
          { 'postman-token': 'ada6d640-aeee-2368-ef03-510f8ba1a51d',
            'cache-control': 'no-cache',
            'content-type': 'application/json' },
          body: 
          { 
            email: [ ticket.users.email ],
            subject: `wevouch SRT number ${ticket.uniqueId}`,
            text: 'Dear '+ticket.users.name+',<p>Thank you for using wevouch.',
            html: 'Dear '+ticket.users.name+',<p>Thank you for using wevouch. Your service request has been successfully attended. We are closing your ticket no. '+ticket.uniqueId+'</p><p>Feel free to contact our team at support@wevouch.in or reach out to our virtual assistant WeVo on the wevouch app for any further assistance.<p/>Team wevouch' 
          },
          json: true 
        };
        request(options2, function (error, response, body) {
          // if (error) throw new Error(error);
          console.log(body);
        });

        //send sms notification
        var options1 = { method: 'POST',
          url: 'https://api.kaleyra.io/v1/HXIN1715939006IN/messages',
          headers: {
            'api-key': 'A2f66c3daa74e66ffa590cebe1906b582',
            'content-type': 'application/x-www-form-urlencoded' 
          },
          form: { 
            to: '+91'+ticket.users.mobile,
            type: 'TXN',
            sender: 'Wvouch',
            body: `We have successfully closed your wevouch SRT number ${ticket.uniqueId}. Thank you for trusting wevouch!`,
            template_id: '1707166867726565448' 
          } 
        };

        request(options1, function (error, response, body) {
          // if (error) throw new Error(error);
          console.log(body);
        });

        //send whatsapp notification
        var options3 = {
          'method': 'POST',
          'url': 'https://api.kaleyra.io/v1/HXIN1715939006IN/messages',
          'headers': {
            'api-key': 'A2f66c3daa74e66ffa590cebe1906b582',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          form: {
            'from': '918240052950',
            'to': `91${ticket.users.mobile}`,
            'type': 'template',
            'channel': 'whatsapp',
            'template_name': 'close_ticket_1',
            'params': `"${ticket.users.name}","${ticket.uniqueId}"`,
            'lang_code': 'en'
          }
        };
        request(options3, function (error, response) {
          // if (error) throw new Error(error);
          console.log(response.body);
        });
        
        //in app notification
        const userNotification = await sendNotification({userId: ticket.users?._id, title: 'Close Ticket', desc: `Thank you for your feedback! Your wevouch SRT number ${ticket.uniqueId} has been successfully closed.` });
      }

      await ticket.save();
      res.status(200).send(ticket);
    } else {
      res.status(404).send({
        error: "Ticket doesn't exist!",
      });
    }
  } catch(err) {
    res.status(404);
    res.send({ error: "Ticket doesn't exist!", message: String(err) });
  }
});

//dt. 04-06-2022
ticketRouter.patch("/update-status-by-id/:id", async (req, res) => {
  try {
    const ticket = await Tickets.findOne({ _id: req.params.id }).populate("users");
    if (ticket) {
      if (req.body.status) {
        ticket.status = req.body.status;
      }

      if (req.body.status === 'completed' && ticket.users.email) {
        var options2 = 
        { 
          method: 'POST',
          url: mailSendingApi,
          headers: 
          { 'postman-token': 'ada6d640-aeee-2368-ef03-510f8ba1a51d',
            'cache-control': 'no-cache',
            'content-type': 'application/json' },
          body: 
          { 
            email: [ ticket.users.email ],
            subject: 'Wevouch Ticket Has been Closed',
            text: 'Dear '+ticket.users.name+',<p>Thank you for using wevouch.',
            html: 'Dear '+ticket.users.name+',<p>Thank you for using wevouch. Your service request has been successfully attended. We are closing your ticket no. '+ticket.uniqueId+'</p><p>Kindly share your valuable feedback as it will help us to serve you better.<p/><p>Feel free to contact our team at support@wevouch.in or reach out to our virtual assistant WeVo on the wevouch app for any further assistance.<p/>Team wevouch' 
          },
          json: true 
        };

        request(options2, function (error, response, body) {
          if (error) throw new Error(error);

          console.log(body);
        });

        //send whatsapp notification
        const whatsappNotification = sendWhatsappNotification({
          template: "close_ticketsss",
          to: ticket.users.mobile,
          payload: [
            {
              NUMBER: ticket.uniqueId
            }
          ]
        })
      }

      await ticket.save();
      res.status(200).send({
        error: false,
        message: "Status updated",
        data: ticket
      });
    } else {
      res.status(200).send({
        error: true,
        message: "Ticket doesn't exist!"
      });
    }
  } catch {
    res.status(400);
    res.send({ 
      error: true, 
      message: "operation failed" 
    });
  }
});

ticketRouter.get("/get/:id", async (req, res) => {
  try {
    const ticket = await Tickets.findOne({ _id: req.params.id }).populate(
      "users products executive address"
    );
    if (ticket) {
      res.status(200).send(ticket);
    } else {
      res.status(404).send({
        error: "Ticket doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Ticket doesn't exist!" });
  }
});

//dt. 04-06-2022
ticketRouter.get("/get-by-id/:id", async (req, res) => {
  try {
    const ticket = await Tickets.findOne({ _id: req.params.id }).populate(
      "users products executive address"
    );
    if (ticket) {
      res.status(200).send({
        error: false,
        message: "Ticket deatil",
        data: ticket
      });
    } else {
      res.status(200).send({
        error: true,
        message: "Ticket not found"
      });
    }
  } catch {
    res.status(400);
    res.send({ error: true, message: "operation failed"});
  }
});

ticketRouter.patch("/add-feedback/:id", async (req, res) => {
  try {
    const result = await Tickets.findOneAndUpdate({ _id: req.params.id }, {rating: req.body.rating, feedback: req.body.feedback, brandRating: req.body.brandRating, brandFeedback: req.body.brandFeedback}, {new: true}).populate("users");

    if (result) {
      var options2 = 
      { 
        method: 'POST',
        url: mailSendingApi,
        headers: 
        { 'postman-token': 'ada6d640-aeee-2368-ef03-510f8ba1a51d',
          'cache-control': 'no-cache',
          'content-type': 'application/json' },
        body: 
        { 
          email: [ result.users.email ],
          subject: 'We would love to hear from you',
          text: 'Dear '+result.users.name+', We would love to hear from you about our services.',
          html: 'Dear '+result.users.name+',<p>We would love to hear from you about our services.</p> <p>It will just take two minutes of your time.</p><p>Kindly add feedback to help us serve you better. Your feedback is valuable to us and helps us constantly learn and improve.</p><p>Feel free to contact our team at support@wevouch.in or reach out to our virtual assistant WeVo on the wevouch app for any further assistance.</p><p>Thanks,</p>Team wevouch' 
        },
        json: true 
      };

      request(options2, function (error, response, body) {
        if (error) throw new Error(error);

        console.log(body);
      });

      res.status(200).send({
        error: false,
        message: 'Feedback added',
        data: result
      });
    } else {
      res.status(200).send({
        error: true,
        message: "Feedback not added!",
      });
    }
  } catch {
    res.status(200);
    res.send({ 
      error: true,
      message: "Operation failed!" 
    });
  }
});

ticketRouter.get("/get-by-product/:id", async (req, res) => {
  try {
    const ticket = await Tickets.find({ products: req.params.id }).
    sort({ createdAt: -1 })
    .populate(
      "users products executive address"
    );
    if (ticket) {
      res.status(200).send(ticket);
    } else {
      res.status(404).send({
        error: "Ticket doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Ticket doesn't exist!" });
  }
});

ticketRouter.get("/get-by-user/:id", async (req, res) => {
  try {
    const ticketList = await Tickets.find({ users: req.params.id }).
    sort({ _id: -1 })
    .populate(
      "users products executive address"
    );
    res.status(200).send(ticketList);
  } catch {
    res.status(404);
    res.send({ error: "Ticket doesn't exist!" });
  }
});

//dt. 26-03-2022
ticketRouter.get("/get-by-user-id/:id", async (req, res) => {
  try {
    const ticketList = await Tickets.find({ users: req.params.id }).
    sort({ createdAt: -1 })
    .populate(
      "users products executive address"
    );
    res.status(200).send({
      error: false,
      message: 'Ticket list by user',
      data: ticketList
    });
  } catch {
    res.status(404);
    res.send({ error: true, message: "Ticket doesn't exist!" });
  }
});

ticketRouter.patch("/update-srn/:id", async (req, res) => {
  try {
    if (req.body.srn) {
      const ticket = await Tickets.findOneAndUpdate({ _id: req.params.id }, {srn: req.body.srn}, {new: true});

      if (ticket) {
        res.status(200).send(ticket);
      } else {
        res.status(404).send({
          error: "Ticket doesn't exist!",
        });
      }
    } else {
      res.status(403).send({
        message: "SRN is required.",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Ticket doesn't exist!" });
  }
});

ticketRouter.delete("/delete/:id", async (req, res) => {
  try {
    const ticket = await Tickets.findOne({ _id: req.params.id });
    if (ticket) {
      await Tickets.deleteOne({ _id: req.params.id });
      res.status(200).send();
    } else {
      res.status(404).send({
        error: "Ticket doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Ticket doesn't exist!" });
  }
});

module.exports = ticketRouter;
