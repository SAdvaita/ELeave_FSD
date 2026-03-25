import mongoose from "mongoose";

const holidaySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Holiday name is required"],
        trim: true
    },
    date: {
        type: Date,
        required: [true, "Holiday date is required"]
    },
    type: {
        type: String,
        enum: ['national', 'regional', 'optional', 'company'],
        default: 'national'
    },
    description: {
        type: String,
        default: ''
    },
    isRecurring: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

const Holiday = mongoose.model("Holiday", holidaySchema);

export default Holiday;
