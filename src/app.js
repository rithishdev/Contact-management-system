const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load .env from project root
dotenv.config({
    path: path.join(__dirname, "../.env")
});

// Import model
const Contact = require("./models/Contact");

// Create Express app
const app = express();

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve index.html and other files from src
app.use(express.static(__dirname));

// ======================================================
// MONGODB CONNECTION
// ======================================================

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("ERROR: MONGO_URI is missing in .env");
} else {
    mongoose
        .connect(MONGO_URI, {
            dbName: "contact_management"
        })
        .then(() => {
            console.log("MongoDB connected successfully");
            console.log("Database: contact_management");
        })
        .catch((error) => {
            console.error("MongoDB connection failed:");
            console.error(error.message);
        });
}

// ======================================================
// HOME PAGE
// ======================================================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// ======================================================
// API STATUS
// ======================================================

app.get("/api/status", (req, res) => {
    const isConnected = mongoose.connection.readyState === 1;

    res.status(200).json({
        status: "success",
        message: "Contact Management System is running",
        database: "contact_management",
        mongodb: isConnected ? "Connected" : "Not Connected"
    });
});

// ======================================================
// CREATE CONTACT
// POST /contacts
// ======================================================

app.post("/contacts", async (req, res) => {
    try {
        const {
            contactId,
            name,
            phone,
            email
        } = req.body;

        // Required fields
        if (!contactId || !name || !phone || !email) {
            return res.status(400).json({
                message: "All fields are required",
                requiredFields: [
                    "contactId",
                    "name",
                    "phone",
                    "email"
                ]
            });
        }

        // Phone validation
        if (!/^[0-9]{10}$/.test(phone)) {
            return res.status(400).json({
                message: "Phone number must contain exactly 10 digits"
            });
        }

        // Email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                message: "Invalid email format"
            });
        }

        // Duplicate contact ID
        const existingContact = await Contact.findOne({
            contactId: contactId
        });

        if (existingContact) {
            return res.status(409).json({
                message: "Contact ID already exists"
            });
        }

        // Duplicate email
        const existingEmail = await Contact.findOne({
            email: email.toLowerCase()
        });

        if (existingEmail) {
            return res.status(409).json({
                message: "Email already exists"
            });
        }

        // Create contact
        const contact = new Contact({
            contactId: contactId.trim(),
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim().toLowerCase()
        });

        const savedContact = await contact.save();

        res.status(201).json({
            message: "Contact created successfully",
            contact: savedContact
        });

    } catch (error) {
        console.error("Create contact error:", error.message);

        res.status(500).json({
            message: "Failed to create contact",
            error: error.message
        });
    }
});

// ======================================================
// GET ALL CONTACTS
// GET /contacts
// ======================================================

app.get("/contacts", async (req, res) => {
    try {
        const contacts = await Contact.find();

        res.status(200).json(contacts);

    } catch (error) {
        console.error("Get contacts error:", error.message);

        res.status(500).json({
            message: "Failed to fetch contacts",
            error: error.message
        });
    }
});

// ======================================================
// GET CONTACT BY MONGODB ID
// GET /contacts/:id
// ======================================================

app.get("/contacts/:id", async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid MongoDB ID"
            });
        }

        const contact = await Contact.findById(id);

        if (!contact) {
            return res.status(404).json({
                message: "Contact not found"
            });
        }

        res.status(200).json(contact);

    } catch (error) {
        console.error("Get contact error:", error.message);

        res.status(500).json({
            message: "Failed to fetch contact",
            error: error.message
        });
    }
});

// ======================================================
// UPDATE CONTACT
// PUT /contacts/:id
// ======================================================

app.put("/contacts/:id", async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid MongoDB ID"
            });
        }

        const {
            phone,
            email
        } = req.body;

        // Phone validation
        if (phone && !/^[0-9]{10}$/.test(phone)) {
            return res.status(400).json({
                message: "Phone number must contain exactly 10 digits"
            });
        }

        // Email validation
        if (
            email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            return res.status(400).json({
                message: "Invalid email format"
            });
        }

        // Duplicate contact ID
        if (req.body.contactId) {
            const duplicateContactId = await Contact.findOne({
                contactId: req.body.contactId,
                _id: { $ne: id }
            });

            if (duplicateContactId) {
                return res.status(409).json({
                    message: "Contact ID already exists"
                });
            }
        }

        // Duplicate email
        if (email) {
            const duplicateEmail = await Contact.findOne({
                email: email.toLowerCase(),
                _id: { $ne: id }
            });

            if (duplicateEmail) {
                return res.status(409).json({
                    message: "Email already exists"
                });
            }
        }

        // Prepare update
        const updateData = { ...req.body };

        if (updateData.email) {
            updateData.email =
                updateData.email.trim().toLowerCase();
        }

        if (updateData.contactId) {
            updateData.contactId =
                updateData.contactId.trim();
        }

        if (updateData.name) {
            updateData.name =
                updateData.name.trim();
        }

        if (updateData.phone) {
            updateData.phone =
                updateData.phone.trim();
        }

        const contact = await Contact.findByIdAndUpdate(
            id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!contact) {
            return res.status(404).json({
                message: "Contact not found"
            });
        }

        res.status(200).json({
            message: "Contact updated successfully",
            contact: contact
        });

    } catch (error) {
        console.error("Update contact error:", error.message);

        res.status(400).json({
            message: "Failed to update contact",
            error: error.message
        });
    }
});

// ======================================================
// DELETE CONTACT
// DELETE /contacts/:id
// ======================================================

app.delete("/contacts/:id", async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid MongoDB ID"
            });
        }

        const contact =
            await Contact.findByIdAndDelete(id);

        if (!contact) {
            return res.status(404).json({
                message: "Contact not found"
            });
        }

        res.status(200).json({
            message: "Contact deleted successfully",
            deletedContact: contact
        });

    } catch (error) {
        console.error("Delete contact error:", error.message);

        res.status(500).json({
            message: "Failed to delete contact",
            error: error.message
        });
    }
});

// ======================================================
// 404 HANDLER
// ======================================================

app.use((req, res) => {
    res.status(404).json({
        message: "Route not found",
        path: req.originalUrl
    });
});

// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use((error, req, res, next) => {
    console.error("Unexpected server error:", error);

    res.status(500).json({
        message: "Internal server error",
        error: error.message
    });
});

// ======================================================
// START SERVER
// ======================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log("==========================================");
    console.log("   CONTACT MANAGEMENT SYSTEM");
    console.log("==========================================");
    console.log(`Server running on port ${PORT}`);
    console.log("Database: contact_management");
    console.log("==========================================");
});