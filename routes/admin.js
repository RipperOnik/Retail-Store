const path = require('path');

const express = require('express');

const adminController = require('../controllers/admin');
const protectedRoute = require('../middleware/protected-route')
const { body } = require('express-validator')

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', protectedRoute, adminController.getAddProduct);

// /admin/products => GET
router.get('/products', protectedRoute, adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product', protectedRoute, [
    body('price', 'Please enter a valid float number')
        .isFloat(),
    body('description', 'Please enter a valid description')
        .isLength({ min: 8, max: 200 })
        .trim(),
    body('title', 'Please enter a valid title')
        .isString()
        .isLength({ min: 3 })
        .trim()

], adminController.postAddProduct);

router.get('/edit-product/:productId', protectedRoute, adminController.getEditProduct);

router.post('/edit-product', protectedRoute, [
    body('price', 'Please enter a valid float number')
        .isFloat(),
    body('description', 'Please enter a valid description')
        .isLength({ min: 8, max: 200 })
        .trim(),
    body('title', 'Please enter a valid title')
        .isAlphanumeric()
        .isLength({ min: 3 })
        .trim()

], adminController.postEditProduct);

router.delete('/product/:productId', protectedRoute, adminController.deleteProduct);

module.exports = router;
