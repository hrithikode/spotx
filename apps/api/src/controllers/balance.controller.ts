import { prisma } from "@repo/prisma";
import { Request, Response } from "express";
import { getBalanceByAssetSchema } from "../schema/balance.schema.js";

export const getBalance = async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if(!userId) {
        return res.status(404).json({ error: "unauthorized" });
    };

    const balances = await prisma.asset.findMany({
        where: {
            userId: userId
        },
        select: {
            symbol: true,
            balance: true,
            decimals: true
        }
    });
    res.json({ userId, balances })
}

export const getBalanceByAsset = async (req: Request, res: Response ) => {
    const userId = req.user?.id;

    if(!userId) {
        return res.status(401).json("user not found");
    }

    const result = getBalanceByAssetSchema.safeParse(req.params);
    if (!result.success) {
        return res.status(400).json( { error: result.error.message} );
    }
    const { symbol } = result.data;


    const record = await prisma.asset.findUnique({
        where: {
            user_symbol_unique: {
                userId,
                symbol
            },
        },    
            select: {
                symbol: true,
                balance: true,
                decimals: true
            }
        
    });

    if (!record) {
        return res.json("asset not found");
    }
        res.json(record);
}

export const depositBalance = async (req: Request , res: Response ) => {
   
}