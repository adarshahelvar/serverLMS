import express from "express";
import {
  activateUser,
  deleteUser,
  getAllUsers,
  getUserInfo,
  loginUser,
  logoutUser,
  registrationUser,
  socialAuth,
  updateAccessToken,
  updatePassword,
  updateProfilePicture,
  updateUserInfo,
  updateUserRole,
} from "../controllers/user.controller";
import { authorizationRoles, isAuthenticated } from "../middleware/auth";

const userRouter = express.Router();
userRouter.post("/registration", registrationUser);
userRouter.post("/activate-user", activateUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", isAuthenticated, logoutUser);
userRouter.get("/refresh", updateAccessToken);
userRouter.get("/me",updateAccessToken , isAuthenticated, getUserInfo);
userRouter.post("/social-auth", socialAuth);
userRouter.put("/update-user-info",updateAccessToken, isAuthenticated, updateUserInfo);
userRouter.put("/update-user-password",updateAccessToken, isAuthenticated, updatePassword);
userRouter.put("/update-user-avatar",updateAccessToken, isAuthenticated, updateProfilePicture);
userRouter.get("/get-users",updateAccessToken,isAuthenticated,authorizationRoles("admin"),getAllUsers);
userRouter.put("/update-user",updateAccessToken, isAuthenticated,authorizationRoles("admin"),updateUserRole);
userRouter.delete("/delete-user/:id", updateAccessToken, isAuthenticated,authorizationRoles("admin"),deleteUser);

export default userRouter;
