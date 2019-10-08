const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator'); 

const User = require('../models/user');

exports.getLogin = (req, res, next) => {
	
	let message = req.flash('error');
	if (message.length > 0) {
		message = message[0];
	} else {
		message = null;
	}
	
	res.render('auth/login', {
		path: '/',
		pageTitle: 'Login',
		errorMessage: message,
		oldInput: {
			name: '',
			password: ''
		},
		validationErrors: []
	});
};

exports.getSignup = (req, res, next) => {
	
	let message = req.flash('error');
	
	if (message.length > 0) {
		message = message[0];
	} else {
		message = null;
	}
	res.render('auth/signup', {
		path: '/signup',
		pageTitle: 'Signup',
		errorMessage: message,
		oldInput: {
			email: '',
			password: ''
		},
		validationErrors: []
	});
	
};

exports.postLogin = (req, res, next) => {
	
	const name = req.body.name;
	const password = req.body.password;
	
	const errors = validationResult(req);
  
	if (!errors.isEmpty()) {
		return res.status(422).render('auth/login', {
			path: '/',
			pageTitle: 'Login',
			errorMessage: errors.array()[0].msg,
			oldInput: {
				name: name,
				password: password
			},
			validationErrors: errors.array()
		});
	}

	User.findOne({ name: name })
		.then(user => {
			if (!user) {
				return res.status(422).render('auth/login', {
					path: '/',
					pageTitle: 'Login',
					errorMessage: 'Invalid name or password.',
					oldInput: {
						name: name,
						password: password
					},
					validationErrors: []
				});
			}
		
		bcrypt
			.compare(password, user.password)
			.then(doMatch => {
				if (doMatch) {
					req.session.isLoggedIn = true;
					req.session.user = user;
					return req.session.save(err => {
						console.log(err);
						res.redirect('/admin/accounts');
					});
				}
			
			return res.status(422).render('auth/login', {
				path: '/',
				pageTitle: 'Login',
				errorMessage: 'Invalid name or password.',
				oldInput: {
					name: name,
					password: password
				},
				validationErrors: []
			});
        })
		
        .catch(err => {
			console.log(err);
			res.redirect('/');
        });
    })
    .catch(err => {
		const error = new Error(err);
		error.httpStatusCode = 500;
		return next(error);
	});
};


exports.postSignup = (req, res, next) => {
	
	const name = req.body.name;
	const password = req.body.password;
	
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).render('auth/signup', {
			path: '/signup',
			pageTitle: 'Signup',
			errorMessage: errors.array()[0].msg,
			oldInput: { 
				name: name, 
				password: password, 
			},
			validationErrors: errors.array()
		});
	}
	
	bcrypt
		.hash(password, 12)
		.then(hashedPassword => {
			const user = new User({
				name: name,
				password: hashedPassword
			});
			return user.save();
		})
		.then(result =>{
			res.redirect('/');
		})
		.catch(err => {
		const error = new Error(err);
	  error.httpStatusCode = 500;
	  return next(error);
	});
};

exports.postLogout = (req, res, next) => {
	req.session.destroy(err => {
		console.log(err);
		res.redirect('/');
	});
};
