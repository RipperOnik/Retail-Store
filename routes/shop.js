const path = require('path');

const express = require('express');

const shopController = require('../controllers/shop');
const protectedRoute = require('../middleware/protected-route')

const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productId', shopController.getProduct);

router.get('/cart', protectedRoute, shopController.getCart);

router.post('/cart', protectedRoute, shopController.postCart);

router.post('/cart-delete-item', protectedRoute, shopController.postCartDeleteProduct);

router.post('/create-order', protectedRoute, shopController.postOrder);

router.get('/orders', protectedRoute, shopController.getOrders);

router.get('/orders/:orderId', protectedRoute, shopController.getInvoice);

module.exports = router;
