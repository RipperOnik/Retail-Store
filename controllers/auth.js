const User = require('../models/user');
const ResetToken = require('../models/reset-token');
const bcrypt = require('bcryptjs')
const crypto = require('crypto')


const redirectWithUserMessage = require('../util/redirect-with-user-message')

const nodemailer = require('nodemailer')
const sendGridTransport = require('nodemailer-sendgrid-transport')
const { validationResult } = require('express-validator')

const transporter = nodemailer.createTransport(sendGridTransport({
  auth: {
    api_key: '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'
  }
}))

exports.getLogin = (req, res, next) => {

  const errorMessage = req.session.message
  delete req.session.message
  const oldInput = req.session.oldInput ?? { email: '', password: '' }
  delete req.session.oldInput

  const validationErrors = req.session.validationErrors ?? []
  console.log(validationErrors);
  delete req.session.validationErrors

  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    csrfToken: req.csrfToken(),
    errorMessage: errorMessage,
    oldInput: oldInput,
    validationErrors: validationErrors
  });
};

exports.getSignup = (req, res, next) => {

  const errorMessage = req.session.message
  delete req.session.message
  const oldInput = req.session.oldInput ?? { email: '', password: '', confirmPassword: '' }
  delete req.session.oldInput
  const validationErrors = req.session.validationErrors ?? []
  delete req.session.validationErrors

  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    csrfToken: req.csrfToken(),
    errorMessage: errorMessage,
    oldInput: oldInput,
    validationErrors: validationErrors
  });
};

exports.postLogin = async (req, res, next) => {

  // we should validate user first
  try {
    const { email, password } = req.body

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return redirectWithUserMessage(req, res, errors.array()[0].msg, '/login', 422, { email, password }, errors.array())
    }

    const user = await User.findOne({ email })
    // user doesn't exist
    if (!user) {
      return redirectWithUserMessage(req, res, 'Invalid email or password', '/login', 422, { email, password }, [{ path: 'email' }])
    }
    const passwordMatch = await bcrypt.compare(password, user.password) // check if passwords match by comparing encrypted passwords (the first password is not coming in encrypted)
    if (passwordMatch) {
      req.session.isLoggedIn = true
      req.session.user = user
      req.session.save(err => {
        console.error(err)
        res.redirect('/')
      })
    }
    // password doesn't match
    else {
      redirectWithUserMessage(req, res, 'Invalid email or password', '/login', 422, { email, password }, [{ path: 'password' }])
    }

  } catch (error) {
    console.error(error)
  }
};

exports.postSignup = async (req, res, next) => {
  const { email, password } = req.body
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return redirectWithUserMessage(req, res, errors.array()[0].msg, '/signup', 422, { email, password, confirmPassword: req.body.confirmPassword }, errors.array())
  }
  try {
    const encryptedPassword = await bcrypt.hash(password, 12)
    await User.create({ email, password: encryptedPassword })
    transporter.sendMail({
      to: email,
      from: 'amethystoni@gmail.com',
      subject: 'Signup succeeded!',
      html: '<h1>You successfully signed up!</h1>'
    })
    res.redirect('/login')
  } catch (error) {
    console.error(error)
  }
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};


exports.getReset = (req, res, next) => {
  const errorMessage = req.session.message
  delete req.session.message

  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    csrfToken: req.csrfToken(),
    errorMessage: errorMessage
  });
};

exports.postReset = async (req, res, next) => {
  crypto.randomBytes(32, async (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('/reset')
    }
    const token = buffer.toString('hex')

    try {
      const user = await User.findOne({ email: req.body.email })
      if (!user) {
        return redirectWithUserMessage(req, res, 'No account with that email found', '/reset')
      }
      await ResetToken.create({
        token: token,
        userId: user._id
      })

      res.redirect('/')
      transporter.sendMail({
        to: req.body.email,
        from: 'amethystoni@gmail.com',
        subject: 'Password Reset',
        html: `
          <p>You requested to reset the password.</p>
          <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to reset your password.</p>
        `
      })
    } catch (error) {
      console.log(error);
    }
  })
}

exports.getNewPassword = async (req, res, next) => {
  const token = req.params.token
  try {
    const errorMessage = req.session.message
    delete req.session.message

    const resetToken = await ResetToken.findOne({ token: token })

    // const user = await User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    if (!resetToken) {
      redirectWithUserMessage(req, res, 'The update password link has been expired', '/reset')
      return
    }
    const user = await User.findById(resetToken.userId)
    res.render('auth/new-password', {
      path: '/new-password',
      pageTitle: 'New Password',
      csrfToken: req.csrfToken(),
      errorMessage,
      userId: user._id,
      passwordToken: token
    })

  } catch (error) {
    console.log(error)
  }
}

exports.postNewPassword = async (req, res, next) => {
  const { userId, password, passwordToken } = req.body
  try {
    const resetToken = await ResetToken.findOne({ token: passwordToken })
    if (!resetToken) {
      return res.redirect('/login')
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await User.updateOne({ _id: userId }, { $set: { password: hashedPassword } })
    res.redirect('/login')
  }
  catch (error) {
    console.log(error);
  }
}