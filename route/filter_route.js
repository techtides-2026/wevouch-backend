const express = require("express");
const Users = require("../models/users");
const Products = require("../models/products");
const Tickets = require("../models/tickets");

const filtersRoute = express.Router();

filtersRoute.get('/user-filter', async(req, res, next) => {
    try {
        /**
         * Users
         */
        let allUsers = await Users.find({email: {$ne: "admin@wevouch.app"}}).select("name email mobile")
        let allUserIds = allUsers.map( e => {return String(e._id)})

        let allProfileUpdateUserIds = [];
        allUsers.map( e => { if(e.name && e.email && e.mobile) allProfileUpdateUserIds.push(String(e._id))} )

        
        /**
         * Products
         */
        let allProductUsers = await Products.find({}).select("users").populate([
            {
                path: "users",
                select: "name email mobile"
            }
        ]);
        let allProductUserIds = [];
        allProductUsers.map( e => { if(e.users != 'null' && e.users?._id != undefined && !allProductUserIds.includes(String(e.users?._id))) allProductUserIds.push(String(e.users?._id))} )
        
        // return res.status(200).send({allProductUserIds, length: allProductUserIds.length})

        /**
         * Tickets
         */
        let allTicketUsers = await Tickets.find({}).select("users products").populate([
            {
                path: "users",
                select: "name email mobile"
            },
            {
                path: "products",
                select: "name"
            }
        ]);
        let allTicketUserIds = [];
        allTicketUsers.map( e => { if(String(e.products)!= 'null' && String(e.users)!= 'null' && !allTicketUserIds.includes(String(e.users?._id))) allTicketUserIds.push(String(e.users?._id))} )
 

        // res.status(200).send({a: allUserIds.length, b: allProductUserIds.length, c: allTicketUserIds.length, d: allProfileUpdateUserIds.length})
        
        let finalIds = [];

        if(req.query.isProduct == 1 && req.query.isTicket == 0 && req.query.isProfile == 0){
            finalIds = allProductUserIds
        }
        if(req.query.isProduct == 0 && req.query.isTicket == 1 && req.query.isProfile == 0){
            finalIds = allTicketUserIds
        }
        if(req.query.isProduct == 0 && req.query.isTicket == 0 && req.query.isProfile == 1){
            finalIds = allProfileUpdateUserIds
        }
        if(req.query.isProduct == 1 && req.query.isTicket == 1 && req.query.isProfile == 0){
            finalIds = allTicketUserIds
        }
        if(req.query.isProduct == 1 && req.query.isTicket == 0 && req.query.isProfile == 1){
            allProductUserIds = [];
            // allProductUsers.map( e => console.log(e.users?.email) )
            allProductUsers.map( e => { if(e.users != 'null' && e.users?._id != undefined && e.users?.email != "" && !allProductUserIds.includes(String(e.users?._id))) allProductUserIds.push(String(e.users?._id))} )

            finalIds = allProductUserIds
        }
        if(req.query.isProduct == 0 && req.query.isTicket == 1 && req.query.isProfile == 1){
            finalIds = allTicketUserIds
        }
        if(req.query.isProduct == 1 && req.query.isTicket == 1 && req.query.isProfile == 1){
            finalIds = allTicketUserIds
        }
        if(req.query.isProduct == 0 && req.query.isTicket == 0 && req.query.isProfile == 0){
            finalIds = allUserIds
        }

        let userData = await Users.find({_id: {$in: finalIds}}).sort({_id: -1})
        res.status(200).send({
            error: false,
            message: "filtered user data",
            data: {
                length: userData.length, 
                users: userData
            }
        })

    } catch (err) {
        res.status(200).send({
            error: true,
            message: err.toString()
        })
    }
})

filtersRoute.get('/product-filter', async(req, res, next) => {
    let productData = await Products.find({$and: [
        {modelName: {$regex: req.query.modelName, $options: 'i'}},
        {modelNo: {$regex: req.query.modelNo, $options: 'i'}},
        {brands: {$regex: req.query.brandName, $options: 'i'}},
        {category: {$regex: req.query.category, $options: 'i'}},
        {subCategory: {$regex: req.query.subCategory, $options: 'i'}}
    ]}).populate([
        {
            path: "users",
            select: "name email mobile fcmToken uuid player_id"
        }
    ]).sort({_id: -1})

    productData = productData.filter(e => e.users != null)
    res.status(200).send({length: productData.length, productData})
})

module.exports = filtersRoute