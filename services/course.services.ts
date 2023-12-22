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
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to create course",
            error: error.message,
        });
    }
});
