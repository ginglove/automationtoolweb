const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // ✅ Ensure userId is required
    items: [
        {
            id: String,
            title: String,
            price: Number,
            image: String,
            category: String
        }
    ],
    totalPrice: Number,
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;