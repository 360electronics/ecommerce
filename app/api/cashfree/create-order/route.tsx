// app/api/create-order/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
import { Cashfree, CFEnvironment } from "cashfree-pg";


const cashfree = new Cashfree(
    CFEnvironment.SANDBOX,
    process.env.NEXT_PUBLIC_CASHFREE_APP_ID!,
    process.env.CASHFREE_SECRET_KEY!
);

export async function POST(request: Request) {
    try {
        const { orderId, orderAmount, customerName, customerEmail, customerPhone } = await request.json();

        const order = {
            order_id: orderId,
            order_amount: orderAmount,
            order_currency: "INR",
            customer_details: {
                customer_id: "cust_" + Date.now(),
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone,
            },
            order_meta: {
                return_url: `http://localhost:3000/payment-status?order_id=${orderId}`
            }
        }

        console.log(order)

        const response = await cashfree.PGCreateOrder(order);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error(
            "Error setting up order request:",
            error.response?.data || error.message
          );
          return NextResponse.json(
            { error: "Failed to create order" },
            { status: 500 }
          );
    }
}
