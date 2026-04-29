import dotenv from 'dotenv';
dotenv.config();


import express from "express";
import authRoutes from "./routes/auth.routes.js";
import cookieParser from 'cookie-parser';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.post("/api/v1/hello", (req, res) => {
  res.json({ message: "Hello, World!" });
});

app.use('/api/auth', authRoutes);



app.listen(4000, () => {
  console.log("server is running on port 4000");
});