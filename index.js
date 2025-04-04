require("dotenv").config();
const express = require("express");
const Razorpay = require("razorpay");
const bodyParser = require("body-parser");
const crypto = require("crypto");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));
app.set("view engine", "ejs");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Serve Payment Page
app.get("/", (req, res) => {
  res.render("index");
});

// Create Order
app.post("/order", async (req, res) => {
  try {
    console.log("Order request received with amount:", req.body.amount);

    const options = {
      amount: req.body.amount * 100, // Convert to paise
      currency: "INR",
      receipt: "receipt_" + new Date().getTime(),
    };

    const order = await razorpay.orders.create(options);
    console.log("Order Created:", order);
    res.json(order);
  } catch (error) {
    console.error("Order creation failed:", error);
    res.status(500).send("Error creating order");
  }
});

// Payment Verification
app.post("/verify", (req, res) => {
   console.log(req.body);
  try {
        console.log("Received Payment Data:", req.body); // Debugging

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            console.error("Missing payment details:", req.body);
            return res.status(400).json({ success: false, message: "Invalid payment data" });
        }

        const generated_signature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        console.log("Generated Signature:", generated_signature);
        console.log("Received Signature:", razorpay_signature);

        if (generated_signature === razorpay_signature) {
            console.log("Payment Verified Successfully!");
            res.json({ success: true, message: "Payment Verified" });
        } else {
            console.error("Signature Mismatch! Verification Failed.");
            res.status(400).json({ success: false, message: "Payment Verification Failed" });
        }
    } catch (error) {
        console.error("Payment Verification Error:", error);
        res.status(500).json({ error: "Verification Failed" });
    }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});