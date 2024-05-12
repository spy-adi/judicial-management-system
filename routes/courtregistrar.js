const {ObjectId} = require('mongodb');
const express = require('express');
const router = express.Router();

//include auth fn
const {ensureAuthenticated} = require('../config/auth');

//include model
const CaseDetails = require('../models/CaseDetails');
const User = require('../models/User');

//dashboard
router.get
(
    '/dashboard',
    ensureAuthenticated,
    async (req, res) =>
    {
        await CaseDetails.find
        (
            {
                courtregistrar_id: ObjectId(req.user.id)
            }
        ).then
        (
            (cases) =>
            {
                res.render('courtregistrar_dashboard', {f_name: req.user.fname, cases});
            }
        ).catch
        (
            (err) => console.log(err)
        );        
    }
);

//case details
router.get
(
    '/display_case_details/:case_id',
    ensureAuthenticated,
    async (req, res) =>
    {
        await CaseDetails.find
        (
            {
                _id: ObjectId(req.params.case_id)
            }
        ).then
        (
            (case_details) =>
            {
                const user_type = req.user.personType;
                const {_id, case_name, case_type, case_descp, lawyer_id, court_case_no, court_type, h_date} = case_details[0];

                res.render('display_case_details', {_id, user_type, case_name, case_type, case_descp, lawyer_id, court_case_no, court_type, h_date});
            }
        ).catch
        (
            (err) => console.log(err)
        );
    }
);

//add case pg 1
router.get
(
    '/add_case_pg1',
    ensureAuthenticated,
    (req, res) =>
    {
        res.render('add_case_pg1');
    }
);
router.post
(
    '/add_case_pg1',
    ensureAuthenticated,
    async (req, res) =>
    {
        const new_case_details = new CaseDetails
        (
            {
                courtregistrar_id: req.user._id,
                case_name: req.body.case_name,
                case_type: req.body.case_type,
                case_descp: req.body.case_descp,
                start_date_of_hearing: new Date()
            }
        );

        await new_case_details.save().then
        (
            (new_case_obj) =>
            {
                req.flash('case_id', new_case_obj._id);
                res.redirect('/courtregistrar/add_case_pg2');
            }
        ).catch
        (
            (err) => console.log(err)
        );
    }
);

//add case pg 2
router.get
(
    '/add_case_pg2',
    ensureAuthenticated,
    async (req, res) =>
    {
        await User.find
        (
            {
                personType: 'l'
            }
        ).then
        (
            (lawyers) =>
            {
                res.render('add_case_pg2', {lawyers});
            }
        ).catch
        (
            (err) => console.log(err)
        );        
    }
);
router.post
(
    '/add_case_pg2',
    ensureAuthenticated,
    async (req, res) =>
    {
        const case_id = req.flash('case_id')[0]
        req.flash('caseId', case_id);

        await CaseDetails.updateOne
        (
            {
                _id: case_id
            },
            {
                $set: {
                    lawyer_id: ObjectId(req.body.lawyer_id)
                }
            }
        ).then
        (
            res.redirect('/courtregistrar/add_case_pg3')
        ).catch
        (
            (err) => console.log(err)
        );
    }
);

//add case pg 3
router.get
(
    '/add_case_pg3',
    ensureAuthenticated,
    (req, res) =>
    {
        res.render('add_case_pg3');
    }
);
router.post
(
    '/add_case_pg3',
    ensureAuthenticated,
    async (req, res) =>
    {
        const case_id = req.flash('caseId')[0];
        const date = new Date(req.body.h_date);
        const currentDate = new Date();

        if (date < currentDate) {
            // If the selected date is less than the current date, render the page again with an error message
            return res.render('add_case_pg3', { errorMessage: "Date cannot be less than today's date. Please select a valid date." });
        }

        await CaseDetails.updateMany
        (
            {
                _id: case_id
            },
            {
                $set: {
                    court_type: req.body.court_type,
                    court_case_no: req.body.court_case_no,
                    h_date: date
                }
            }
        ).then
        (
            res.redirect('/courtregistrar/dashboard')
        ).catch
        (
            (err) => console.log(err)
        );
    }
);

//update case
router.get
(
    '/update_case/:case_id',
    ensureAuthenticated,
    async (req, res) =>
    {
        await CaseDetails.find
        (
            {
                _id: ObjectId(req.params.case_id)
            }
        ).then
        (
            (case_details) =>
            {
                const user_type = req.user.personType;
                const {case_name, case_descp, court_case_no, h_date} = case_details[0];

                res.render('update_case', {case_name, case_descp, court_case_no, h_date});
            }
        ).catch
        (
            (err) => console.log(err)
        );
    }
);
router.post('/update_case/:case_id', ensureAuthenticated, async (req, res) => {
    try {
        const { hearing_date, hearing_outcome, is_final_hearing, next_hearing_date, final_judgement } = req.body;
        const caseId = req.params.case_id;

        // Define the update criteria
        const filter = { _id: caseId };

        // Define the update operations based on the provided data
        const updateOperations = {};

        if (next_hearing_date) {
            updateOperations.h_date = next_hearing_date;
        }

        if (is_final_hearing === 'y' && final_judgement) {
            updateOperations.result = final_judgement;
            updateOperations.isResolved = "Y";
        }

        if (hearing_date && hearing_outcome) {
            const newHearing = {
                date: hearing_date,
                details: hearing_outcome
            };

            // Push the new hearing into the case_hearings array
            updateOperations.$push = { case_hearings: newHearing };
        }

        // Update the matching documents with the provided operations
        await CaseDetails.updateMany(filter, { $set: updateOperations });

        // Redirect to courtregistrar/dashboard
        res.redirect('/courtregistrar/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});



// API endpoint to delete a case
router.get(
    '/delete_case/:case_id', 
    ensureAuthenticated, 
    async (req, res) => {
        try {
            const deletedCase = await CaseDetails.findByIdAndDelete(req.params.case_id);
            if (!deletedCase) {
                req.flash('error', 'Case not found');
                return res.redirect('/courtregistrar/dashboard');
            }
            // Flash message indicating successful deletion
            req.flash('success', 'Case deleted successfully');
            // Redirect to courtregistrar/dashboard page after deleting the case
            res.redirect('/courtregistrar/dashboard');
        } catch (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        }
});



module.exports = router;