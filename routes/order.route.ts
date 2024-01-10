import express from "express";
import { authorizationRoles, isAuthenticated } from "../middleware/auth";
import { createOrder, getAllOrders } from "../controllers/order.controller";
import { updateAccessToken } from "../controllers/user.controller";

const orderRouter = express.Router();

orderRouter.post('/create-order', updateAccessToken ,isAuthenticated, createOrder);
orderRouter.get('/get-orders',updateAccessToken, isAuthenticated, authorizationRoles("admin"), getAllOrders);


export default orderRouter;