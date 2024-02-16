var express = require('express');
var router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/data.db');

/********************************************
 * Configuration
 */

// Configure passport to enable username/password authentication
passport.use(new LocalStrategy(
  function(username, password, done) {
    db.get('SELECT id, username, password FROM users WHERE username = ? AND password = ?', [username, password], 
    function(err, row) {
      if (err) {
        return done(err); 
      }
      if (!row) {
        return done(null, false, { message: 'Incorrect username or password.' });
      }
      return done(null, row);
    });
  }
));

// Configure passport to store user information in the session
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

// Configure passport to retrieve user information for a session from the database
passport.deserializeUser(function(id, done) {
  db.get('SELECT id, username FROM users WHERE id = ?', [id], function(err, row) {
    if (!row) {
      done(null, false);
    }
    done(null, row);
  });
});

/**
 * This function can be used as 'middleware' on any route that requires the user to be logged in
 */
function ensureAuthenticated(req, res, next) {
  // Passport adds the isAuthenticated method to the request object
  // It returns true if the user is logged in
  // Here we are using it to check if the user is logged in
  if (req.isAuthenticated()) {
    return next();  // The user is logged in, so continue to the next middleware function
  }
  // The user is not logged in, so redirect to the login page
  res.redirect('/login');
}

/***************************************************
 * Routes
 */

/*

  The router object has methods for each HTTP verb (get, post, put, delete, etc.)
  Each of these methods takes a URL path and a callback function which will be called 
  when a request is made to the URL path.
  The callback function takes three arguments: req, res, and next.
  req is an object that represents the HTTP request (plus some extra stuff added by express and middleware functions)
  res is an object that represents the HTTP response
  next is a function that can be called to pass control to the next middleware function

*/

/* GET home page. */
router.get('/', function(req, res, next) {

  const data = {
    title: 'My Full-stack app',
    user: req.user
  }
  // The render method on request objects is used to render a template as HTML
  // The first argument is the name of a file in the /views folder (without the file extension)
  // The second argument is an object containing data to be passed to the template
  res.render('index', data);
});

router.get('/posts', function(req, res, next) {

  // Here, we are retrieving all the posts from the database and passing them to the template
  db.all('SELECT posts.id, posts.title FROM posts ORDER BY posts.created_at DESC', function(err, rows) {
    if (err) { return next(err); }

    // The data the template will need
    const data = {
      title: 'Posts',
      user: req.user,
      posts: rows
    }
    // Render the template with the data
    res.render('posts', data);
  })
});

// This is an example of an authenticated route
// The ensureAuthenticated function is used as middleware to check if the user is logged in
// If the user is not logged in, they will be redirected to the login page
router.get('/posts/new', ensureAuthenticated, function(req, res, next) {
  const data = {
    title: 'New Post',
    user: req.user
  }
  res.render('post-new', data);
});

router.post('/posts/new', ensureAuthenticated, function(req, res, next) {
  const title = req.body.title;
  const content = req.body.content;
  const user_id = req.user.id;
  db.run('INSERT INTO posts (title, content, user_id) VALUES (?, ?, ?)', [title, content, user_id], function(err) {
    if (err) {
      next(err);
    } else {
      res.redirect('/posts');
    }
  });
});

router.get('/posts/:id', function(req, res, next) {
  const id = req.params.id;

  db.get('SELECT posts.id, posts.title, posts.content, posts.created_at, users.username FROM posts JOIN users ON posts.user_id = users.id WHERE posts.id = ?', [id], function(err, row) {
    if (err) { return next(err); }
    if (!row) {
      res.status(404);
      res.send('Post not found');
    } else {
      const data = {
        title: row.title,
        user: req.user,
        post: row
      }
      res.render('post', data);
    }
  });
})


router.get('/users/:id', ensureAuthenticated, function(req, res, next) {
  const id = req.params.id;

  db.get('SELECT id, username, email FROM users WHERE id = ?', [id], function(err, row) {
    if (err) { return next(err); }
    if (!row) {
      res.status(404);
      res.send('User not found');
    } else if (req.user.id !== row.id && req.user.username !== 'admin') {
      // Only allow user to see their own profile (but allow admin to see any profile)
      res.status(403);
      res.send('You are not authorized to view this page');
    } else {
      res.render('profile', { title: 'Profile', user: row });
    }
  });
});


/************************************
 * Authentication routes
 */

router.get('/register', function(req, res, next) {
  res.render('register', { title: 'Register' });
});

router.post('/register', function(req, res, next) {
  const username = req.body.username;
  const password = req.body.password;
  const email = req.body.email;
  // WARNING: This stores the password in plain text. DO NOT DO THIS IN A REAL APP
  db.run('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, password, email], function(err) {
    if (err) {
      next(err);
    } else {
      res.redirect('/login');
    }
  });
});

router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Login' });
})

router.post('/login', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login' }));

router.get('/logout', function(req, res, next) {
  req.logout(err => { if (err) { next(err); } });
  res.redirect('/');
});

module.exports = router;
