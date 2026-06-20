export interface OrderItem {
    name: string;
    qty: number;
    price: number;
    cost?: number;
}

export interface Order {
    id: number;
    customer_name: string;
    items: OrderItem[];
    total_price: number;
    status?: string;
    created_at: string;
    address: string;
    landmark: string;
    phone_number: string;
}
