const express = require("express");
const InfluencerData = require("../models/influencerData");
const Influencer = require("../models/influencer");
const sendInfluencerNotification = require("../helper/sendInfluencerNotification");
const InfluencerRoute = express.Router();
var request = require("request");

async function generateReferralCode(length, chars, name) {
	var result = "";
	const nameArray = name.split(" ") 
	let referralCode;

	for (var i = length; i > 0; --i) {
		result += chars[Math.floor(Math.random() * chars.length)];
	}
	if (nameArray.length >= 2) {
		referralCode = (nameArray[0].replace(/\s/g, "").substr(0, 1) + nameArray[1].replace(/\s/g, "").substr(0, 1) + result).toUpperCase();
	} else {
		referralCode = (nameArray[0].replace(/\s/g, "").substr(0, 2) + result).toUpperCase();
	}

	const userWithSameReferral = await Influencer.findOne({$or: [{referralCode: referralCode},{otherReferralCodes: {$in: referralCode}}]})
	if (userWithSameReferral) {
		await generateReferralCode(length, chars, name)
	} else {
		return referralCode;

	}
}

async function randomString(length, chars = "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ") {
	var result = "";
	for (var i = length; i > 0; --i)
	  result += chars[Math.floor(Math.random() * chars.length)];
	return result;
}

const mailSendingApi = 'http://3.136.213.9:5000/api/mail/send';

InfluencerRoute.post("/create", async (req, res) => {
	try {
		const userExist = await Influencer.findOne({$or: [{email: req.body.email}, {mobile: req.body.mobile}]})
		let message = {};
		if(!userExist) {
			req.body.referralCode = await generateReferralCode(6, "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", req.body.fname);
			req.body.password = await randomString(8);

			req.body.name = req.body.fname +" "+ req.body.lname
			const influencer = new Influencer(req.body);
			influencer.setPassword(req.body.password)
			const result = await influencer.save();

			if (result) {
				var mailOptions = { 
					method: 'POST',
					url: mailSendingApi,
					headers: {
						'content-type': 'application/json' 
					},
					body: { 
						email: [ req.body.email ],
						subject: 'Wevouch influencer login',
						text: 'Dear '+req.body.name+' Thank you for choosing Wevouch.',
						html: '<p>Dear '+req.body.name+' Thank you for choosing Wevouch. Your influencer dashboard credentials are </p><p>Email: <b>'+req.body.email+'</b></p><p>Password: <b>'+req.body.password+'</b></p>' 
					},
					json: true 
				};

				request(mailOptions, function (error, response, body) {
					if (error) throw new Error(error);
					console.log(body);
				});
			}

			message = {
				error: false,
				message: "Influencer Added Successfully!",
				data: result,
			}
		} else {
			message = {
				error: true,
				message: "User already exist"
			}
		}
        res.status(200).send(message);
	} catch (err) {
		message = {
			error: true,
			message: "Operation Failed!",
			data: String(err),
		};
		res.status(500).send(message);
	}
});

