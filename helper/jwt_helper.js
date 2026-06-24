const JWT = require('jsonwebtoken')
const createError = require('http-errors')
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET

module.exports = {
  signAccessToken: (userId, dataModel) => {
    return new Promise((resolve, reject) => {
      const payload = {model: dataModel}
      const secret = ACCESS_TOKEN_SECRET
      const options = {
        expiresIn: '2h',
        audience: userId,
      }
      JWT.sign(payload, secret, options, (err, token) => {
        if (err) {
          console.log(err.message)
          reject(createError.InternalServerError())
          return
        }
        resolve(token)
      })
    })
  },

  verifyAccessToken: (req, res, next) => {
    if (!req.headers['authorization']) return next(createError.Unauthorized())
    const authHeader = req.headers['authorization']
    const bearerToken = authHeader.split(' ')
    const token = bearerToken[1]
    JWT.verify(token, ACCESS_TOKEN_SECRET, (err, payload) => {
      if (err) {
        const message =
          err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message
        return next(createError.Unauthorized(message))
      }
      req.payload = payload
      next()
    })
  },

  signRefreshToken: (userId, dataModel) => {
    return new Promise((resolve, reject) => {
      const payload = {model: dataModel}
      const secret = REFRESH_TOKEN_SECRET
      const options = {
        expiresIn: '1y',
        audience: userId,
      }
      JWT.sign(payload, secret, options, (err, token) => {
        if (err) {
          console.log(err.message)
          // reject(err)
          reject(createError.InternalServerError())
        }
        resolve(token)

      })
    })
  },
  
  verifyRefreshToken: (refreshToken) => {
    return new Promise((resolve, reject) => {
      JWT.verify(
        refreshToken,
        REFRESH_TOKEN_SECRET,
        (err, payload) => {
          if (err) return reject(createError.Unauthorized())
          const userId = payload.aud
          const dataModel = payload.model

          if (refreshToken === result) return resolve(userId, dataModel)
          reject(createError.Unauthorized())
        }
      )
    })
  },
}
