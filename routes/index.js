const express = require('express');
const router= express.Router();
const userModel = require("./users");
const eventModel = require("./event")
const courseModel = require("./course");
const admissionModel = require("./admission");
const contactModel = require("./contact");

require('dotenv').config();
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
require('dotenv').config({path:"./.env"})



cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

router.get('/', function (req, res, next) {
  const successMessage = req.flash('success');
  const errorMessage = req.flash('error');
  res.render('index', { error: req.flash('error'), successMessage, errorMessage });
});

router.get('/about', function (req, res, next) {
  res.render('about', { error: req.flash('error') });
});

router.get('/course', function (req, res, next) {
  var course = courseModel.find({});
  res.render('course', { error: req.flash('error') , course });
});

router.get('/contact', function (req, res, next) {
  res.render('contact', { error: req.flash('error') });
});

router.get('/event', function (req, res, next) {
  var event = eventModel.find({});
  res.render('events', { error: req.flash('error'), event});
});

router.get('/dashboard',isLoggedIn, async function(req,res,next){
  const admission = await admissionModel.find({});
  const contact = await contactModel.find({});

  res.render("dashboard", {admission, contact})
});

router.post('/admission' ,async (req, res) => {
    const newAdmission = new admissionModel({
      studentName: req.body.name,
      studentEmail: req.body.email,
      studentNumber: req.body.number,
      state: req.body.studentstate,
      city: req.body.studentcity,
      courseName: req.body.course,
    });

    await newAdmission.save();
    req.flash('success', 'form submitted successfully');
    res.redirect('/');
});

router.post('/contactform' ,async (req, res) => {
  const newcontact = new contactModel({
    cName: req.body.cname,
    cEmail: req.body.cemail,
    subject: req.body.csubject,
    message: req.body.cmessage
  });

  await newcontact.save();
  req.flash('success', 'form submitted successfully');
  res.redirect('/contact');
});

router.post('/createCourse', isLoggedIn,async (req, res) => {
    const course = req.files.courseImage;
    cloudinary.uploader.upload(course.tempFilePath, async function (err, result) {
      if (err) return next(err);
      const newCourse = new courseModel({
        courseName: req.body.courseName,
        courseDescription: req.body.courseDescription,
        courseDuration: req.body.courseDuration,
        coursePrice: req.body.coursePrice,
        courseImage: result.secure_url,
        seatsAvailable: req.body.seatsAvailable,
      });
      await newCourse.save();
      req.flash('success', 'course created successfully');
      res.redirect('/manageCourse');
    })
});
router.get('/createCourse', isLoggedIn,(req, res) => {
  res.render('createCourse');
});
router.get('/createEvent', isLoggedIn,(req, res) => {
  res.render('createEvent');
});
router.post('/createEvent', isLoggedIn,async (req, res) => {
  const event = req.files.eventImage;
  cloudinary.uploader.upload(event.tempFilePath, async function (err, result) {
    if (err) return next(err);
    const newEvent = new eventModel({
      eventName: req.body.eventName,
      eventDescription: req.body.eventDescription,
      eventImage: result.secure_url,
    });
    await newEvent.save();
    req.flash('success', 'Event created successfully');
    res.redirect('/manageEvent');
  })
});
router.get('/manageEvent', isLoggedIn, async function (req, res, next) {
  try {
    const events = await eventModel.find({});

    // Pass flash messages to the template
    const successMessage = req.flash('success');
    const errorMessage = req.flash('error');

    res.render('manageEvent', { events, successMessage, errorMessage });
  } catch (error) {
    console.error("Error fetching event:", error);
    req.flash('error', 'Failed to fetch event data');
    res.redirect('/dashboard'); // Redirect to a suitable page in case of error
  }
});
router.get('/manageCourse', isLoggedIn, async function (req, res, next) {
  try {
    const courses = await courseModel.find({});

    // Pass flash messages to the template
    const successMessage = req.flash('success');
    const errorMessage = req.flash('error');

    res.render('manageCourse', { courses, successMessage, errorMessage });
  } catch (error) {
    console.error("Error fetching course:", error);
    req.flash('error', 'Failed to fetch course data');
    res.redirect('/dashboard'); // Redirect to a suitable page in case of error
  }
});

router.get('/editCourse/:id', isLoggedIn, async function (req, res, next) {
  const course = await courseModel.findById(req.params.id);
  res.render('editCourse', { course });
});

