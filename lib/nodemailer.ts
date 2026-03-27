import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.NODEMAILER_EMAIL, // Must match FROM
    pass: process.env.NODEMAILER_PASS,  // App Password (not your Gmail password)
  },
});

export interface OrderEmailItem {
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: string;
}

export interface OrderEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  totalAmount: string;
  discountAmount: string;
  shippingAmount: string;
  address: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phoneNumber: string;
  };
  items: OrderEmailItem[];
}

function orderItemsHtml(items: OrderEmailItem[]): string {
  return items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.productName} – ${item.variantName}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">₹${Number(item.unitPrice).toLocaleString("en-IN")}</td>
      </tr>`
    )
    .join("");
}

function orderSummaryHtml(order: OrderEmailData): string {
  const total = Number(order.totalAmount);
  const discount = Number(order.discountAmount);
  const shipping = Number(order.shippingAmount);
  const addr = order.address;
  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#333;">
      <div style="background:#111;padding:20px 30px;">
        <h1 style="color:#fff;margin:0;font-size:22px;">360 Electronics</h1>
      </div>
      <div style="padding:30px;">
        <h2 style="margin-top:0;">Order Confirmed 🎉</h2>
        <p>Hi <strong>${order.customerName}</strong>, your order has been placed successfully.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <thead>
            <tr style="background:#f4f4f4;">
              <th style="padding:8px 12px;text-align:left;">Product</th>
              <th style="padding:8px 12px;text-align:center;">Qty</th>
              <th style="padding:8px 12px;text-align:right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${orderItemsHtml(order.items)}
          </tbody>
        </table>
        <table style="width:100%;margin-bottom:20px;">
          ${discount > 0 ? `<tr><td>Discount</td><td style="text-align:right;color:green;">- ₹${discount.toLocaleString("en-IN")}</td></tr>` : ""}
          <tr><td>Shipping</td><td style="text-align:right;">₹${shipping.toLocaleString("en-IN")}</td></tr>
          <tr><td><strong>Total</strong></td><td style="text-align:right;"><strong>₹${total.toLocaleString("en-IN")}</strong></td></tr>
        </table>
        <div style="background:#f9f9f9;padding:16px;border-radius:6px;margin-bottom:20px;">
          <strong>Shipping Address</strong><br/>
          ${addr.fullName}<br/>
          ${addr.addressLine1}${addr.addressLine2 ? ", " + addr.addressLine2 : ""}<br/>
          ${addr.city}, ${addr.state} – ${addr.postalCode}<br/>
          ${addr.country}<br/>
          📞 ${addr.phoneNumber}
        </div>
        <p style="font-size:13px;color:#777;">Payment: ${order.paymentMethod.toUpperCase()} &nbsp;|&nbsp; Order ID: <code>${order.orderId.slice(0, 8).toUpperCase()}</code></p>
        <p style="font-size:13px;color:#777;">We'll notify you when your order is shipped. Thank you for shopping with us!</p>
      </div>
    </div>`;
}

export async function sendOrderConfirmationEmail(order: OrderEmailData): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"360 Electronics" <${process.env.NODEMAILER_EMAIL}>`,
      to: order.customerEmail,
      subject: `Order Confirmed – #${order.orderId.slice(0, 8).toUpperCase()} | 360 Electronics`,
      html: orderSummaryHtml(order),
    });
    return true;
  } catch (error) {
    console.error("[ORDER_CONFIRM_EMAIL_ERROR]", error);
    return false;
  }
}

export async function sendAdminOrderNotification(order: OrderEmailData): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.NODEMAILER_EMAIL;
  if (!adminEmail) return false;
  try {
    await transporter.sendMail({
      from: `"360 Electronics" <${process.env.NODEMAILER_EMAIL}>`,
      to: adminEmail,
      subject: `New Order #${order.orderId.slice(0, 8).toUpperCase()} – ₹${Number(order.totalAmount).toLocaleString("en-IN")}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#333;">
          <div style="background:#111;padding:20px 30px;">
            <h1 style="color:#fff;margin:0;font-size:22px;">New Order Received</h1>
          </div>
          <div style="padding:30px;">
            <p><strong>Customer:</strong> ${order.customerName} (${order.customerEmail})</p>
            <p><strong>Order ID:</strong> ${order.orderId}</p>
            <p><strong>Payment:</strong> ${order.paymentMethod.toUpperCase()} – ${order.paymentStatus.toUpperCase()}</p>
            ${orderSummaryHtml(order)}
          </div>
        </div>`,
    });
    return true;
  } catch (error) {
    console.error("[ADMIN_ORDER_EMAIL_ERROR]", error);
    return false;
  }
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
  failed: "Failed",
};

export async function sendOrderStatusUpdateEmail(
  order: Pick<OrderEmailData, "orderId" | "customerName" | "customerEmail" | "totalAmount">,
  newStatus: string
): Promise<boolean> {
  const label = STATUS_LABELS[newStatus] ?? newStatus;
  const statusMessages: Record<string, string> = {
    shipped: "Great news! Your order is on the way. It will be delivered soon.",
    delivered: "Your order has been delivered. We hope you love your purchase!",
    cancelled: "Your order has been cancelled. If you have any questions, please contact support.",
    returned: "We have received your return request and are processing it.",
  };
  const message = statusMessages[newStatus] ?? `Your order status has been updated to <strong>${label}</strong>.`;

  try {
    await transporter.sendMail({
      from: `"360 Electronics" <${process.env.NODEMAILER_EMAIL}>`,
      to: order.customerEmail,
      subject: `Order ${label} – #${order.orderId.slice(0, 8).toUpperCase()} | 360 Electronics`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#333;">
          <div style="background:#111;padding:20px 30px;">
            <h1 style="color:#fff;margin:0;font-size:22px;">360 Electronics</h1>
          </div>
          <div style="padding:30px;">
            <h2>Order Update: ${label}</h2>
            <p>Hi <strong>${order.customerName}</strong>,</p>
            <p>${message}</p>
            <div style="background:#f9f9f9;padding:16px;border-radius:6px;margin:20px 0;">
              <p style="margin:0;"><strong>Order ID:</strong> #${order.orderId.slice(0, 8).toUpperCase()}</p>
              <p style="margin:8px 0 0;"><strong>Amount:</strong> ₹${Number(order.totalAmount).toLocaleString("en-IN")}</p>
              <p style="margin:8px 0 0;"><strong>Status:</strong> ${label}</p>
            </div>
            <p style="font-size:13px;color:#777;">Thank you for shopping with 360 Electronics!</p>
          </div>
        </div>`,
    });
    return true;
  } catch (error) {
    console.error("[ORDER_STATUS_EMAIL_ERROR]", error);
    return false;
  }
}

export async function sendEmailOTP(email: string, otp: string, attempt = 1) {
  const mailOptions = {
    from: `"360 Electronics" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: "Verify your email - 360 Electronics",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify your email</h2>
        <p>Use the following OTP to verify your email address:</p>
        <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
          ${otp}
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn’t request this, please ignore it.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error: any) {
    console.error("Error sending email:", error);

    // Retry once if Gmail temporarily rejects (450 error)
    if (error.responseCode === 450 && attempt < 3) {
      console.warn(`Retrying email send (attempt ${attempt + 1})...`);
      await new Promise((r) => setTimeout(r, 3000 * attempt)); // 3s → 6s → 9s
      return sendEmailOTP(email, otp, attempt + 1);
    }

    return false;
  }
}
