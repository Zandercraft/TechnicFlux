const express = require('express')
const router = express.Router()
const { RecaptchaV3 } = require('express-recaptcha')

// --- Google ReCaptcha
const site_key = process.env?.CAPTCHA_SITE_KEY
const site_secret = process.env?.CAPTCHA_SITE_SECRET
const captcha_enabled = (site_key !== undefined) && (site_secret !== undefined)
const recaptcha = captcha_enabled ? new RecaptchaV3(site_key, site_secret, {
  callback: 'cb'
}) : undefined

/* GET home page. */
router.get('/', captcha_enabled ? recaptcha.middleware.render : (req, res, next) => {next()}, function (req, res) {
  res.render('index', {
    title: 'TechnicFlux',
    captcha: captcha_enabled ? res.recaptcha : false
  })
})

/* POST home page (login info w/ captcha) */
router.post('/', captcha_enabled ? recaptcha.middleware.verify : (req, res, next) => {next()}, function (req, res) {
  // Validate captcha, if enabled.
  if (captcha_enabled && req.recaptcha.error) {
    return res.render('index', {
      title: 'TechnicFlux',
      captcha: captcha_enabled ? res.recaptcha : false,
      error: "Captcha validation failed! Ensure that javascript is enabled!"
    })
  }

  // Check login info
  res.json({success: "yay"})
})

module.exports = router
