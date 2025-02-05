const mongoose = require('mongoose');

const CaseDetailsSchema = new mongoose.Schema({
    courtregistrar_id: {
        type: Object,
        required: true
    },
    isResolved: {
        type: String,
        default: "N"
    },
    lawyer_id: {
        type: Object
    },
    isLawyerAssigned: {
        type: String,
        default: "Y"
    },
    isCaseAccepted: {
        type: String,
        default: "TBD"
    },
    court_case_no: {
        type: String
    },
    case_type: {
        type: String
    },
    case_name: {
        type: String,
        required: true
    },
    case_descp: {
        type: String,
        required: true
    },
    court_type: {
        type: String
    },
    h_date: {
        type: Date
    },
    result: {
        type: String
    },
    start_date_of_hearing: {
        type: Date
    },
    end_date_of_hearing: {
        type: Date
    },
    case_hearings: [
        {
            date: {
                type: Date,
                required: true
            },
            details: {
                type: String
            }
        }
    ]
});

const CaseDetails = mongoose.model('CaseDetails', CaseDetailsSchema);

module.exports = CaseDetails;
