const { ObjectId } = require('mongodb');
const express = require('express');
const router = express.Router();

// Include auth fn
const { ensureAuthenticated } = require('../config/auth');

// Include model
const CaseDetails = require('../models/CaseDetails');

// Dashboard to display all cases
router.get(
    '/dashboard',
     ensureAuthenticated,
      async (req, res) => {
    try {
        const cases = await CaseDetails.find();
        res.render('judge_dashboard', { f_name: req.user.fname, cases });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
