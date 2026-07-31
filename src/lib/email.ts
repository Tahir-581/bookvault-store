export async function sendOrderConfirmationEmail(
  email: string,
  orderNumber: string,
  total: number
) {
  const username = process.env.EMAIL_USERNAME;
  const password = process.env.EMAIL_PASSWORD;
  if (!username || !password) return;

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: username, pass: password },
    });

    await transporter.sendMail({
      from: username,
      to: email,
      subject: `Order Confirmed — ${orderNumber}`,
      text: `Thank you for your order!\n\nOrder: ${orderNumber}\nTotal: £${total.toFixed(2)}\n\nWe'll send you another email when your order ships.`,
      html: `<h2>Order Confirmed</h2><p>Order: <strong>${orderNumber}</strong></p><p>Total: <strong>£${total.toFixed(2)}</strong></p><p>We'll notify you when your order ships.</p>`,
    });
  } catch {
    // Email is optional — fail silently
  }
}

export async function sendOrderStatusEmail(
  email: string,
  orderNumber: string,
  status: string
) {
  const username = process.env.EMAIL_USERNAME;
  const password = process.env.EMAIL_PASSWORD;
  if (!username || !password) return;

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: username, pass: password },
    });

    await transporter.sendMail({
      from: username,
      to: email,
      subject: `Order ${orderNumber} — ${status}`,
      text: `Your order ${orderNumber} status has been updated to: ${status}`,
      html: `<p>Your order <strong>${orderNumber}</strong> is now <strong>${status}</strong>.</p>`,
    });
  } catch {
    // Email is optional
  }
}