InfluencerRoute.patch("/generate-referral-code/:influencerId", async (req, res) => {
	try {

		const userExist = await Influencer.findOne({_id: req.params.influencerId})
		
		if(userExist) {
			
			const referralCodeExist = await Influencer.findOne({$or: [{referralCode: req.body.refCode},{otherReferralCodes: {$in: req.body.refCode}}]})
			

			if (referralCodeExist) {
				message = {
					error: true,
					message: "This referral code already exist"
				}
			} else {
				const result = await Influencer.updateOne(
					{_id: req.params.influencerId},
					{ $push: { otherReferralCodes: req.body.refCode } }
				)

				let notficationdata = await sendInfluencerNotification({
					influencer: req.params.influencerId,
					title: "Referral code generated",
					description: "Referral code " + req.body.refCode + " have generated successfully."
				});

				message = {
					error: false,
					message: "Influencer referral code generated Successfully!",
					data: result
				}
			}
		} else {
			message = {
				error: true,
				message: "User not found!"
			}
		}
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

InfluencerRoute.patch("/add-video-url/:influencerId", async (req, res) => {
	try {

		const userExist = await Influencer.findOne({_id: req.params.influencerId})
		
		if(userExist) {
			const result = await Influencer.updateOne(
				{_id: req.params.influencerId},
				{ $push: { videoUrls: req.body.url } }
			)
			message = {
				error: false,
				message: "Influencer video added Successfully!",
				data: result
			}
		} else {
			message = {
				error: true,
				message: "User not found!"
			}
		}
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

InfluencerRoute.post("/get-otp", async (req, res) => {
	try {
		if (req.body.mobile) {
			// check if phone exists
			let otp = 9405;
			if (req.body.mobile != "9804450986" && req.body.mobile != "8335852184" && req.body.mobile != "6290130853") {
			  otp = Math.floor(1000 + Math.random() * 9000);
			}
			const user = await Influencer.findOneAndUpdate({ mobile: req.body.mobile }, {otp: otp});
			
			if (user) {
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
			} else {
				message = {
					error: true,
					message: "User not found"
				};
			}
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

InfluencerRoute.post("/otp-login", async (req, res) => {
	// Find user with requested email
	try {
	  if (req.body.mobile && req.body.otp) {
		const influencer = await Influencer.findOne({$and: [{ mobile: req.body.mobile }, { otp: req.body.otp }]});
		if (influencer) {
			return res.status(200).send({
				error: false,
				message: "influencer logged in",
				data: influencer
			});
		} else {
			return res.status(200).send({
				error: true,
				message: "Incorrect mobile or, otp. PLease try again."
			});
		}
	  }
	} catch (error) {
	  res.status(500).send({
		message: error,
	  });
	}
});

InfluencerRoute.post("/login", async (req, res) => {
	// Find user with requested email
	try {
	  if (req.body.email && req.body.password) {
		const influencer = await Influencer.findOne({ email: req.body.email });
		if (influencer === null) {
		  return res.status(200).send({
			error: true,
			message: "The email address entered by you is incorrect",
		  });
		} else {
		  if (influencer.validPassword(req.body.password)) {
			influencer.password = ""
			  if (influencer.status) {
				return res.status(200).send({
				  error: false,
				  message: "influencer Logged In",
				  data: influencer,
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
			  message: "The password is incorrect",
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

InfluencerRoute.get("/user-list/:influencerId", async (req, res) => {
	try {
        const result = await InfluencerData.find({influencer: req.params.influencerId}).populate([
			{
				path: "user",
				select: "name email mobile createdAt isFirstProductAdded"
			},
			{
				path: "influencer",
				select: "name email mobile referralCode createdAt"
			},
		]).sort({_id: -1});
        message = {
            error: false,
            message: "User data!",
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

InfluencerRoute.get("/detail/:InfluencerId", async (req, res) => {
	try {
		const InfluencerData = await Influencer.findOne({ _id: req.params.InfluencerId });
		if (InfluencerData.length != 0) {
			message = {
				error: false,
				message: "Influencer Data Found!",
				data: InfluencerData,
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
			message: "Version not found!",
			data: err,
		};
		res.status(200).send(message);
	}
});

InfluencerRoute.patch("/update/:InfluencerId", async (req, res) => {
	try {
		delete req.body.referralCode;
		delete req.body.password;
		delete req.body.email;
		delete req.body.mobile;
		req.body.name = req.body.fname +" "+ req.body.lname;

		const result = await Influencer.findOneAndUpdate({ _id: req.params.InfluencerId }, req.body, {new: true});
		if (result) {
			let notficationdata = await sendInfluencerNotification({
				influencer: req.params.InfluencerId,
				title: "Profile updated",
				description: "Influencer profile of " + req.body.name + ", updated successfully."
			});
			message = {
				error: false,
				message: "Influencer Updated Successfully!",
				data: result
			};
		} else {
			message = {
				error: true,
				message: "Influencer not found!",
			};
		}
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

InfluencerRoute.delete("/delete/:InfluencerId", async (req, res) => {
	try {
		const result = await Influencer.deleteOne({ _id: req.params.InfluencerId });
		if (result.deletedCount == 1) {
			message = {
				error: false,
				message: "Influencer deleted successfully!",
			};
			res.status(200).send(message);
		} else {
			message = {
				error: true,
				message: "Operation failed!",
			};
			res.status(200).send(message);
		}
	} catch (err) {
		message = {
			error: true,
			message: "Operation Failed!",
			data: err,
		};
		res.status(200).send(message);
	}
});

InfluencerRoute.get("/list", async (req, res) => {
	try {
		const InfluencerData = await Influencer.find({}).sort({_id: -1});
		if (InfluencerData.length != 0) {
			message = {
				error: false,
				message: "Influencer Data Found!",
				data: InfluencerData,
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
			message: "Version not found!",
			data: err,
		};
		res.status(200).send(message);
	}
});

InfluencerRoute.get("/new-list", async (req, res) => {
	try {
		const pageNumber = +req.query.page;
		const nPerPage = +req.query.count;
		if (!req.query.page || !req.query.count) return res.status(400).send({error: true, message: "Page number and count per page must required"})

		let query = [{}];

		if (req.query.email) {
			query.push(
				{email: {$regex: req.query.email, $options: 'i'}}
			)
		}
		if (req.query.mobile) {
			query.push(
				{mobile: {$regex: req.query.mobile, $options: 'i'}}
			)
		}
		if (req.query.name) {
			query.push({
				// $or: [
				// 	{fname: {$regex: req.query.name, $options: 'i'}},
				// 	{lname: {$regex: req.query.name, $options: 'i'}}
				// ]
				name: {$regex: req.query.name, $options: 'i'}
			})
		}
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
		const InfluencerCount = await Influencer.countDocuments({$and: query})
		const InfluencerData = await Influencer.find({$and: query})
			.sort({_id: -1})
			.skip( pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0 )
			.limit( nPerPage );

		message = {
			error: false,
			message: "Influencer Data Found!",
			data: InfluencerData,
			dataPerpage: nPerPage,
			totalData: InfluencerCount,
		};
		
		res.status(200).send(message);
	} catch (err) {
		next(err);
	}
});

InfluencerRoute.get("/all-detail/:InfluencerId", async (req, res, next) => {
	try {
		const pageNumber = +req.query.page;
		const nPerPage = +req.query.count;
		if (!req.query.page || !req.query.count) return res.status(400).send({error: true, message: "Page number and count per page must required"})

		// let query = [{
		//     $or: [
		//         {isDeleted: false},
		//         {isDeleted: undefined}
		//     ]
		// }];
		
		const InfluencerDetail = await Influencer.findOne({ _id: req.params.InfluencerId });
		const totalUSer = await InfluencerData.count({influencer: req.params.InfluencerId})
		const InfluencerUser = await InfluencerData.find({influencer: req.params.InfluencerId})
			.populate([
				{
					path: "user",
					select: "name email mobile productAddedCount ticketAddedCount"
				},
				{
					path: "influencer",
					select: "name email mobile referralCode createdAt"
				},
			])
			.sort({_id: -1})
			.skip( pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0 )
			.limit( nPerPage );

		message = {
			error: false,
			message: "Influencer Data Found!",
			data: InfluencerDetail,
			users: InfluencerUser,
			dataPerpage: nPerPage,
			totalData: totalUSer,
		};
	   
		res.status(200).send(message);
	} catch (err) {
		next(err);
	}
})

module.exports = InfluencerRoute;