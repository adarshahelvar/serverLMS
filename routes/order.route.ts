import express from "express";
import { authorizationRoles, isAuthenticated } from "../middleware/auth";
import { createOrder, getAllOrders } from "../controllers/order.controller";
const orderRouter = express.Router();

orderRouter.post('/create-order',isAuthenticated, createOrder);
orderRouter.get('/get-orders',isAuthenticated, authorizationRoles("admin"), getAllOrders);


export default orderRouter;