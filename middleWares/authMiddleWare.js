const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler')
const User = require('../models/user')

const protect = asyncHandler(async (req, res, next) => {
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1]

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password')

      next()
    } catch (error) {
      console.log(error)
      res.status(401).send("Not authorized, token failed")
      throw new Error('Not authorized')
    }
  }

  if (!token) {
    res.status(401).send("not authorized, no token")
    throw new Error('Not authorized, no token')
  }
});

const protectAdmin = asyncHandler(async (req, res, next) => {
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1]

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password')
      if(req.user.isAdmin){
      next()}
      else{res.send("not authorized, you are not an admin")}
    } catch (error) {
      console.log(error)
      res.status(401).send("Not authorized, token failed")
      throw new Error('Not authorized')
    }
  }

  if (!token) {
    res.status(401).send("not authorized, no token")
    throw new Error('Not authorized, no token')
  }
})

module.exports = { protect , protectAdmin}