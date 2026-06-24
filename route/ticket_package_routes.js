const express = require("express");
const TicketPackage = require("../models/ticket-package");
const UserTransactionLog = require("../models/user-transaction-log");
const TicketPackageRoute = express.Router();


TicketPackageRoute.post("/create", async (req, res) => {
	try {
        const TicketPackageData = new TicketPackage(req.body);
        const result = await TicketPackageData.save();
        message = {
            error: false,
            message: "TicketPackage Added Successfully!",
            data: result,
        };
        res.status(200).send(message);
	} catch (err) {
		message = {
			error: true,
			message: "Operation Failed!",
			data: err,
		};
		res.status(200).send(message);
	}
});

TicketPackageRoute.get("/detail/:TicketPackageId", async (req, res) => {
	try {
		const TicketPackageData = await TicketPackage.findOne({ _id: req.params.TicketPackageId });
		if (TicketPackageData.length != 0) {
			message = {
				error: false,
				message: "TicketPackage Data Found!",
				data: TicketPackageData,
			};
		} else {
			message = {
				error: true,
				message: "No Data Found!",
			};
		}
		res.status(200).send(message);
	} catch (err) {
		message = {
			error: true,
			message: "TicketPackage not found!",
			data: err,
		};
		res.status(200).send(message);
	}
});

TicketPackageRoute.patch("/update/:TicketPackageId", async (req, res) => {
	try {
		const result = await TicketPackage.findOneAndUpdate({ _id: req.params.TicketPackageId }, req.body, {new: true});
		message = {
			error: false,
			message: "TicketPackage Updated Successfully!",
			data: result
		};
		res.status(200).send(message);
	} catch (err) {
		message = {
			error: true,
			message: "Operation Failed!",
			data: err,
		};
		res.status(200).send(message);
	}
});

// TicketPackageRoute.delete("/delete/:TicketPackageId", async (req, res) => {
// 	try {
// 		const result = await TicketPackage.deleteOne({ _id: req.params.TicketPackageId });
// 		if (result.deletedCount == 1) {
// 			message = {
// 				error: false,
// 				message: "TicketPackage deleted successfully!",
// 			};
// 			res.status(200).send(message);
// 		} else {
// 			message = {
// 				error: true,
// 				message: "Operation failed!",
// 			};
// 			res.status(200).send(message);
// 		}
// 	} catch (err) {
// 		message = {
// 			error: true,
// 			message: "Operation Failed!",
// 			data: err,
// 		};
// 		res.status(200).send(message);
// 	}
// });

TicketPackageRoute.get("/list", async (req, res) => {
	try {
		const TicketPackageData = await TicketPackage.find({status: true});
		if (TicketPackageData.length != 0) {
			message = {
				error: false,
				message: "TicketPackage Data Found!",
				data: TicketPackageData,
			};
		} else {
			message = {
				error: true,
				message: "No ticket packages found!",
			};
		}
		res.status(200).send(message);
	} catch (err) {
		message = {
			error: true,
			message: "Failed",
			data: err,
		};
		res.status(200).send(message);
	}
});

TicketPackageRoute.get("/transaction-list", async (req, res, next) => {
    try {
      const pageNumber = +req.query.page;
      const nPerPage = +req.query.count;
      if (!req.query.page || !req.query.count) return res.status(400).send({error: true, message: "Page number and count per page must required"})

      // let andQuery = [
      //   {"userData.0": {$exists: true}}
      // ]
      let andQuery = []
      
      if(req.query.mobile) {
        andQuery.push(
          {"userData.0.mobile": {$regex: req.query.mobile, $options: 'i'}}
        )
      } else if(req.query.email) {
        andQuery.push(
          {"userData.0.email": {$regex: req.query.email, $options: 'i'}}
        )
      } else if(req.query.name) {
        andQuery.push(
        //   {
        //     $or: [
        //       {"userData.0.fname": {$regex: req.query.name, $options: 'i'}},
        //       {"userData.0.lname": {$regex: req.query.name, $options: 'i'}}
        //     ]
        //   }
			{"userData.0.name": {$regex: req.query.name, $options: 'i'}}
        )
      } else if(req.query.date) {
        let lessThanDate = new Date(req.query.date)
        lessThanDate.setDate(lessThanDate.getDate()+1)
        console.log(new Date(req.query.date), lessThanDate);
        andQuery.push(
          {"createdAt": {$gte: new Date(req.query.date), $lt: lessThanDate}}
        )
      } else {
        andQuery = [{}]
      }

      let totalTransaction = await UserTransactionLog.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userData',
            pipeline: [
              { $project: { name: "$name", email: "$email", mobile: "$mobile", is_mobile_verified: "$is_mobile_verified" } },
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
      ]);
      let TicketPackagePurcahseData = await UserTransactionLog.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userData',
            pipeline: [
              { $project: { name: "$name", email: "$email", mobile: "$mobile", is_mobile_verified: "$is_mobile_verified" } },
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

      res.status(200).send({ 
        error: false,
        message: 'Ticket Package purchase list',
        data: TicketPackagePurcahseData,
        totalTransaction: totalTransaction.length? totalTransaction[0].total : 0,
        userPerpage: nPerPage,
      })
    } catch (error) {
      next(error)
    }
})

module.exports = TicketPackageRoute;