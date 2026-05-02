import { prisma } from "@repo/prisma";
import { NextFunction, Request, Response } from "express";
import  jwt from "jsonwebtoken";

interface JwtPayload {
    id: string;
    email: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: {id: string; email: string }
        }
    }
}
export async function authenticate ( 
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const token = req.cookies.token;
        if(!token) {
            res.status(401).json({ status : "error", message: "Authentication required"});
            return;
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

        const user = await prisma.user.findUnique({
            where: {
                id: decoded.id
            },
            select: {
                id:    true,
                email: true
            }
        })
        if(!user) {
            res.status(401).json({ status: "error", message: "user not found"})
            return
        }
        req.user = { id: user.id, email: user.email }
        next();
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            res.status(401).json({ status: "error", message: "token expired" });
            return;
        }
        if (err instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                status: "error", message: "invalid token"
            })
            return;
        }
        next(err);
    }
}