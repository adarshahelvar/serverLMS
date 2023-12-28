import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import cloudinary from "cloudinary";
import { createContext } from "vm";
import { createCourse } from "../services/course.services";
import CourseModel from "../models/course.model";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";

// Extend the Request interface to include user property
interface CustomRequest extends Request {
  user?: {
    courses: Array<{ _id: string }>; // Update this type according to your user model
  };
}

// Upload course
export const uploadCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;

      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      createCourse(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Edit Course Details
export const editCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;
      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      const courseId = req.params.id;
      const course = await CourseModel.findByIdAndUpdate(
        courseId,
        {
          $set: data,
        },
        { new: true }
      );
      res.status(201).json({
        success: true,
        message: "Course updated successfully",
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get single course-->Without purchasing

export const getSingleCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const isCacheExist = await redis.get(courseId);

      /* 
        What this if condition will do is if we are loading courses for first time it will skip the if condition because we dont have anything in cache data.
        But if we are loading courses for the second time then we get all data from cache only.
      */
      if (isCacheExist) {
        const course = JSON.parse(isCacheExist);
        res.status(200).json({
          success: true,
          message: `Course data fetched successfully from Cache `,
          course,
        });
      } else {
        const course = await CourseModel.findById(req.params.id).select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );
        await redis.set(courseId, JSON.stringify(course));
        res.status(200).json({
          success: true,
          message: `Course data fetched successfully`,
          course,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get all courses --> without Purchasing

export const getAllCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isCacheExist = await redis.get("allCourses");
      if (isCacheExist) {
        const course = JSON.parse(isCacheExist);
        res.status(200).json({
          success: true,
          message: `Course data fetched successfully from Cache `,
          course,
        });
      } else {
        const courses = await CourseModel.find().select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );
        await redis.set("allCorses", JSON.stringify(courses));
        res.status(200).json({
          success: true,
          message: `Course data fetched successfully`,
          courses,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get course content-- Only for valid user

export const getCourseByUser = CatchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      // console.log(userCourseList);
      const courseId = req.params.id;
      const courseExists = userCourseList?.find(
        (course: any) => course._id.toString() === courseId
      );
      if (!courseExists) {
        return next(
          new ErrorHandler(`You are not eligible to access this course`, 404)
        );
      }
      const course = await CourseModel.findById(courseId);
      const content = course?.courseData;
      res.status(200).json({
        success: true,
        content,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Add question in course
interface IAddQuestionData {
  question: string;
  courseId: string;
  contentId: string;
}

export const addQuestion = CatchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId }: IAddQuestionData =
        await req.body;
      const course = await CourseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return next(new ErrorHandler(`Invalid content ID`, 500));
      }

      const courseContentId = course?.courseData?.map((item) => item._id);

      const courseContent = course?.courseData?.find((item: any) =>
        courseContentId?.includes(item._id)
      );

      if (!courseContent) {
        return next(new ErrorHandler(`Invalid content ID`, 500));
      }

      // Create a new question object
      const newQuestion: any = {
        user: req.user,
        question,
        questionReplies: [],
      };

      // Add this question to course content
      courseContent.questions.push(newQuestion);

      // Save the updated course
      await course?.save();

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Add answer for course questioin
interface IAddAnswerData {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}


// export const addAnswer = CatchAsyncError(
//   async (req: CustomRequest, res: Response, next: NextFunction) => {
//     try {
//       const { answer, courseId, contentId, questionId }: IAddAnswerData =
//         await req.body;
//       const course = await CourseModel.findById(courseId);

//       if (!mongoose.Types.ObjectId.isValid(courseId)) {
//         return next(new ErrorHandler(`Invalid content ID`, 500));
//       }

//       const courseContentId = course?.courseData?.map((item) => item._id);

//       const courseContent = course?.courseData?.find((item: any) =>
//         courseContentId?.includes(item._id)
//       );

//       if (!courseContent) {
//         return next(new ErrorHandler(`Invalid content ID`, 500));
//       }

//       const question = courseContent?.questions?.find(
//         (item: any) => String(item.id) === String(questionId)
//       );

//       if (!question) {
//         return next(new ErrorHandler(`Invalid Question ID`, 500));
//       }

//       // Create new answer object
//       const newAnswer: any = {
//         user: req.user,
//         answer,
//       };

//       // Add answe to course content
//       question.questionReplies?.push(newAnswer);

//       await course?.save();
//       console.log(req.user)
//       if (req.user?._id === question.user._id) {
//         // Create a notification
//       } else {
//         const data = {
//           name: question.user.name,
//           title: courseContent.title,
//         };
//         const html = await ejs.renderFile(
//           path.join(__dirname, "../mails/question-replay.ejs"),
//           data
//         );

//         // console.log(html)
//         try {
//           await sendMail({
//             email: question.user.email,
//             subject: "Question Reply",
//             template: "question-replay.ejs",
//             data,
//           });
//         } catch (error: any) {
//           return next(new ErrorHandler(error.message, 500));
//         }
//       }
//       res.status(200).json({
//         success: true,
//         course,
//       });
//     } catch (error: any) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   }
// );

export const addAnswer = CatchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, contentId, questionId }: IAddAnswerData =
        await req.body;
      const course = await CourseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return next(new ErrorHandler(`Invalid content ID`, 500));
      }

      const courseContentId = course?.courseData?.map((item) => item._id);

      const courseContent = course?.courseData?.find((item: any) =>
        courseContentId?.includes(item._id)
      );

      if (!courseContent) {
        return next(new ErrorHandler(`Invalid content ID`, 500));
      }

      const question = courseContent?.questions?.find(
        (item: any) => String(item.id) === String(questionId)
      );

      if (!question) {
        return next(new ErrorHandler(`Invalid Question ID`, 500));
      }

      // Create new answer object
      const newAnswer: any = {
        user: req.user,
        answer,
      };

      // Add answer to course content
      question.questionReplies?.push(newAnswer);

      await course?.save();
      // console.log(req.user);

      // Assert the type of req.user to include _id
      const userWithId = req.user as { _id?: string } | undefined;

      if (userWithId?._id === question.user._id) {
        // Create a notification
      } else {
        const data = {
          name: question.user.name,
          title: courseContent.title,
        };
        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/question-replay.ejs"),
          data
        );

        // console.log(html)
        try {
          await sendMail({
            email: question.user.email,
            subject: "Question Reply",
            template: "question-replay.ejs",
            data,
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 500));
        }
      }

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

