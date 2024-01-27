import { Request, Response, NextFunction } from "express";
import CourseModel from "../models/course.model";
import { CatchAsyncError } from "../middleware/catchAsyncError";

// Create a new Course
export const createCourse = CatchAsyncError(async (data:any, res: Response) => {
    try {
        const course = await CourseModel.create(data);

        res.status(201).json({
            success: true,
            message: "Course created successfully",
            course,
        });
    } catch (error:any) {
        res.status(500).json({
            success: false,
            message: "Failed to create course",
            error: error.message,
        });
    }
});

// Get all Courses
export const getAllCoursesService = async (res: Response) => {
    const courses = await CourseModel.find().sort({ createdAt: -1 });
    res.status(201).json({
      success: true,
      courses,
    });
  };
