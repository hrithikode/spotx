import { prisma } from "@repo/prisma";
import { Request, Response } from "express";
import { DepositBalanceBodySchema, getBalanceByAssetSchema } from "../schema/balance.schema.js";

export const getBalance = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        if(!userId) {
            return res.status(401).json({ error: "unauthorized" });
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
    } catch (error) {
        res.status(500).json({
            error: "Internal server error"
        })
    }
}

export const getBalanceByAsset = async (req: Request, res: Response ) => {
    try {
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
            return res.status(404).json("asset not found");
        }
        return res.json(record);
    } catch (error) {
        res.status(500).json({
            error: "Internal server error"
        })
    }
}

export const depositBalance = async (req: Request , res: Response ) => {
    try {
        const userId = req.user?.id;

        if(!userId) {
            return res.status(401).json("user not found");
        }

        const checkSchemaBalance = DepositBalanceBodySchema.safeParse(req.body);

        if(!checkSchemaBalance.success) {
            return res.status(400).json({ error: checkSchemaBalance.error.message});
        }

        const { symbol, amount, decimals } = checkSchemaBalance.data;

        const decimalPlaces = decimals ?? (symbol === 'USDT' ? 2 : 8)
        const baseUnitAmount = Math.round(amount * Math.pow(10, decimalPlaces));

        const updated = await prisma.asset.upsert({
            where: {
                user_symbol_unique: {
                    userId, symbol
                }
            },
            create: {
                userId,
                symbol,
                balance: baseUnitAmount,
                decimals: decimalPlaces
            },
            update: {
                balance: {
                    increment: baseUnitAmount
                }
            },
            select: {
                symbol: true,
                balance: true,
                decimals: true
            }
        });
        return res.json(updated);
    } catch (error) {
        return res.status(500).json({
            error: "Internal server error"
        })
    }
};
