const express = require('express')
const createError = require('http-errors')
const { signAccessToken, signRefreshToken } = require('../helper/jwt_helper')
const { verifyAccessToken } = require('../helper/jwt_helper')
const Admin = require('../models/admin')
const bcrypt = require('bcrypt')
const AdminAuthRouter = express.Router()

AdminAuthRouter.post('/register', async (req, res, next) => {
    try {

        const doesExist = await Admin.findOne({ email: req.body.email })
        if (doesExist)
        throw createError.Conflict(`${req.body.email} is already been registered`)

        const admin = new Admin(req.body)
        const savedAdmin = await admin.save()
        // console.log(savedAdmin.id);
        const accessToken = await signAccessToken(savedAdmin.id, "admins")
        const refreshToken = await signRefreshToken(savedAdmin.id, "admins")

        res.status(201).send({
            error: false,
            message: 'Admin created',
            data: {
                accessToken, 
                refreshToken
            }
        })
    } catch (error) {
        next(error)
    }
})

AdminAuthRouter.post('/login', async (req, res, next) => {
    try {
      const admin = await Admin.findOne({ email: req.body.email })
      if (!admin) throw createError.NotFound('Admin not registered')

      const isMatch = await admin.isValidPassword(req.body.password)
      if (!isMatch)
        throw createError.Unauthorized('email/password not valid')

      const accessToken = await signAccessToken(admin.id, "admins")
      const refreshToken = await signRefreshToken(admin.id, "admins")

      res.status(200).send({
        error: false,
        message: 'Admin logged in',
        data: {
          accessToken, 
          refreshToken
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

AdminAuthRouter.post('/forget-password', async (req, res, next) => {
    try {
      if(!req.body.email) return res.status(400).send({error: true, message: "Email required"});

      const AdminData = await Admin.findOneAndUpdate({ email: req.body.email }, {otp: 1234});
      if(!AdminData) return res.status(404).send({error: true, message: 'Admin not found'});

      return res.status(200).send({error: false, message: 'Otp sent successfully'});
    
    } catch (error) {
      next(error)
    }
  }
)

AdminAuthRouter.post('/verify-otp', async (req, res, next) => {
    try {
      if(!req.body.email && !req.body.otp) return res.status(400).send({error: true, message: "Email and OTP required"});

      const AdminData = await Admin.findOne({
        $and: [
          { email: req.body.email },
          { otp: req.body.otp }
        ]
      });
      if(!AdminData) return res.status(404).send({error: true, message: 'Admin not found'});

      return res.status(200).send({error: false, message: 'Otp verfied successfully'});
    
    } catch (error) {
      next(error)
    }
  }
)

AdminAuthRouter.patch('/reset-password', async (req, res, next) => {
    try {
      if (req.body.new_password && req.body.confirm_password) {
        if (req.body.new_password !== req.body.confirm_password) {
            message = {
              error: true,
              message: "new and confirm password are not equal"
            }
            return res.status(400).send(message);
        }
        const AdminData = await Admin.findOne({
            email: req.body.email
        });
       
        if (AdminData === null) {
            message = {
              error: true,
              message: "Admin not found!"
            }
          return res.status(404).send(message);

        } else {
          const result = await Admin.findOneAndUpdate({
            email: req.body.email
          }, {
            password: req.body.new_password
          });

          console.log("result",result);
          
          message = {
            error: false,
            message: "Admin password reset successfully!"
          }
          return res.status(200).send(message);
        }
    } else {
      message = {
        error: true,
        message: "new password, confirm password are required!"
      }
      return res.status(404).send(message);
    }
    
    } catch (error) {
      next(error)
    }
  }
)

AdminAuthRouter.patch('/change-password/:adminId', verifyAccessToken, async (req, res, next) => {
    try {
      if (req.body.old_password && req.body.new_password) {
        if (req.body.old_password === req.body.new_password) {
            message = {
                error: true,
                message: "Old and new password can not be same"
            }
            return res.status(200).send(message);
        }
        const adminData = await Admin.findOne({
            _id: req.params.adminId
        });
        if (adminData === null) {
            message = {
                error: true,
                message: "Admin not found!"
            }
        } else {
            passwordCheck = await bcrypt.compare(req.body.old_password, adminData.password);
            if (passwordCheck) {
                const result = await Admin.findOneAndUpdate({
                  _id: req.params.adminId
                }, {
                  password: req.body.new_password
                }, {new: true});
                message = {
                    error: false,
                    message: "Admin password updated!",
                    result
                }
            } else {
                message = {
                  error: true,
                  message: "Old password is not correct!"
                }
            }
        }
      } else {
          message = {
              error: true,
              message: "Old password, new password are required!"
          }
      }
      return res.status(200).send(message);
    } catch (error) {
      next(error)
    }
  }
)

AdminAuthRouter.post('/refresh-token', async (req, res, next) => {
    try {
      const { refreshToken } = req.body
      if (!refreshToken) throw createError.BadRequest()
      const userId = await verifyRefreshToken(refreshToken)

      const accessToken = await signAccessToken(userId, "admins")
      const refToken = await signRefreshToken(userId, "admins")
      res.send({ accessToken: accessToken, refreshToken: refToken })
    } catch (error) {
      next(error)
    }
  }
)

// AdminAuthRouter.delete('/logout', AdminAuthController.logout)

module.exports = AdminAuthRouter