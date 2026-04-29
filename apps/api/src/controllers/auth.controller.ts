import { Request, Response } from "express";
import { prisma } from "@repo/prisma";
import { loginSchema, registerSchema } from "../schema/auth.types.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'

export const register = async (req: Request, res: Response) => {
    try {
        const user = registerSchema.safeParse(req.body);
        if (!user.success) {
            return res.status(400).json({
                error: user.error.message,
            });
        }
        
        const { name, email, password } = user.data;

        if (!name || !email || !password) {
            return res.status(400).json({
                error: "credentials are required",
            });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if(existingUser) {
            return res.status(409).json({error: "User already exist"})
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email, 
                password:hashedPassword
            },
        });
        
        const token = jwt.sign({ id: newUser.id, email: newUser.email}, process.env.JWT_SECRET!, { expiresIn: "1h"});
       
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
            maxAge: 60 * 60 * 1000
        })

        return res.json({
            message: "user created successfully",
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name
            }
        })

        
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}



export const login = async (req: Request, res: Response) => {
    try{
        const user = loginSchema.safeParse(req.body);

        if(!user.success) {
            return res.status(400).json({error: "credentials are required"});
        }

        const { email, password } = user.data;

        if(!email ||  !password) {
            return res.status(400).json({error: "email and password are required"});
        }

        const loginUser = await prisma.user.findUnique({
            where: {
                email
            },
        });

        if (!loginUser) {
            return res.status(404).json({error: "user not found"});
        }

        const isPasswordValid = await bcrypt.compare(password, loginUser.password)

        if(!isPasswordValid) {
            return res.status(401).json({ error: "password is wrong"});
        }

        const token = jwt.sign({id: loginUser.id, email: loginUser.email}, process.env.JWT_SECRET!, {expiresIn: "1h"});

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
            maxAge: 60 * 60 * 1000
        });

        return res.json({
            message: "User logged In successfully",
            user: { 
                id: loginUser.id,
                email: loginUser.email,
                name: loginUser.name
            }
        })
    } catch (error) {
        return res.status(500).json({ error: "Internal server error"});
    }
};

export const logout = async (req: Request, res: Response) => {
    try{
        res.clearCookie("token", {
            httpOnly: true,
            sameSite: "none",
            secure: true
        });
        return res.json({ message: "logout successfully" });
    } catch (error) {
        res.status(500).json({error: " Internal server error "})
    }
};