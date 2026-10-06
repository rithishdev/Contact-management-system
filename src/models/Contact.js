const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
    {
        contactId: {
            type: String,
            required: [true, "Contact ID is required"],
            unique: true,
            trim: true
        },

        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true
        },

        phone: {
            type: String,
            required: [true, "Phone number is required"],
            match: [
                /^[0-9]{10}$/,
                "Phone number must contain exactly 10 digits"
            ],
            trim: true
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            trim: true,
            lowercase: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                "Please enter a valid email address"
            ]
        }
    },
    {
        timestamps: true
    }
);

const Contact = mongoose.model("Contact", contactSchema);

module.exports = Contact;