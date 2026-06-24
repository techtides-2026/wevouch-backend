const express = require("express");
const mongoose = require("mongoose");
const Tickets = require("../models/tickets");

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  service: "Gmail",
  secure: false,
  auth: {
    user: "developer.website91@gmail.com",
    pass: "N3wP@ss2020",
  },
  tls: {
    // do not fail on invalid certs
    rejectUnauthorized: false,
  },
});

const SupportExecutiveUsers = require("../models/support-executive-users");
const supportExecutiveRouter = express.Router();

function randomString(length, chars) {
  var result = "";
  for (var i = length; i > 0; --i)
    result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}
supportExecutiveRouter.get("/list", async (req, res) => {
  const users = await SupportExecutiveUsers.find().sort({"createdAt": -1});
  res.send(users);
});

supportExecutiveRouter.get("/new-list", async (req, res) => {
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
  const users = await SupportExecutiveUsers.find(query);
  res.send(users);
});

/**
 * This is current support executive list api
 */
supportExecutiveRouter.get("/current-list", async (req, res, next) => {
  try {
    const pageNumber = +req.query.page;
    const nPerPage = +req.query.count;
    if (!req.query.page || !req.query.count)
      return res
        .status(400)
        .send({
          error: true,
          message: "Page number and count per page must required",
        });

    let query = [
      {
        $or: [{ isDeleted: false }, { isDeleted: undefined }],
      },
    ];

    if (req.query.email) {
      query.push({ email: { $regex: req.query.email, $options: "i" } });
    }
    if (req.query.mobile) {
      query.push({ mobile: { $regex: req.query.mobile, $options: "i" } });
    }
    if (req.query.name) {
      // query.push({
      // 	$or: [
      // 		{ fname: { $regex: req.query.name, $options: "i" } },
      // 		{ lname: { $regex: req.query.name, $options: "i" } },
      // 	],
      // });
      query.push({ name: { $regex: req.query.name, $options: "i" } });
    }
    if (req.query.date) {
      let lessThanDate = new Date(req.query.date);
      lessThanDate.setDate(lessThanDate.getDate() + 1);

      console.log(new Date(req.query.date), lessThanDate);
      query.push({
        createdAt: {
          $gte: new Date(req.query.date),
          $lt: lessThanDate,
        },
      });
    }

    const SupportExecutiveCount = await SupportExecutiveUsers.countDocuments({
      $and: query,
    });
    const SupportExecutiveData = await SupportExecutiveUsers.find({ $and: query })
      .sort({ _id: -1 })
      .skip(pageNumber > 0 ? (pageNumber - 1) * nPerPage : 0)
      .limit(nPerPage);

    res.status(200).send({
      error: false,
      message: "Support executive list",
      data: SupportExecutiveData,
      dataPerpage: nPerPage,
      totalData: SupportExecutiveCount,
    });
  } catch (error) {
    next(error);
  }
})

