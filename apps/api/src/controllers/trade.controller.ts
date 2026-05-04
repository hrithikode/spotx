import { randomUUID } from "crypto";
import { CloseOrderBodySchema, CreateOrderBodySchema } from "../schema/trade.types.js";
import { Request, Response, } from "express";
import { prisma } from "@repo/prisma";
import { RedisSubscriber } from "../tradeCallback.js";
import { redis } from "@repo/redis";

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

const addtoStream = async (id: string , request:any) => {
    await redis.xadd(
        "engine-stream",
        "*",
        "data",
        JSON.stringify({
            id,
            request
        })
    );
}

const subscriber = new RedisSubscriber();

async function sendRequestAndWait(id: string, request:any ) {
    try{
        const result = await Promise.all([
            addtoStream(id, request),
            subscriber.waitForMessage(id)
        ])
        return result;

    } catch(error) {
        throw error;
    }
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

            const [ , callback] = await sendRequestAndWait(orderId, payload);
            
            if (callback.status === "insufficient_balance") {
                return res.status(400).json({ 
                    error: "Insufficient balance",
                    message: "You don't have enough balance to place this order"
                });
            }
    
            if (callback.status === "no_price") {
            return res.status(400).json({ 
                error: "Price not available",
                message: "Market price is not available for this asset"
            });
            }
            
            if (callback.status === "invalid_order") {
            return res.status(400).json({ 
                error: "Invalid order",
                message: "Order parameters are invalid"
            });
            }
            
            if (callback.status !== "created") {
            return res.status(400).json({ 
                error: "Order creation failed",
                message: `Order was not created. Status: ${callback.status}`
            });
            }
            return res.json({ message: "order created", orderId: orderId})
                    
            } catch (error) {
                return res.status(500).json({
                    error: "Internal server error"
                });
            }
}


export const closeOrder = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if(!userId) {
            return res.status(401).json({
                error: "user not found"
            })
        }
        const { orderId } = req.params;
        if (!orderId) {
            return res.status(400).json({ error: "orderId is required" });
        }
        const result = CloseOrderBodySchema.safeParse(req.body);

        if(!result.success) {
            return res.status(400).json({error: result.error.message })
        }

        const {pnl, closeReason = 'Manual'} = result.data;

        if(!closeReason) {
            return res.status(400).json({
                error: 'closeReason is required. Must be one of: TakeProfit, StopLoss, Manual, Liquidation'
            })
        }
        const existingOrder = await prisma.order.findFirst({
            where: {
                id: String(orderId),
                userId,
                status: "open"
            },
        });

        if (!existingOrder) {
            return res.status(404).json({error: "order not found or already closed"})
        }

        const payload = {
            kind: "close-order",
            payload: {
                orderId,
                userId,
                closeReason,
                pnl: pnl ? Number(pnl) : undefined,
                closedAt: Date.now(),
            },
        };

        await sendRequestAndWait(String(orderId), payload);
    } catch (e) {
        res.status(500).json({error: "internal server error"})
    }
}

export const getOrders = async (req: Request , res:Response ) => {
    //take user & check it
    //make a query to db
    //tranform the query result & return
   try{
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({error: "user not found"});
        
    }
    const orders = await prisma.order.findMany({
        where: {
            userId
        },
        orderBy: {
            createdAt: "desc"
        },
    });

    const transformedOrders = orders.map((order: any) => ({
        id: order.id,
        symbol: "BTC",
        orderType: order.side === "long" ? "long" : "short",
        quantity: order.qty / 100,
        price: order.openingPrice / 10000,
        status: order.status,
        pnl: order.pnl / 10000,
        createdAt: order.createdAt.toISOString(),
        closedAt: order.closedAt?.toISOString(),
        exitPrice: order.closingPrice ? order.closingPrice / 10000 : undefined,
        leverage: order.leverage,
        takeProfit: order.takeProfit ? order.takeProfit / 10000 : undefined,
        stopLoss: order.stopLoss ? order.stopLoss / 10000 : undefined,
        closeReason: order.closeReason,
    }));
    return res.json({ orders: transformedOrders })
    } catch (error) {
        return res.status(500).json({erro: "Internal server error"})
    }
}

export const getOrderById = async (req: Request , res:Response) => {
    //take user from middleware and check it
    //orderId from params and make a query to db for orderbyid
    //transform the orderById
    //return the transformed order
   try{
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "user not found"})
        }

        const { orderId } = req.params;

        if (!orderId) {
            return res.status(400).json({error: "orderId is required"})
        }

        const order = await prisma.order.findFirst({
            where: {
                id: String(orderId),
                userId,
            }
        })
        if(!order) {
            return res.status(404).json({ error: "order not found"})
        }

        const transformedOrder = {
            id: order.id,
            symbol: "BTC",
            orderType: order.side === "long" ? "long" : "short",
            quantity: order.qty / 100,
            price: order.openingPrice / 10000,
            status: order.status,
            pnl: order.pnl / 10000,
            createdAt: order.createdAt.toISOString(),
            closedAt: order.closedAt?.toISOString(),
            exitPrice: order.closingPrice ? order.closingPrice / 10000 : undefined,
            leverage: order.leverage,
            takeProfit: order.takeProfit ? order.takeProfit / 10000 : undefined,
            stopLoss: order.stopLoss ? order.stopLoss / 10000 : undefined,
            closeReason: order.closeReason,
        };

    return res.json({ order: transformedOrder });
    } catch (e) {
        return res.status(401).json()
    }

}