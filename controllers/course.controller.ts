import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import cloudinary from "cloudinary";
import { createContext } from "vm";
import {
  createCourse,
  getAllCoursesService,
} from "../services/course.services";
import CourseModel from "../models/course.model";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notification.model";
import axios from "axios";
import { IUser } from "../models/user.model";

// Extend the Request interface to include user property
interface CustomRequest extends Request {
  user?: IUser
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
      const courseId = req.params.id;
      const courseData = await CourseModel.findById(courseId) as any;

      if (thumbnail && !thumbnail.startsWith('https')) {
        await cloudinary.v2.uploader.destroy(courseData.thumbnail.public_id)
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      if(thumbnail.startsWith("https")){
        data.thumbnail = {
          public_id: courseData?.thumbnail.public_id,
          url: courseData?.thumbnail.url,
        }
      }
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
        await redis.set(courseId, JSON.stringify(course), "EX", 604800); // 604800 seconds means 7 days
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
      const courses = await CourseModel.find().select(
        "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
      );

      res.status(200).json({
        success: true,
        message: `Course data fetched successfully`,
        courses,
      });
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

      await NotificationModel.create({
        user: req.user,
        title: "New Question",
        message: `You have new Question in  a course: ${course?.name} and video name: ${courseContent.title} from ${req?.user?.name}`,
      });

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

export const addAnswer = CatchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, contentId, questionId }: IAddAnswerData =
        await req.body;
      // console.log("Request Body:", req.body)
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add answer to course content
      question.questionReplies?.push(newAnswer);

      await course?.save();
      // console.log(req.user);

      // Assert the type of req.user to include _id
      const userWithId = req.user as { _id?: string } | undefined;

      if (userWithId?._id === question.user._id) {
        await NotificationModel.create({
          user: req?.user,
          title: "New Question Replay Recieved",
          message: `You have new Question in  a course: ${course?.name} and video name: ${courseContent.title} from ${req?.user?.name}`,
        });
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

// Add review in course
interface IAddReviewData {
  review: string;
  courseId: string;
  rating: number;
  userId: string;
}

export const addReview = CatchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;
      // Check if ourse ID exists in user course list based on _id
      const courseExists = userCourseList?.some(
        (course: any) => course._id.toString() === courseId.toString()
      );

      if (!courseExists) {
        return next(
          new ErrorHandler(`You are not eligible to access this course`, 500)
        );
      }
      const course = await CourseModel.findById(courseId);

      const { review, rating } = req.body as IAddReviewData;

      const reviewData: any = {
        user: req.user,
        comment: review,
        rating,
      };
      course?.reviews.push(reviewData);
      let avg = 0;
      course?.reviews.forEach((rev: any) => {
        avg += rev.rating;
      });
      if (course) {
        course.ratings = avg / course?.reviews.length;
      }
      await course?.save();

      await redis.set(courseId, JSON.stringify(course), "EX", 604800)

      // console.log(req.user?.name)

      // const notification = {
      //   title: "New Review Recived",
      //   message: `${req.user?.name} has given review in ${course?.name} `,
      // };
      // Create a notification

      await NotificationModel.create({
        user: req.user,
        title: "New Review Recived",
        message: `${req.user?.name} has given review in course ${course?.name} `,
      });

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Replies to review array.

interface IAddReviewData {
  comment: string;
  courseId: string;
  reviewId: number;
}

export const addReplayReview = CatchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const { comment, courseId, reviewId } = req.body as IAddReviewData;
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler(`Course not found`, 404));
      }
      const review = course?.reviews?.find(
        (rev: any) => rev._id.toString() === reviewId
      );
      if (!review) {
        return next(new ErrorHandler(`Review not found`, 404));
      }

      const replayData: any = {
        user: req.user,
        comment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      // course.reviews?.commentReplies.push(replayData);
      if (!review.commentReplies) {
        review.commentReplies = [];
      }
      review.commentReplies?.push(replayData);
      
      await course.save();
      await redis.set(courseId, JSON.stringify(course), "EX", 604800)

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get all courses--Only for Admin
export const getAdminAllCourses = CatchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      getAllCoursesService(res);
    } catch (error:any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Delete course--Admin only

export const deleteCourse = CatchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = await req.params;
      const course = await CourseModel.findById(id);
      if (!course) {
        return next(new ErrorHandler(`Course not found`, 404));
      }
      await course.deleteOne({ id });
      await redis.del(id);
      res.status(200).json({
        status: "Course deleted successfully",
      });
    } catch (error:any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Generate video url

export const generateVideoUrl = CatchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const { videoId } = req.body;
      const response = await axios.post(
        `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
        { ttl: 300 },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET}`,
          },
        }
      );
      res.json(response.data);
    } catch (error:any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
