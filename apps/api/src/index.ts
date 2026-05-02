import dotenv from 'dotenv';
dotenv.config();


import express from "express";
import authRoutes from "./routes/auth.routes.js";
import cookieParser from 'cookie-parser';
import balanceRouter from './routes/balance.routes.js'
import errorHandler from './middleware/error.middleware.js';

const app = express();

app.use(express.json());
app.use(cookieParser());


app.use('/api/auth', authRoutes);
app.use("/balance", balanceRouter);


app.use(errorHandler);

app.listen(4000, () => {
  console.log("server is running on port 4000");
});