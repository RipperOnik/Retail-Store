const Product = require('../models/product');
const Order = require('../models/order');
const redirectWithUserMessage = require('../util/redirect-with-user-message')
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit')

exports.getProducts = (req, res, next) => {
  Product.find()
    .then(products => {
      console.log(products);
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
        csrfToken: req.csrfToken()
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
        csrfToken: req.csrfToken()
      });
    })
    .catch(err => console.log(err));
};

exports.getIndex = (req, res, next) => {
  Product.find()
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        csrfToken: req.csrfToken()
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getCart = (req, res, next) => {
  const message = req.session.message
  delete req.session.message

  req.user
    .populate('cart.items.productId')
    .then(user => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products,
        csrfToken: req.csrfToken(),
        message: message
      });
    })
    .catch(err => console.log(err));
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    });
};

exports.postCartDeleteProduct = (req, res, next) => {

  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      redirectWithUserMessage(req, res, 'Successfully deleted the product', '/cart')
    })
    .catch(err => console.log(err));
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => console.log(err));
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
        csrfToken: req.csrfToken()
      });
    })
    .catch(err => console.log(err));
};


exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId
  Order.findById(orderId)
    .then(order => {
      if (!order) {
        throw new Error('No Order Found')
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        throw new Error('Unauthorized')
      }
      const fileName = 'Invoice-' + orderId + '.pdf'
      const filePath = path.join('data', 'invoices', fileName)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`)

      const pdfDoc = new PDFDocument()
      pdfDoc.pipe(fs.createWriteStream(filePath)) // output to the local pdf file
      pdfDoc.pipe(res) // output to the sent pdf file

      //generating PDF
      pdfDoc.fontSize(26).text('Invoice', {
        underline: true
      })
      let totalSum = 0
      order.products.forEach(p => {
        totalSum += p.product.price * p.quantity
        pdfDoc.fontSize(16).text(`${p.product.title} - ${p.quantity} - $${p.product.price}`)
      })
      pdfDoc.fontSize(20).text('Total sum: $' + totalSum)

      pdfDoc.end()

      // fs.readFile(filePath, (err, data) => {
      //   if (err) {
      //     next(err)
      //   }
      //   res.setHeader('Content-Type', 'application/pdf')
      //   res.setHeader('Content-Disposition', `attachment; filename=${fileName}`)
      //   res.send(data)
      // })

      // const file = fs.createReadStream(filePath)
      // res.setHeader('Content-Type', 'application/pdf')
      // res.setHeader('Content-Disposition', `attachment; filename=${fileName}`)
      // file.pipe(res)
    })
    .catch(err => next(err))
};
