const express = require('express');
const { check, body } = require('express-validator')

const authController = require('../controllers/auth');

const router = express.Router();

const User = require('../models/user')

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login',
    [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid email')
            .normalizeEmail(),

        body('password', 'Please enter a password 6 minimum characters long and containing only numbers and letters')
            .isLength({ min: 6 })
            .isAlphanumeric()
            .trim()
    ],
    authController.postLogin);

router.post(
    '/signup',
    [
        check('email')
            .isEmail()
            .withMessage('Please input a valid email')
            .custom((value, { req }) => {
                return User.findOne({ email: value })
                    .then((user) => {
                        if (user) {
                            return Promise.reject('This email already exists')
                        }
                    })
            })
            .normalizeEmail()
        ,
        body('password', 'Please enter a password 6 minimum characters long and containing only numbers and letters')
            .isLength({ min: 6 })
            .isAlphanumeric()
            .trim(),
        body('confirmPassword')
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Passwords have to match')
                }
                return true
            })
            .trim()
    ]
    ,
    authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;

