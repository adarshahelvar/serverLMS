"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCoursesService = exports.createCourse = void 0;
const course_model_1 = __importDefault(require("../models/course.model"));
const catchAsyncError_1 = require("../middleware/catchAsyncError");
// Create a new Course
exports.createCourse = (0, catchAsyncError_1.CatchAsyncError)(async (data, res) => {
    try {
        const course = await course_model_1.default.create(data);
        res.status(201).json({
            success: true,
            message: "Course created successfully",
            course,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create course",
            error: error.message,
        });
    }
});
// Get all Courses
const getAllCoursesService = async (res) => {
    const courses = await course_model_1.default.find().sort({ createdAt: -1 });
    res.status(201).json({
        success: true,
        courses,
    });
};
exports.getAllCoursesService = getAllCoursesService;
