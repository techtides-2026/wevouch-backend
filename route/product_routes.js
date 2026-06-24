const express = require("express");
const Products = require("../models/products");
const Tickets = require("../models/tickets");
const Notifications = require("../models/notification");
const mongoose = require("mongoose");
const productRouter = express.Router();
const sendNotification = require("../helper/sendNotification");
const sendPushNotification = require("../helper/sendPushNotification");
const request = require("request");
const fetch = require('node-fetch');
const { default: axios } = require("axios");
const FormData = require("form-data");
const Users = require("../models/users");

function randomString(length, chars) {
  var result = "";
  for (var i = length; i > 0; --i)
    result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}
productRouter.get("/list", async (req, res) => {
  const products = await Products.find()
    .sort({ createdAt: -1 })
    .populate("users");
  res.send(products);
});

productRouter.get("/new-list", async (req, res) => {
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
  const products = await Products.find(query).populate("users");
  res.send(products);
});

/**
 * This is the current admin panel product list
 */
productRouter.get("/current-list", async (req, res, next) => {
  try {
    const pageNumber = +req.query.page;
    const nPerPage = +req.query.count;
    if (!req.query.page || !req.query.count) return res.status(400).send({error: true, message: "Page number and count per page must required"})

    let andQuery = [
      {"userData.0": {$exists: true}}
    ]
    if(req.query.mobile) {
      andQuery.push(
        {"userData.0.mobile": {$regex: req.query.mobile, $options: 'i'}}
      )
    }
    if (req.query.brand) {
      andQuery.push(
        {brands: {$regex: req.query.brand, $options: 'i'}}
      )
    }
    if (req.query.category) {
      andQuery.push(
        {category: {$regex: req.query.category, $options: 'i'}}
      )
    }
    if (req.query.subCategory) {
      andQuery.push(
        {subCategory: {$regex: req.query.subCategory, $options: 'i'}}
      )
    }
    if (req.query.modelName) {
      andQuery.push(
        {modelName: {$regex: req.query.modelName, $options: 'i'}}
      )
    }
    if (req.query.modelNo) {
      andQuery.push(
        {modelNo: {$regex: req.query.modelNo, $options: 'i'}}
      )
    }
    if (req.query.date) {
      // let lessThanDate = new Date(req.query.date)
      // lessThanDate.setDate(lessThanDate.getDate()+1)
      let currDate = new Date(req.query.date);
      currDate.setUTCDate(currDate.getDate()-1)
      currDate.setUTCHours(18)
      currDate.setUTCMinutes(30)
      currDate.setUTCSeconds(0)
      currDate.setUTCMilliseconds(0)
  
      let lessThanDate = new Date(req.query.date)
      lessThanDate.setDate(lessThanDate.getDate())
      lessThanDate.setUTCHours(18)
      lessThanDate.setUTCMinutes(30)
      lessThanDate.setUTCSeconds(0)
      lessThanDate.setUTCMilliseconds(0)

      console.log(currDate, lessThanDate);
      andQuery.push(
        {"createdAt": {
          $gte: currDate, 
          $lt: lessThanDate
        }}
      )
    }
    if (req.query.amc) {
      andQuery.push(
        {"amcDetails": req.query.amc == 0 ? { $exists: false } : { $exists: true }}
      )
    }
    if (req.query.extdwarranty) {
      andQuery.push(
        {"extendedWarranty": req.query.extdwarranty == 0 ? { $exists: false } : { $exists: true }}
      )
    }

    console.log(andQuery);

    // let productCount = await Product.countDocuments({$and: query})
    const productData = await Products.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'users',
          foreignField: '_id',
          as: 'userData',
          pipeline: [
            { $project: { name: "$name", email: "$email", mobile: "$mobile", is_mobile_verified: "$is_mobile_verified",  } },
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

    const productCount = await Products.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'users',
          foreignField: '_id',
          as: 'userData',
          pipeline: [
            { $project: { name: "$name", email: "$email", mobile: "$mobile", is_mobile_verified: "$is_mobile_verified",  } },
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

    res.status(200).send({
      error: false,
      message: 'Product list',
      data: productData,
      totalProduct: productCount.length ? productCount[0]?.total : 0,
      userPerpage: nPerPage,
    })
  } catch (error) {
    next(error)
  }
});

/**
 * Checking product has any open ticket 
 */
productRouter.get("/check-open-ticket/:productId", async (req, res, next) => {
  try {
    const existingOpenTicket = await Tickets.findOne({products: req.params.productId, status: {$in: ["new", "ongoing"]}})
    return res.status(200).send({
      error: false,
      message: "Open ticket check",
      openTicket: !!existingOpenTicket
    })
  } catch (error) {
    return res.status(500).send({
      error: true,
      message: "Something went wrong"
    })
  }
})

/**
 * This method is used to migrate database 
 */
productRouter.get("/list2", async (req, res, next) => {
  try {
    // let productData = await Product.updateMany(
    //   // Match all documents
    //   {},
    //   // MongoDB 4.2+ can use an aggregation pipeline for updates
    //   [{
    //       $set: {
    //         "user": "$users",
    //         "brand": "$brands"
    //       }
    //   }]
    // );
    
    // /**
    //  * fetchBrands
    //  * fetchAllCategories
    //  * fetchAllSubcategories
    //  * fetchAllModels
    //  * fetchAllModelDetails
    //  */
    // const response = await fetch(`${process.env.BRAND_CATEGORY_MASTER_API}?action=fetchAllModelDetails`, {
    //   method: 'GET',
    //   headers: {'Content-Type': 'application/json'}
    // });
    // const data = await response.json();

    // let existingDatas = []
    // if (data.status == 1) {
    //   // existingDatas = data.brands.map(e => {
    //   //   return e.name;
    //   // })
    //   // existingDatas = data.categories.map(e => {
    //   //   return e.category;
    //   // })
    //   // existingDatas = data.sub_categories.map(e => {
    //   //   return e.sub_category;
    //   // })
    //   // existingDatas = data.models.map(e => {
    //   //   return e.model_name;
    //   // })
    //   existingDatas = data.model_details.map(e => {
    //     return e.model_no;
    //   })
    // }

    // //changing status of other brands, categorty, subCategory, modelNmae, modelNo
    // let productData1 = await Products.updateMany(
    //   {modelNo: {"$nin": existingDatas}},
    //   {otherModelNo: true},
    //   {new: true}
    // )

    // let productData2 = await Products.updateMany(
    //   {modelNo: {"$in": existingDatas}},
    //   {otherModelNo: false},
    //   {new: true}
    // )


    /**
     * Incresing product added count in user
     */
    // let productData = await Product.updateMany(
    //     // Match all documents
    //     {otherModelNo: undefined},
    //     // MongoDB 4.2+ can use an aggregation pipeline for updates
    //     [{
    //         $set: {
    //           "otherModelNo": true,
    //         }
    //     }]
    // )
    let productData = await Products.find({});
    productData = JSON.parse(JSON.stringify(productData))
    for(let i in productData) {
      await Users.findOneAndUpdate({_id: productData[i].users}, {isProductAdded: true, $inc: {productAddedCount: 1}})
    }

    return res.status(200).send({
      error: false,
      productData
    })
  } catch (error) {
    next(error)
  }
})

/**
 * All detail of a product
 */
productRouter.get("/all-detail/:productId", async (req, res, next) => {
  try {
    const productData = await Products.findOne({
      $and: [
        { _id: req.params.productId }
      ]
    }).populate([
      {
        path: "users",
        select: "name email mobile is_mobile_verified"
      }
    ])

    const tickets = await Tickets.find({products: req.params.productId}).populate([
      {
        path: "products",
        select: "name"
      }
    ])

    res.status(200).send({ 
      error: false,
      message: 'Product detail',
      data: productData,
      tickets
    })
  } catch (error) {
    next(error)
  }
});

productRouter.get("/detail/:productId", async (req, res, next) => {
  try {
    const productData = await Products.findOne({
      $and: [
        { _id: req.params.productId }
      ]
    }).populate([
      {
        path: "users",
        select: "name email mobile is_mobile_verified"
      }
    ])

    res.status(200).send({ 
      error: false,
      message: 'Product detail',
      data: productData
    })
  } catch (error) {
    next(error)
  }
});

productRouter.get("/list-all", async (req, res) => {
  try {
    let products = await Products.find({}).sort({ _id: -1 }).populate([
      {
        path: "users",
        select: "name mobile fcmToken"
      }
    ]);
    products = products.filter(e => e.purchaseDate && e.warrantyPeriod != null)
    products.map(e => {
      if (e.purchaseDate && e.warrantyPeriod != null) {
        currDt = new Date();

        expDt = new Date(e.purchaseDate);
        expDt.setMonth(expDt.getMonth() + e.warrantyPeriod);
        let diffInDays = Number((currDt-expDt)/(1000 * 60 * 60 * 24));
        console.log(e?.users?.fcmToken, diffInDays);
        // e
        if (diffInDays > -2 && diffInDays <= 0) {
          console.log(products?.users?.fcmToken,"Warranty lapsed");
        } else if (diffInDays > -4 && diffInDays < -3) {
          console.log(products?.users?.fcmToken,"3 Days waaranty");
        } else if (diffInDays > -31 && diffInDays < -30) {
          console.log(products?.users?.fcmToken,"30 Days waaranty");
        } else {
          //
        }
      }
    })

    res.status(200).send({
      error: false,
      message: "All Products",
      data: products
    });
  } catch (error) {
    res.status(200).send({
      error: true,
      message: "Bad request"
    });
  }
});

/**
 * This is brandwise product count
 */
productRouter.get("/barnd-wise-list", async (req, res, next) => {
  try {
    const response = await fetch(`${process.env.BRAND_CATEGORY_MASTER_API}?action=fetchBrands`, {
      method: 'GET',
      headers: {'Content-Type': 'application/json'}
    });
    const data = await response.json();

    let existingBrands = []
    if (data.status == 1) {
      existingBrands = data.brands.map(e => {
        return e.name
      })
    }

    let productData = await Products.aggregate([
      {"$match": {brands: {"$in": existingBrands}}},
      {"$sort" : {brands: 1}},
      {"$group" : { _id:"$brands", count:{$sum:1}} },
      {"$sort" : {_id: 1}}
    ]);

    for(let i in existingBrands) {
      if(!productData.filter(e => e._id == existingBrands[i]).length) {
        productData.push({
          _id: existingBrands[i],
          count: 0
        })
      }
    }

    res.status(200).send({ 
      error: false,
      message: 'Brand wise product list',
      data: productData.sort((a,b) => {
        if ( a._id < b._id ){
          return -1;
        }
        if ( a._id > b._id ){
          return 1;
        }
        return 0;
      }),
      // productDataLength: productData.length,
      // existingBrands,
      // existingBrandsLength: existingBrands.length
    })
  } catch (error) {
    next(error)
  }
})

/**
 * This is brand and category wise product count
 * @param {brand} req
 */
productRouter.get("/category-wise-list", async (req, res, next) => {
  try {
    let productData = await Products.aggregate([
      {"$match": {brands: req.query.brand}},
      {"$sort" : {category: 1}},
      {"$group" : { _id:"$category", count:{$sum:1}} },
      {"$sort" : {_id: 1}}
    ]);

    res.status(200).send({ 
      error: false,
      message: 'Brand,Category wise Product count',
      data: productData,
    })
  } catch (error) {
    next(error)
  }
}),

 /**
 * This is brand and category and subcategory wise product count
 * @param {brand, category} req
 */
productRouter.get("/subcategory-wise-list", async (req, res, next) => {
  try {
    let productData = await Products.aggregate([
      {"$match": {
        "$and": [
          {brands: req.query.brand},
          {category: req.query.category}
        ]
      }},
      {"$sort" : {subCategory: 1}},
      {"$group" : { _id:"$subCategory", count:{$sum:1}} },
      {"$sort" : {_id: 1}}
    ]);

    res.status(200).send({ 
      error: false,
      message: 'Brand,Category,subcategory wise Product count',
      data: productData,
    })
  } catch (error) {
    next(error)
  }
}),

/**
 * This is brand and category and subcategory and modelname wise product count
 * @param {brand, category, modelname} req
 */
productRouter.get("/modelname-wise-list", async (req, res, next) => {
  try {
    let productData = await Products.aggregate([
      {"$match": {
        "$and": [
          {brands: req.query.brand},
          {category: req.query.category},
          {subCategory: req.query.subcategory},
        ]
      }},
      {"$sort" : {modelName: 1}},
      {"$group" : { _id:"$modelName", count:{$sum:1}} },
      {"$sort" : {_id: 1}}
    ]);

    res.status(200).send({ 
      error: false,
      message: 'Brand,Category,subcategory,modelName wise Product count',
      data: productData,
    })
  } catch (error) {
    next(error)
  }
}),

/**
 * This is brand and category and subcategory and modelname and modelnumber wise product count
 * @param {brand, category, modelname, modelnumber} req
 */
productRouter.get("/modelnumber-wise-list", async (req, res, next) => {
  try {
    let productData = await Products.aggregate([
      {"$match": {
        "$and": [
          {brands: req.query.brand},
          {category: req.query.category},
          {subCategory: req.query.subcategory},
          {modelName: req.query.modelname},
        ]
      }},
      {"$sort" : {modelNo: 1}},
      {"$group" : { _id:"$modelNo", count:{$sum:1}} },
      {"$sort" : {_id: 1}}
    ]);

    res.status(200).send({ 
      error: false,
      message: 'Brand,Category,subcategory,modelName,modelNo wise Product count',
      data: productData,
    })
  } catch (error) {
    next(error)
  }
}),

/**
 * This is brand and category and subcategory and modelname and modelnumber wise product count
 * @param {brand, category, modelname, modelnumber} req
 */
productRouter.get("/user-wise-list", async (req, res, next) => {
  try {
    let productData = await Products.aggregate([
      {"$match": {
        "$and": [
          {brands: req.query.brand},
          {category: req.query.category},
          {subCategory: req.query.subcategory},
          {modelName: req.query.modelname},
          {modelNo: req.query.modelnumber},
        ]
      }},
      {"$sort" : {_id: 1}},
      {"$group" : { _id:"$users", count:{$sum:1}} },
      { "$lookup": 
        {
          "from": "users",
          "localField": "_id",
          "foreignField": "_id",
          "as": "user",
          "pipeline": [
            { $project: { name: "$name", email: "$email", mobile: "$mobile" } },
          ]
        }
      },
      {"$sort" : {_id: 1}}
    ]);

    res.status(200).send({ 
      error: false,
      message: 'Brand,Category,subcategory,modelName,modelNo wise Product count',
      data: productData,
    })
  } catch (error) {
    next(error)
  }
}),

/**
 * This is other brand lisiting
 */
productRouter.get('/other-data-list', async (req, res, next) => {
  try {
    const pageNumber = +req.query.page;
    const nPerPage = +req.query.count;

    let andQuery = [
      {"userData.0": {$exists: true}},
    ]
    
    if(req.query.type == 'brand') {
      andQuery.push(
        {otherBrand: true}
      )
    }
    if(req.query.type == 'category') {
      andQuery.push(
        {otherCategory: true}
      )
    }
    if(req.query.type == 'subCategory') {
      andQuery.push(
        {otherSubCategory: true}
      )
    }
    if(req.query.type == 'modelname') {
      andQuery.push(
        {otherModelName: true}
      )
    }
    if(req.query.type == 'modelnumber') {
      andQuery.push(
        {otherModelNo: true}
      )
    }
    if(req.query.brand) {
      andQuery.push(
        {brands: {$regex: req.query.brand, $options: 'i'}}
      )
    }
    if(req.query.category) {
      andQuery.push(
        {category: {$regex: req.query.category, $options: 'i'}}
      )
    }
    if(req.query.subCategory) {
      andQuery.push(
        {subCategory: {$regex: req.query.subCategory, $options: 'i'}}
      )
    }
    if(req.query.modelName) {
      andQuery.push(
        {modelName: {$regex: req.query.modelName, $options: 'i'}}
      )
    }
    if(req.query.modelNo) {
      andQuery.push(
        {modelNo: {$regex: req.query.modelNo, $options: 'i'}}
      )
    }
    if (req.query.date) {
      let lessThanDate = new Date(req.query.date)
      lessThanDate.setDate(lessThanDate.getDate()+1)

      console.log(new Date(req.query.date), lessThanDate);
      andQuery.push(
        {"createdAt": {
          $gte: new Date(req.query.date), 
          $lt: lessThanDate
        }}
      )
    }

    const productData = await Products.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'users',
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

    const totalProduct = await Products.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'users',
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
    ])

    res.status(200).send({ 
      error: false,
      message: 'Other Brand product list',
      data: productData,
      totalProduct: totalProduct.length ? totalProduct[0].total : 0,
      dataPerpage: nPerPage
    })
  } catch (error) {
    next(error)
  }
}),
/**
 * Product search api 
 * date: 22-07-2022
 */
 productRouter.get("/search", async (req, res) => {
  try {
    let products = [];
    if (req.query.q) {

      const query = {
        $or: [
          {name: {$regex: req.query.q, $options: 'i'}},
          {brands: {$regex: req.query.q, $options: 'i'}},
          {category: {$regex: req.query.q, $options: 'i'}},
          {uniqueId: {$regex: req.query.q, $options: 'i'}},
        ]
      };
      products = await Products.find(query).sort({ _id: -1 });

      res.status(200).send({
        error: false,
        message: "Searched Products",
        data: products
      });
    } else {
      products = await Products.find({}).sort({ _id: -1 });

      res.status(200).send({
        error: false,
        message: "All Products",
        data: products
      });
    }
  } catch (error) {
    res.status(200).send({
      error: true,
      message: "Bad request"
    });
  }
});

