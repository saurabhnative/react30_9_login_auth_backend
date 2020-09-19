const router = require('express').Router();
const User = require('../model/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const verify = require('./verifyToken')

const { registerValidation, loginValidation } = require('../validation');

// Registration Routes
router.post('/register', async (req, res) => {
    //Validate data before making user
    const validation = registerValidation(req.body);
    if (validation.error) {
        return res.status(400).send(validation.error.details[0].message);
    }

    //Checking if the user is already in the database
    const emailExist = await User.findOne({ email: req.body.email });
    if (emailExist) return res.status(400).send('Email already exists');

    //Hash passwords
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    //Create a new user
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword
    });
    try {
        const savedUser = await user.save();
        res.send({ 'user': user._id });
    } catch (e) {
        res.status(400).send(err)
    }
});

//Login routes
router.post('/login', async (req, res) => {
    //Validate data before making user
    const validation = loginValidation(req.body);
    if (validation.error) {
        return res.status(400).send(validation.error.details[0].message);
    }

    //Checking if the email already exists
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send('Email not found');

    // Check password is correct
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if(!validPass) return res.status(400).send('Password is wrong');

    //Create and assign token
    const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET)
    res.header('auth-token', token).send({"token":token});
})

router.get("/me", verify, async (req, res) => {
    try {
      // request.user is getting fetched from Middleware after token authentication
      const user = await User.findById(req.user._id);
      res.json({"response": "success"});
    } catch (e) {
      res.send({ message: "Error in Fetching user" });
    }
});

module.exports = router;