router.post('/editCourse/:id', isLoggedIn, async function (req, res, next) {
  try {
    const course = await courseModel.findByIdAndUpdate(req.params.id, {
      courseName: req.body.courseName,
      courseDescription: req.body.courseDescription,
      courseDuration : req.body.courseDuration,
      coursePrice: req.body.coursePrice,
      seatsAvailable:req.body.seatsAvailable
    }, { new: true });
    await course.save();

    // Set flash message
    req.flash('success', 'Course details updated successfully');

    res.redirect('/manageCourse');
  } catch (error) {
    // Handle error appropriately
    console.error("Error updating product:", error);
    req.flash('error', 'Failed to update product details');
    res.redirect('/manageProducts');
  }
});

router.get('/deleteCourse/:id', isLoggedIn, async function (req, res, next) {
  try {
    const course = await courseModel.findById(req.params.id);

    // Delete the image from Cloudinary
    const imageURL = course.courseImage;
    const publicID = imageURL.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(publicID);

    // Delete the course from the database
    await courseModel.findByIdAndDelete(req.params.id);

    // Set flash message
    req.flash('success', 'Course deleted successfully');

    res.redirect('/manageCourse');
} catch (error) {
    console.error("Error deleting course:", error);
    req.flash('error', 'Failed to delete course');
    res.redirect('/manageCourse');
}
});

router.get('/editEvent/:id', isLoggedIn, async function (req, res, next) {
  const event = await eventModel.findById(req.params.id);
  res.render('editEvent', { event });
});

router.post('/editEvent/:id', isLoggedIn, async function (req, res, next) {
  try {
    const event = await eventModel.findByIdAndUpdate(req.params.id, {
      eventeName: req.body.eventeName,
      eventeDescription: req.body.eventeDescription,
     
    }, { new: true });
    await event.save();

    // Set flash message
    req.flash('success', 'Event details updated successfully');

    res.redirect('/manageEvent');
  } catch (error) {
    // Handle error appropriately
    console.error("Error updating product:", error);
    req.flash('error', 'Failed to update product details');
    res.redirect('/manageProducts');
  }
});

router.get('/deleteEvent/:id', isLoggedIn, async function (req, res, next) {
  try {
    const event = await eventModel.findById(req.params.id);

    // Delete the image from Cloudinary
    const imageURL = event.eventImage;
    const publicID = imageURL.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(publicID);

    // Delete the event from the database
    await eventModel.findByIdAndDelete(req.params.id);

    // Set flash message
    req.flash('success', 'Event deleted successfully');

    res.redirect('/manageEvent');
} catch (error) {
    console.error("Error deleting event:", error);
    req.flash('error', 'Failed to delete event');
    res.redirect('/manageEvent');
}
});

// auth routes 
router.get('/login', async function (req, res, next) {
  try {
    res.render('login', {error: req.flash('error') });
  } catch (error) {
    console.error('Error occurred while fetching data:', error);
    next(error);
  }
});

router.post('/login', async function (req, res, next) {
  try {
    const { email, password } = req.body;
    const userExist = await userModel.findOne({ email });
    if (!userExist) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/login');
    }

    const user = await userExist.comparePassword(password);

    if (user) {
        // Check if the user's role is 'admin'
        if (userExist.role === 'admin') {
          const token = await userExist.generateToken();
          res.cookie('token', token, { httpOnly: true }); // Set token as a cookie
          res.redirect('/dashboard');
        } else {
          // If the user's role is not 'admin', redirect to the '/' page
          res.redirect('/');
        }
    } else {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/login');
    }
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while login' });
  };

});

router.get('/admissiondetails', function(req,res){
  res.render("admissionform")
});
  
router.get('/register', function (req, res, next) {
  res.render('register', { error: req.flash('error') });
});
  
router.post('/register',async function(req,res,next){
    try{
      if ( !req.body.username || !req.body.email || !req.body.password) {
        req.flash('error', 'All fields are required');
        return res.redirect('/login');
      }

      const { username,password, email } = req.body;
      const existingUserEmail = await userModel.findOne({ email });
      if (existingUserEmail) {
        req.flash('error', 'This Email already exists');
        return res.redirect('/register');
      }
      const data = await userModel.create({ username,email, password })
      const token = await data.generateToken();
      res.cookie('token', token, { httpOnly: true }); // Set token as a cookie
      res.redirect('/dashboard'); // Redirect to / page
    }
    catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while registering the user' });
    };
  
  });

  router.get('/logout', (req, res) => {
    try {
      res.clearCookie('token');
      res.redirect('/login');
    } catch (err) {
      console.error("Error during logout:", err);
      res.status(500).send('Internal Server Error');
    }
  });
  
  
  function isLoggedIn(req, res, next) {
    const token = req.cookies.token;
  
    if (token == null) return res.redirect('/login');
  
    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, user) => {
      if (err) {
        return res.redirect('/login');
      }
      const userRole = await userModel.findById(user._id);
      if (userRole.role != 'admin') {
        return res.redirect('/login');
    } else {
      req.user = user;
      next();
    }
    });
  }


module.exports = router;