/**
 * Other Brands
 */
productRouter.get("/other-brand-list", async (req, res) => {
  try {

    let brandNames = [];

    var request = require('request');
    var options = {
      'method': 'GET',
      'url': 'http://13.58.159.255/wevouch/Api-v2.php?action=fetchBrands',
    };
    request(options, async function (error, response) {
      if (error) return res.status(200).send({error: true, message: String(error)});

      let responseData = JSON.parse(response.body)
      console.log(typeof responseData);
      if (responseData.status != 1 && responseData.status != 'Success') return res.status(200).send({error: true, message: String('Something went wrong'), data: responseData});
      
      brandNames = responseData.brands.map(e => {
        return e.name;
      })

      const otherBrandProducts = await Products.find({brands: {$nin: brandNames}}).sort({_id: -1}).populate([
        {
          path: "users",
          select: "name email mobile"
        }
      ])

      return res.status(200).send({
        error: false,
        message: "Other brand products", 
        data: otherBrandProducts.filter( e => e.users)
      })
    });
    
  } catch(error) {
    res.status(404);
    res.send({ 
      error: true,
      message: String(error)
    });
  }
});

/**
 * Other Categories
 */
productRouter.get("/other-category-list", async (req, res) => {
  try {

    let categoryNames = [];

    var request = require('request');
    var options = {
      'method': 'GET',
      'url': 'http://13.58.159.255/wevouch/Api-v2.php?action=fetchAllCategories',
    };
    request(options, async function (error, response) {
      if (error) return res.status(200).send({error: true, message: String(error)});

      let responseData = JSON.parse(response.body)
      console.log(typeof responseData);
      if (responseData.status != 1 && responseData.status != 'Success') return res.status(200).send({error: true, message: String('Something went wrong'), data: responseData});
      
      categoryNames = responseData.categories.map(e => {
        return e.category;
        // return new RegExp(e.category, "i")
      })

      const otherBrandProducts = await Products.find({category: {$nin: categoryNames}}).sort({_id: -1}).populate([
        {
          path: "users",
          select: "name email mobile"
        }
      ])

      return res.status(200).send({
        error: false,
        message: "Other brand products", 
        data: otherBrandProducts.filter( e => e.users)
      })
    });
    
  } catch(error) {
    res.status(404);
    res.send({ 
      error: true,
      message: String(error)
    });
  }
});

