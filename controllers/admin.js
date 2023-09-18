const { validationResult } = require('express-validator');
const Product = require('../models/product');
const redirectWithUserMessage = require('../util/redirect-with-user-message');

const FileHelper = require('../util/file')

exports.getAddProduct = (req, res, next) => {
  const errorMessage = req.session.message
  delete req.session.message


  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    csrfToken: req.session.csrfToken ?? req.csrfToken(),
    errorMessage
  });
};


exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;

  const price = req.body.price;
  const description = req.body.description;
  req.session.csrfToken = req.body._crsf
  const image = req.file

  if (!image) {
    return redirectWithUserMessage(req, res, 'Image type is invalid', '/admin/add-product', 422)
  }
  const imageUrl = '/' + image.path
  console.log(imageUrl);

  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user
  });
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return redirectWithUserMessage(req, res, errors.array()[0].msg, '/admin/add-product', 422)
  }
  product
    .save()
    .then(result => {
      res.redirect('/admin/products');
    })
    .catch(err => {
      console.log(err);
      const error = new Error(err)
      error.httpStatusCode = 500
      next(error)
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        csrfToken: req.csrfToken(),
        errorMessage: ''
      });
    })
    .catch(err => {
      console.log(err);
      const error = new Error(err)
      error.httpStatusCode = 500
      next(error)
    });
};

exports.postEditProduct = async (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedDesc = req.body.description;
  const image = req.file

  try {
    if (image) {
      const product = await Product.findById(prodId)
      if (!product) {
        throw new Error('Product not found')
      }
      FileHelper.deleteFile(product.imageUrl)
      await Product.updateOne({ _id: prodId, userId: req.user._id },
        { $set: { title: updatedTitle, price: updatedPrice, description: updatedDesc, imageUrl: '/' + image.path } })
    } else {
      await Product.updateOne({ _id: prodId, userId: req.user._id },
        { $set: { title: updatedTitle, price: updatedPrice, description: updatedDesc } })
    }

    res.redirect('/admin/products')
  } catch (error) {
    console.log(error)
  }
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id }) // retrieve only user's products
    .then(products => {
      console.log(products);
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
        csrfToken: req.session.csrfToken ?? req.csrfToken()
      });
    })
    .catch(err => console.log(err));
};

exports.deleteProduct = async (req, res, next) => {
  const prodId = req.params.productId;

  try {
    const product = await Product.findById(prodId)
    if (!product) {
      throw new Error('Product not found')
    }
    FileHelper.deleteFile(product.imageUrl)
    await Product.deleteOne({ _id: prodId, userId: req.user._id })
    res.status(200).json({ message: 'Success!' })
  } catch (error) {
    console.log(error)
  }
};
