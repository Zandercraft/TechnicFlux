const express = require('express')
const database = require('../database/database')
const { body, validationResult } = require('express-validator')
const { RecaptchaV3 } = require('express-recaptcha')
const router = express.Router()


// --- Google ReCaptcha
const site_key = process.env?.CAPTCHA_SITE_KEY
const site_secret = process.env?.CAPTCHA_SITE_SECRET
const captcha_enabled = (site_key !== undefined) && (site_secret !== undefined)
const recaptcha = captcha_enabled ? new RecaptchaV3(site_key, site_secret, {
  callback: 'cb'
}) : undefined

/* GET home page. */
router.get('/', captcha_enabled ? recaptcha.middleware.render : (req, res, next) => {next()}, function (req, res) {
  if (!req.session.user) {
    return res.render('index', {
      title: 'TechnicFlux',
      captcha: captcha_enabled ? res.recaptcha : false
    })
  } else {
    return res.render('dashboard', {
      title: 'TechnicFlux',
      user: req.session.user
    })
  }
})

/* POST home page (login info w/ captcha) */
router.post('/', [
  captcha_enabled ? recaptcha.middleware.verify : (req, res, next) => {next()},
  captcha_enabled ? recaptcha.middleware.render : (req, res, next) => {next()},
  body('username').notEmpty().isLength({min: 4, max: 50}).escape(),
  body('password').notEmpty().isLength({min: 4, max: 50}).escape(),
], function (req, res) {
  const result = validationResult(req)

  // Validate captcha, if enabled.
  if (captcha_enabled && req.recaptcha.error) {
    console.log(captcha_enabled)
    return res.render('index', {
      title: 'TechnicFlux',
      captcha: captcha_enabled ? res.recaptcha : false,
      error: "Captcha validation failed! Ensure javascript is enabled!"
    })
  }

  // Check that login details pass validation
  if (result.isEmpty()) {
    if (req.body.username === process.env.ADMIN_USER && req.body.password === process.env.ADMIN_PASS) {
      req.session.user = {
        _id: 0,
        username: process.env.ADMIN_USER,
        display_name: `${process.env.ADMIN_USER} (Admin)`,
        admin: true
      }
      return res.redirect('/')
    }

    // Check login info
    return database.user.authUser(`${req.body.username}`,
      `${req.body.password}`,
      true,
      req.get('User-Agent') || 'Unknown'
      ).then((user) => {
      if (user[0] === true) {
        // User login successful.
        req.session.user = user[1]
        res.redirect('/')
      } else {
        // User login failed.
        return res.render('index', {
          title: 'TechnicFlux',
          captcha: captcha_enabled ? res.recaptcha : false,
          error: "Invalid username or password! Please try again."
        })
      }
    })
  } else {
    return res.render('index', {
      title: 'TechnicFlux',
      captcha: captcha_enabled ? res.recaptcha : false,
      error: "Error: Malformed login data submitted."
    })
  }
})

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/')
  } )
})

module.exports = router