/**
 * Other Sub Categories
 */
productRouter.get("/other-sub-category-list", async (req, res) => {
  try {

    let subCategoryNames = [];

    var request = require('request');
    var options = {
      'method': 'GET',
      'url': 'http://13.58.159.255/wevouch/Api-v2.php?action=fetchAllSubcategories',
    };
    request(options, async function (error, response) {
      if (error) return res.status(200).send({error: true, message: String(error)});

      let responseData = JSON.parse(response.body)
      console.log(typeof responseData);
      if (responseData.status != 1 && responseData.status != 'Success') return res.status(200).send({error: true, message: String('Something went wrong'), data: responseData});
      
      subCategoryNames = responseData.sub_categories.map(e => {
        return e.sub_category;
      })

      // console.log(subCategoryNames);

      const otherBrandProducts = await Products.find({subCategory: {$nin: subCategoryNames}}).sort({_id: -1}).populate([
        {
          path: "users",
          select: "name email mobile"
        }
      ])

      return res.status(200).send({
        error: false,
        message: "Other brand products", 
        data: otherBrandProducts.filter( e => e.users)
      })
    });
    
  } catch(error) {
    res.status(404);
    res.send({ 
      error: true,
      message: String(error)
    });
  }
});

productRouter.get("/get-by-unique-id/:uniqueId", async (req, res) => {
  try {
    const product = await Products.findOne({
      uniqueId: req.params.uniqueId,
    }).populate("users");
    if (product) {
      res.status(200).send(product);
    } else {
      res.status(404).send({
        error: "Product doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Product doesn't exist!" });
  }
});

productRouter.post("/add", async (req, res) => {
  try {
    if (
      req.body.name &&
      req.body.userId &&
      req.body.brandId &&
      req.body.category
    ) {
      
      let newProduct = new Products();
      const sDate = new Date();

      const productBrandData = {
        'action': 'fetchOtherDataBoolean',
        'brand': req.body.brandId,
        'category': req.body.category,
        'sub_category': req.body.subCategory,
        'model_name': req.body.modelName,
        'model_no': req.body.modelNo
      };
      const productFormData = new FormData()
      productFormData.append('action', 'fetchOtherDataBoolean');
      productFormData.append('brand', req.body.brandId);
      productFormData.append('category', req.body.category);
      productFormData.append('sub_category', req.body.subCategory);
      productFormData.append('model_name', req.body.modelName);
      productFormData.append('model_no', req.body.modelNo);

      const productDataResponse = await axios.post(process.env.BRAND_CATEGORY_MASTER_API, productFormData);

      // Initialize newProduct object with request data
      (newProduct.name = req.body.name),
        (newProduct.brands = req.body.brandId),
        (newProduct.otherBrand = productDataResponse?.data?.otherBrand),

        (newProduct.category = req.body.category),
        (newProduct.otherCategory = productDataResponse?.data?.otherCategory),

        (newProduct.subCategory = req.body.subCategory),
        (newProduct.otherSubCategory = productDataResponse?.data?.otherSubCategory),

        (newProduct.modelNo = req.body.modelNo),
        (newProduct.otherModelNo = productDataResponse?.data?.otherModelNo),

        (newProduct.modelName = req.body.modelName),
        (newProduct.otherModelName = productDataResponse?.data?.otherModelName),

        (newProduct.yearOfPurchase = req.body.yearOfPurchase),
        (newProduct.serviceType = req.body.serviceType),
        (newProduct.invoicePhotoUrl = req.body.invoicePhotoUrl),
        (newProduct.documentUrl = req.body.documentUrl),
        (newProduct.warrantyPeriod = Number(req.body.warrantyPeriod || 0)),
        (newProduct.outOfWarranty = Number(req.body.outOfWarranty || 0)),
        (newProduct.serialNo = req.body.serialNo),
        (newProduct.registeredMobileNo = req.body.registeredMobileNo),
        (newProduct.productImagesUrl = req.body.productImagesUrl),
        (newProduct.extendedWarranty = req.body.extendedWarranty),
        // (newProduct.amcDetails = (req.body.amcDetails.serviceDuration != '') ? req.body.amcDetails : {}),
        (newProduct.amcDetails = req.body.amcDetails),
        (newProduct.uniqueId =
          "prod_" +
          randomString(
            6,
            "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
          )),
        (newProduct.createdAt = new Date(
          sDate.getFullYear(),
          sDate.getMonth(),
          sDate.getDate(),
          sDate.getHours(),
          sDate.getMinutes(),
          sDate.getSeconds(),
          sDate.getMilliseconds()
        )),
        (newProduct.users = mongoose.Types.ObjectId(req.body.userId));
      if (req.body.purchaseDate) {
        newProduct.purchaseDate = new Date(req.body.purchaseDate);
      }
      if (req.body.status) {
        newProduct.status = req.body.status;
      }

      // Save newProduct object to database
      newProduct.save((err) => {
        if (err) {
          return res.status(400).send({
            message: "Failed to add product.",
          });
        } else {
          
          // let productCount = Products.find({users: req.body.userId}).count();
          
        }
      });
      /**
       * user marked as product added
      */
     const userData = await Users.findOneAndUpdate(
       { _id: newProduct.users },
       { isProductAdded: true, $inc: {totalProductAdded: 1} },
       { new: true }
     )
    //  const userUpadte = await Users.findOneAndUpdate({_id: newProduct.users}, {isProductAdded: true, $inc: {productAddedCount: 1}})

      // const userNotification = await sendNotification({userId: req.body.userId, title: 'Product Addition', desc: `Dear User, you have successfully added your ${req.body.brandId} ${req.body.category}` });
      return res.status(200).send({
        message: "Product added successfully."
      });
    } else {
      res.status(403).send({
        message:
          "Product Name, User Id, Brand, Category are required.",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: error,
    });
  }
});

//dt 05-04-2022
productRouter.post("/create", async (req, res) => {
  try {
    if (
      req.body.name &&
      req.body.userId &&
      req.body.brandId &&
      req.body.category &&
      req.body.subCategory &&
      req.body.registeredMobileNo
    ) {
      
      let newProduct = new Products();
      const sDate = new Date();
      newProduct.extendedWarranty = {};
      newProduct.amcDetails = {};
      console.log(newProduct);

      // Initialize newProduct object with request data
      (newProduct.name = req.body.name),
      (newProduct.brands = req.body.brandId),
      (newProduct.category = req.body.category),
      (newProduct.subCategory = req.body.subCategory),
      (newProduct.modelNo = req.body.modelNo),
      (newProduct.modelName = req.body.modelName),
      (newProduct.yearOfPurchase = req.body.yearOfPurchase),
      (newProduct.serviceType = req.body.serviceType),
      (newProduct.warrantyPeriod = Number(req.body.warrantyPeriod || 0)),
      (newProduct.outOfWarranty = Number(req.body.outOfWarranty || 0)),
      (newProduct.serialNo = req.body.serialNo),
      (newProduct.registeredMobileNo = req.body.registeredMobileNo),
      (newProduct.extendedWarranty.mobileNo = req.body.extendedWarranty_mobileNo),
      (newProduct.extendedWarranty.noOfYears = req.body.extendedWarranty_noOfYears),
      (newProduct.extendedWarranty.serviceProvider = req.body.extendedWarranty_serviceProvider),
      (newProduct.extendedWarranty.startDate = req.body.extendedWarranty_startDate),
      (newProduct.extendedWarranty.policyNumber = req.body.extendedWarranty_policyNumber),
      (newProduct.extendedWarranty.extendedWarrantyImages = [req.body.extendedWarranty_img1, req.body.extendedWarranty_img2, req.body.extendedWarranty_img3, req.body.extendedWarranty_img4]),
      (newProduct.amcDetails.mobileNo = req.body.amcDetails_mobileNo),
      (newProduct.amcDetails.noOfYears = req.body.amcDetails_noOfYears),
      (newProduct.amcDetails.serviceProvider = req.body.amcDetails_serviceProvider),
      (newProduct.amcDetails.startDate = req.body.amcDetails_startDate),
      (newProduct.amcDetails.serviceDuration = req.body.amcDetails_serviceDuration),
      (newProduct.amcDetails.vendorNo = req.body.amcDetails_vendorNo),
      (newProduct.amcDetails.amcImages = [req.body.amcDetails_img1, req.body.amcDetails_img2,req.body.amcDetails_img3, req.body.amcDetails_img4]),
      (newProduct.productImagesUrl = req.body.productImagesUrl),
      (newProduct.invoicePhotoUrl = [req.body.invoicePhotoUrl1, req.body.invoicePhotoUrl2, req.body.invoicePhotoUrl3, req.body.invoicePhotoUrl4]),
      (newProduct.documentUrl = req.body.documentUrl),
      (newProduct.uniqueId =
        "prod_" +
        randomString(
          6,
          "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
        )
      ),
      (newProduct.createdAt = new Date(
        sDate.getFullYear(),
        sDate.getMonth(),
        sDate.getDate(),
        sDate.getHours(),
        sDate.getMinutes(),
        sDate.getSeconds(),
        sDate.getMilliseconds()
      )),
      (newProduct.users = mongoose.Types.ObjectId(req.body.userId));
      if (req.body.purchaseDate) {
        newProduct.purchaseDate = new Date(req.body.purchaseDate);
      }
      if (req.body.status) {
        newProduct.status = req.body.status;
      }

      // Save newProduct object to database
      newProduct.save((err) => {
        if (err) {
          return res.status(200).send({
            error: true,
            message: "Failed to add product.",
          });
        } else {
          // let productCount = Products.find({users: req.body.userId}).count();
          // sendNotification(req.body.userId, 'Product Added', 'Uou have added product ' +newProduct.name+ 'successfully')
          return res.status(200).send({
            error: false,
            message: "Product added successfully.",
            data: newProduct
          });
        }
      });
    } else {
      res.status(200).send({
        error: true,
        message:
          "Product Name, User Id, Brand, Category, Sub-category, registered mobile no are required.",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(200).send({
      error: true,
      message: 'Operation failed',
      data: error,
    });
  }
});

productRouter.get("/get/:id", async (req, res) => {
  try {
    const product = await Products.findOne({ _id: req.params.id }).populate(
      "users"
    );
    if (product) {
      res.status(200).send(product);
    } else {
      res.status(404).send({
        error: "Product doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Product doesn't exist!" });
  }
});

productRouter.get("/get-by-user/:id", async (req, res) => {
  try {
    const productList = await Products.find({ users: req.params.id })
      .sort({ createdAt: -1 })
      .populate("users");
    res.status(200).send(productList);
  } catch {
    res.status(404);
    res.send({ error: "Product doesn't exist!" });
  }
});

//dt. 26-03-2022
productRouter.get("/get-by-user-id/:id", async (req, res) => {
  try {
    const productList = await Products.find({ users: req.params.id })
      .sort({ _id: -1 })
      .populate("users");
    res.status(200).send({
      error: false,
      message: 'Product list by user',
      data: productList
    });
  } catch {
    res.status(404);
    res.send({ error: true, message: "Product doesn't exist!" });
  }
});

productRouter.get("/get-by-category/:id", async (req, res) => {
  try {
    const productList = await Products.find({ category: req.params.id })
      .sort({ createdAt: -1 })
      .populate("users");
    res.status(200).send(productList);
  } catch {
    res.status(404);
    res.send({ error: "Product doesn't exist!" });
  }
});

productRouter.post("/get-by-category-user", async (req, res) => {
  try {
    if (req.body.categoryId && req.body.userId) {
      const productList = await Products.find({
        category: req.body.categoryId,
        users: req.body.userId,
      })
        .sort({ createdAt: -1 })
        .populate("users");
      res.status(200).send(productList);
    } else {
      res.status(403).send({
        message: "User Id and Category Id are required.",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Product doesn't exist!" });
  }
});

productRouter.patch("/update/:id", async (req, res) => {
  try {
    const productBrandData = {
      'action': 'fetchOtherDataBoolean',
      'brand': req.body.brands,
      'category': req.body.category,
      'sub_category': req.body.subCategory,
      'model_name': req.body.modelName,
      'model_no': req.body.modelNo
    };
    const productFormData = new FormData()
    productFormData.append('action', 'fetchOtherDataBoolean');
    productFormData.append('brand', req.body?.brands);
    productFormData.append('category', req.body?.category);
    productFormData.append('sub_category', req.body?.subCategory);
    productFormData.append('model_name', req.body?.modelName);
    productFormData.append('model_no', req.body?.modelNo);
    
    const productDataResponse = await axios.post(process.env.BRAND_CATEGORY_MASTER_API, productFormData);

    if (productDataResponse && productDataResponse.status == "1") {
      req.body.otherBrand = productDataResponse.otherBrand;
      req.body.otherCategory = productDataResponse.otherCategory;
      req.body.otherSubCategory = productDataResponse.otherSubCategory;
      req.body.otherModelName = productDataResponse.otherModelName;
      req.body.otherModelNo = productDataResponse.otherModelNo;
    }

    const product = await Products.findOneAndUpdate({ _id: req.params.id }, req.body, {new: true});
    
    if (product) {

      /**
       * Here we are storing the data in new database as well
       */
      let productData = JSON.parse(JSON.stringify(product));
      productData.user = productData.users;
      productData.brand = productData.brands;

      res.status(200);
      res.send({
        error: false,
        message: "product updated",
        data: product
      });
    } else {
      res.status(404);
      res.send({ 
        error: true,
        message: "Product doesn't exist!", 
      });
    }
  } catch(error) {
    res.status(404);
    res.send({
      error: true, 
      message: String(error) 
    });
  }
});

//dt. 05-04-2022
productRouter.patch("/update-by-id/:id", async (req, res) => {
  try {
    req.body.extendedWarranty.mobileNo = req.body.extendedWarranty_mobileNo;
    req.body.extendedWarranty.noOfYears = req.body.extendedWarranty_noOfYears;
    req.body.extendedWarranty.serviceProvider = req.body.extendedWarranty_serviceProvider;
    req.body.extendedWarranty.startDate = req.body.extendedWarranty_startDate;
    req.body.extendedWarranty.policyNumber = req.body.extendedWarranty_policyNumber;
    req.body.extendedWarranty.extendedWarrantyImages = [req.body.extendedWarranty_img1, req.body.extendedWarranty_img2, req.body.extendedWarranty_img3, req.body.extendedWarranty_img4];
    req.body.amcDetails.mobileNo = req.body.amcDetails_mobileNo;
    req.body.amcDetails.noOfYears = req.body.amcDetails_noOfYears;
    req.body.amcDetails.serviceProvider = req.body.amcDetails_serviceProvider;
    req.body.amcDetails.startDate = req.body.amcDetails_startDate;
    req.body.amcDetails.serviceDuration = req.body.amcDetails_serviceDuration;
    req.body.amcDetails.vendorNo = req.body.amcDetails_vendorNo;
    req.body.amcDetails.amcImages = [req.body.amcDetails_img1, req.body.amcDetails_img2,req.body.amcDetails_img3, req.body.amcDetails_img4];
    req.body.invoicePhotoUrl = [req.body.invoicePhotoUrl1, req.body.invoicePhotoUrl2, req.body.invoicePhotoUrl3, req.body.invoicePhotoUrl4]

    const product = await Products.findOneAndUpdate(
      { _id: req.params.id }, 
      req.body, 
      {new: true}
      );
    
    if (product) {
      res.status(200);
      res.send({
        error: false,
        message: "product updated",
        data: product
      });
    } else {
      res.status(200);
      res.send({ 
        error: true,
        message: "Product doesn't exist!", 
      });
    }
  } catch {
    res.status(200);
    res.send({
      error: true, 
      message: "Product doesn't exist!" 
    });
  }
});

productRouter.delete("/delete/:id", async (req, res) => {
  try {
    const product = await Products.findOne({ _id: req.params.id });
    if (product) {

      await Products.deleteOne({ _id: req.params.id });
      res.status(200).send();
    } else {
      res.status(404).send({
        error: "Product doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Product doesn't exist!" });
  }
});

productRouter.delete("/delete-product/:id", async (req, res) => {
  try {
    const product = await Products.findOne({ _id: req.params.id });
    if (product) {

      const result = await Products.deleteOne({ _id: req.params.id });
      if (result.deletedCount == 1) {
        message = {
          error: false,
          message: "Product deleted successfully!",
        };
        res.status(200).send(message);
      } else {
        message = {
          error: true,
          message: "Product not deleted!",
        };
        res.status(200).send(message);
      }
    } else {
      res.status(404).send({
        error: "Product doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Product doesn't exist!" });
  }
});

productRouter.patch("/toggle-product-status/:id", async (req, res) => {
  try {
    if (req.body.status) {
      let product = await Products.findOne({ _id: req.params.id });
      if (product) {
        const newProduct = new Products();
        newProduct._id = product._id;
        newProduct.status = req.body.status;
        const filter = { _id: req.params.id };
        const updateProduct = await Products.findOneAndUpdate(
          filter,
          newProduct,
          {
            new: true,
          }
        );

        res.status(200).send(updateProduct);
      } else {
        res.status(404).send({
          error: "Product doesn't exist!",
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

module.exports = productRouter;
