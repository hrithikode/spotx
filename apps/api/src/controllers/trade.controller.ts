import { randomUUID } from "crypto";
import { CreateOrderBodySchema } from "../schema/trade.types.js";
import { Request, Response } from "express";
import { prisma } from "@repo/prisma";

async function getBalance(id: string) {
    const userBalance = await prisma.user.findUnique({
        where: {
            id,
        },
        select: {
            Asset:{
                select: {
                    symbol: true,
                    balance: true,
                    decimals: true,
                },
            },
        },
    });
    return userBalance?.Asset;
}



export const createOrder = async (req: Request, res: Response ) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                error: "User not found"
            });
        }

        const result = CreateOrderBodySchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                error: result.error.message
            });
        }

        const {
            asset,
            side,
            status = "open",
            qty,
            leverage,
            takeProfit,
            stopLoss,
        } = result.data;
    
        const orderId = randomUUID();

        const userBalance = await getBalance(userId);

        const payload = {
            kind: "create-order",
            payload: {
                orderId,
                userId,
                side,
                status,
                qty: Number(qty),
                leverage: Number(leverage),
                takeProfit: takeProfit != null ? Number(takeProfit) : null,
                stopLoss: stopLoss != null ? Number(stopLoss) : null,
                balanceSnapshot: userBalance,
                enqueuedAt: Date.now(),
            }
            };

            
    } catch (error) {
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}