supportExecutiveRouter.post("/add", async (req, res) => {
  try {
    const sDate = new Date();
    if ((req.body.email && req.body.password, req.body.name, req.body.mobile && req.body.employeeId, req.body.designation && req.body.reportingTo)) {
      const userPresent = await SupportExecutiveUsers.findOne({ email: req.body.email });
      if (userPresent) {
        return res.status(403).send({
          message: "An user with a similar email exists.",
        });
      }
      // Creating empty user object
      let newUser = new SupportExecutiveUsers();

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
        (newUser.reportingTo = req.body.reportingTo),
        (newUser.employeeId = req.body.employeeId),
        (newUser.designation = req.body.designation),
        (newUser.landMark = req.body.landMark),
        (newUser.uniqueId =
          "supp_" +
          randomString(
            6,
            "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
          )),
        (newUser.createdAt = new Date(
          sDate.getFullYear(),
          sDate.getMonth(),
          sDate.getDate(),
          1,
          0,
          0
        ));
      if(req.body.status)
      {
        newUser.status= req.body.status;
      }

      // Call setPassword function to hash password
      newUser.setPassword(req.body.password);

      // Save newUser object to database
      newUser.save((err, data) => {
        if (err) {
          return res.status(400).send({
            message: "Failed to add user.",
            err,
          });
        } else {
          return res.status(200).send({
            message: "User added successfully.",
            user:data,
          });
        }
      });
    } else {
      res.status(403).send({
        message: "Name, Email, Phone , Password , Designation, Employee Id and Reporting To are required.",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

supportExecutiveRouter.post("/change-password", (req, res) => {
  try {
    if (req.body.email && req.body.password && req.body.newPassword) {
      SupportExecutiveUsers.findOne({ email: req.body.email }, async (err, user) => {
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
supportExecutiveRouter.post("/login", (req, res) => {
  // Find user with requested email
  try {
    if (req.body.email && req.body.password) {
      SupportExecutiveUsers.findOne({ email: req.body.email }, (err, user) => {
        if (user === null) {
          return res.status(400).send({
            message: "User not found.",
          });
        } else {
          if (user.validPassword(req.body.password)) {
            if(user.status !=="inactive")
            {
              return res.status(200).send({
                message: "User Logged In",
                user,
              });
            }
            else
            {
              return res.status(403).send({
                message: "User is Inactive"
              });
            }
            
          } else {
            return res.status(400).send({
              message: "Wrong Password",
            });
          }
        }
      });
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



supportExecutiveRouter.get("/get/:id", async (req, res) => {
  try {
    const user = await SupportExecutiveUsers.findOne({ _id: req.params.id });
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

supportExecutiveRouter.get("/detail/:id", async (req, res) => {
  try {
    const user = await SupportExecutiveUsers.findOne({ _id: req.params.id });
    if (user) {
      message = {
				error: false,
				message: "Support executive Data Found!",
				data: user,
			};
      res.status(200).send(message);
    } else {
      res.status(404).send({
        error: true,
        message: "User doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: true, message: "User doesn't exist!" });
  }
});

supportExecutiveRouter.get("/all-detail/:supprotExecId", async (req, res, next) => {
  try {
      const SupportExecData = await SupportExecutiveUsers.findOne({ _id: req.params.supprotExecId });

      const pageNumber = +req.query.page;
      const nPerPage = +req.query.count;
      let andQuery = [
        {"executive": {$eq: mongoose.Types.ObjectId(req.params.supprotExecId)}},
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
      if(req.query.date) {
        let lessThanDate = new Date(req.query.date)
        lessThanDate.setDate(lessThanDate.getDate()+1)
        console.log(new Date(req.query.date), lessThanDate);
        andQuery.push(
          {"createdAt": {$gte: new Date(req.query.date), $lt: lessThanDate}}
        )
      }

      /**
       * For current usage
       */
      console.log("andQuery >>>>>>>>> ", andQuery);
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

      console.log("totalTicket >>>>>>>>> ",totalTicket);
      message = {
        error: false,
        message: "Support executive Data Found!",
        data: SupportExecData,
        ticketData, 
        totalTicket: totalTicket.length ? totalTicket[0].total : 0,
        dataPerpage: nPerPage,
      };
      res.status(200).send(message);
  } catch (err) {
      next(err);
  }
})


supportExecutiveRouter.patch("/update/:id", async (req, res) => {
  try {
    let user = await SupportExecutiveUsers.findOne({ _id: req.params.id });
    if (user) {
      const name = req.body.name || user.name;
      user = req.body;
      user.name = name;
      const filter = { _id: req.params.id };
      if (user.name) {
        delete user.password;
        delete user.email;
        delete user.salt;
        delete user.hash;
       
        const newUser = await SupportExecutiveUsers.findOneAndUpdate(filter, user, {
          new: true,
        });

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

supportExecutiveRouter.patch("/toggle-user-status/:id", async (req, res) => {
  try {
    if(req.body.status)
    {
      let user = await SupportExecutiveUsers.findOne({ _id: req.params.id });
      if (user) {
        const newUser = new SupportExecutiveUsers();
        newUser._id = user._id;
        newUser.status= req.body.status;
        const filter = { _id: req.params.id };
        const updatedUser = await SupportExecutiveUsers.findOneAndUpdate(filter, newUser, {
          new: true,
        });
  
        res.status(200).send(updatedUser);
      } else {
        res.status(404).send({
          error: "User doesn't exist!",
        });
      }
    }
    else
    {
      res.status(403).send({message:"Status is required"});
    }
   
  } catch (error) {
    res.status(500);
    res.send({ error: error });
  }
});

supportExecutiveRouter.delete("/delete/:id", async (req, res) => {
  try {
    const user = await SupportExecutiveUsers.findOne({ _id: req.params.id });
    if (user) {
      await SupportExecutiveUsers.deleteOne({ _id: req.params.id });
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

supportExecutiveRouter.post("/forgot-password", async (req, res) => {
  try {
    if (req.body.email) {
      // check if email exists
      const user = await SupportExecutiveUsers.findOne({ email: req.body.email });
      if (user) {
        const generateOtp = Math.floor(100000 + Math.random() * 900000);
        const mailOptions = {
          from: "developer.website91@gmail.com", // sender address
          to: req.body.email, // list of receivers
          subject: "VeWouch -Forgot Password",
          text: "Please find your secret OTP",
          html: `<p>Your otp for forget password is ${generateOtp}</p>`,
        };
        user.generatedOtp = generateOtp;
        await SupportExecutiveUsers.findOneAndUpdate({ _id: user._id }, user, {
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

supportExecutiveRouter.post("/set-new-password", async (req, res) => {
  try {
    if (req.body.email && req.body.otp && req.body.password) {
      // check if email exists
      const user = await SupportExecutiveUsers.findOne({ email: req.body.email });
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

supportExecutiveRouter.get("/all-assign-status-false", async (req, res) => {
  try {
    let user = await SupportExecutiveUsers.updateMany({ assigned: true }, { assigned: false });
    res.status(200).send({
      message: "Ticket assign status changed successfully"
    });
   
  } catch (error) {
    res.status(500);
    res.send({ error: error });
  }
});

supportExecutiveRouter.patch("/change-assign-status/:supportExecId", async (req, res) => {
  try {
    let user = await SupportExecutiveUsers.updateOne({ _id: req.params.supportExecId }, { assigned: req.body.assigned });
    res.status(200).send({
      message: "Ticket assign status changed successfully"
    });
   
  } catch (error) {
    res.status(500);
    res.send({ error: error });
  }
});

module.exports = supportExecutiveRouter;
