export type Side = 'buy' | 'sell';
export type OrderType = 'limit' | 'market';
export type OrderStatus = 'open' | 'partially_filled' | 'filled' | 'cancelled';

export interface Order {
    orderId: string;
    userId: string;
    market: string;     
    type: OrderType;
    price: number;        
    quantity: number;
    filledQuantity: number;
    status: OrderStatus;
    createdAt: number;  
}

export interface Trade {
    tradeId: string;
    market: string;
    price: number;
    quantity: number;
    makerOrderId: string;
    takerOrderId: string;
    timestamp: number;
}


export interface UserBalance {
  symbol: string;
  balance: number;
  decimals: number;
}


export interface CreateOrderMessage {
    type: 'CREATE_ORDER';
    data: {
        orderId: string; 
        userId: string;
        market: string;
        price: number;
        quantity: number;
        side: Side;
        orderType: OrderType;
    }
}

export interface CancelOrderMessage {
    type: 'CANCEL_ORDER';
    data: {
        orderId: string;
        market: string;
    }
}

export type EngineMessage = CreateOrderMessage | CancelOrderMessage;


export interface TradeExecutedEvent {
    type: 'TRADE_EXECUTED';
    data: {
        tradeId: string;
        market: string;
        price: number;
        quantity: number;
        makerOrderId: string;
        takerOrderId: string;
        timestamp: number;
    }
}

export interface OrderUpdateEvent {
    type: 'ORDER_UPDATE';
    data: {
        orderId: string;
        userId: string;
        market: string;
        status: OrderStatus;
        filledQuantity: number;
    }
}

export interface PriceData {
  s: string; // symbol
  b: string; // bid price
  a: string; // ask price
}