const mongoose = require("mongoose");

// ✅ Course Schema & Model
const CourseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true }, // URL of the course image
    category: {type: String, required: true}
});
const Course = mongoose.model("Course", CourseSchema);
module.exports = Course;