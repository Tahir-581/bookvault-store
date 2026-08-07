import {
  ORDER_STATUS_LABELS,
  SITE_NAME,
  SITE_TAGLINE,
  type OrderStatus,
} from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";
import { formatPrice } from "@/lib/utils";

const BRAND_NAVY = "#131921";
const BRAND_GOLD = "#FEBD69";

export type OrderEmailItem = {
  title: string;
  author: string;
  format: string;
  coverUrl: string | null;
  unitPrice: number;
  quantity: number;
};

export type OrderEmailAddress = {
  full_name?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  county?: string;
  postcode?: string;
  country?: string;
};

export type OrderEmailPayload = {
  orderNumber: string;
  email: string;
  status?: string;
  paymentStatus?: string;
  isCod?: boolean;
  items: OrderEmailItem[];
  shipping: OrderEmailAddress;
  subtotal: number;
  discountTotal: number;
  shippingFee: number;
  grandTotal: number;
  couponCode?: string | null;
};

function getMailConfig() {
  const username = process.env.EMAIL_USERNAME;
  const password = process.env.EMAIL_PASSWORD;
  const ownerEmail = process.env.OWNER_EMAIL?.trim() || null;

  if (!username || !password) {
    console.warn(
      "[email] EMAIL_USERNAME or EMAIL_PASSWORD is missing — skipping send"
    );
    return null;
  }

  return { username, password, ownerEmail };
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

async function createTransporter(username: string, password: string) {
  const nodemailer = await import("nodemailer");
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: username, pass: password },
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function absoluteCoverUrl(coverUrl: string | null | undefined) {
  if (!coverUrl) return null;
  if (/^https?:\/\//i.test(coverUrl)) return coverUrl;
  return null;
}

function statusLabel(status: string | undefined) {
  if (!status) return "";
  if (status in ORDER_STATUS_LABELS) {
    return ORDER_STATUS_LABELS[status as OrderStatus];
  }
  return status;
}

function formatAddressLines(shipping: OrderEmailAddress): string[] {
  const cityLine = [shipping.city, shipping.county, shipping.postcode]
    .filter(Boolean)
    .join(", ");
  return [
    shipping.full_name,
    shipping.phone,
    shipping.line1,
    shipping.line2,
    cityLine || undefined,
    shipping.country,
  ].filter((line): line is string => Boolean(line && line.trim()));
}

function paymentNote(payload: OrderEmailPayload) {
  if (payload.isCod || payload.paymentStatus === "unpaid") {
    return "Cash on Delivery — pay when your order arrives";
  }
  if (payload.paymentStatus === "paid") return "Paid";
  if (payload.paymentStatus) return payload.paymentStatus;
  return null;
}

function buildItemsHtml(items: OrderEmailItem[]) {
  if (!items.length) {
    return `<p style="margin:0;color:#555;font-size:14px;">No items listed.</p>`;
  }

  const rows = items
    .map((item) => {
      const cover = absoluteCoverUrl(item.coverUrl);
      const coverCell = cover
        ? `<img src="${escapeHtml(cover)}" alt="" width="64" height="96" style="display:block;width:64px;height:96px;object-fit:cover;border-radius:4px;border:1px solid #e5e7eb;" />`
        : `<div style="width:64px;height:96px;background:#f3f4f6;border-radius:4px;border:1px solid #e5e7eb;"></div>`;
      const lineTotal = formatPrice(item.unitPrice * item.quantity);

      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #eee;vertical-align:top;width:80px;">
            ${coverCell}
          </td>
          <td style="padding:12px 12px 12px 0;border-bottom:1px solid #eee;vertical-align:top;">
            <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:${BRAND_NAVY};">${escapeHtml(item.title)}</p>
            <p style="margin:0 0 2px;font-size:13px;color:#555;">${escapeHtml(item.author)}</p>
            <p style="margin:0;font-size:12px;color:#777;">${escapeHtml(item.format)} · Qty ${item.quantity}</p>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #eee;vertical-align:top;text-align:right;white-space:nowrap;font-size:14px;font-weight:600;color:${BRAND_NAVY};">
            ${escapeHtml(lineTotal)}
          </td>
        </tr>`;
    })
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${rows}
    </table>`;
}

function buildAddressHtml(shipping: OrderEmailAddress) {
  const lines = formatAddressLines(shipping);
  if (!lines.length) {
    return `<p style="margin:0;color:#555;font-size:14px;">No shipping address on file.</p>`;
  }
  return lines
    .map(
      (line, index) =>
        `<p style="margin:${index === 0 ? "0 0 4px" : "0 0 2px"};font-size:14px;${index === 0 ? `font-weight:700;color:${BRAND_NAVY};` : "color:#555;"}">${escapeHtml(line)}</p>`
    )
    .join("");
}

function buildTotalsHtml(payload: OrderEmailPayload) {
  const discountRow =
    payload.discountTotal > 0
      ? `<tr>
          <td style="padding:4px 0;font-size:14px;color:#166534;">Discount${payload.couponCode ? ` (${escapeHtml(payload.couponCode)})` : ""}</td>
          <td style="padding:4px 0;font-size:14px;text-align:right;color:#166534;">−${escapeHtml(formatPrice(payload.discountTotal))}</td>
        </tr>`
      : "";

  const shippingLabel =
    payload.shippingFee === 0 ? "FREE" : formatPrice(payload.shippingFee);

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td style="padding:4px 0;font-size:14px;color:#555;">Subtotal</td>
        <td style="padding:4px 0;font-size:14px;text-align:right;color:${BRAND_NAVY};">${escapeHtml(formatPrice(payload.subtotal))}</td>
      </tr>
      ${discountRow}
      <tr>
        <td style="padding:4px 0;font-size:14px;color:#555;">Shipping</td>
        <td style="padding:4px 0;font-size:14px;text-align:right;color:${BRAND_NAVY};">${escapeHtml(shippingLabel)}</td>
      </tr>
      <tr>
        <td style="padding:12px 0 0;border-top:1px solid #eee;font-size:16px;font-weight:700;color:${BRAND_NAVY};">Order total</td>
        <td style="padding:12px 0 0;border-top:1px solid #eee;font-size:16px;font-weight:700;text-align:right;color:${BRAND_NAVY};">${escapeHtml(formatPrice(payload.grandTotal))}</td>
      </tr>
    </table>`;
}

function buildCodBanner(payload: OrderEmailPayload) {
  const note = paymentNote(payload);
  if (!note) return "";
  return `
    <tr>
      <td style="padding:0 28px 20px;">
        <div style="background:#fff8eb;border:1px solid ${BRAND_GOLD};border-radius:6px;padding:14px 16px;">
          <p style="margin:0;font-size:13px;font-weight:700;color:${BRAND_NAVY};letter-spacing:0.02em;">PAYMENT</p>
          <p style="margin:6px 0 0;font-size:14px;color:#444;">${escapeHtml(note)}</p>
        </div>
      </td>
    </tr>`;
}

function buildEmailShell(options: {
  headline: string;
  introHtml: string;
  payload: OrderEmailPayload;
  showCod: boolean;
}) {
  const { headline, introHtml, payload, showCod } = options;
  const logoUrl = `${getSiteUrl()}/store-logo.png`;
  const orderStatus = statusLabel(payload.status);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(headline)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="background:${BRAND_NAVY};padding:20px 28px;border-bottom:4px solid ${BRAND_GOLD};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;width:56px;">
                    <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(SITE_NAME)}" width="48" height="48" style="display:block;width:48px;height:48px;object-fit:contain;background:#ffffff;border-radius:6px;padding:4px;" />
                  </td>
                  <td style="vertical-align:middle;padding-left:14px;">
                    <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;font-family:Georgia,serif;letter-spacing:0.02em;">${escapeHtml(SITE_NAME)}</p>
                    <p style="margin:4px 0 0;font-size:12px;color:${BRAND_GOLD};">${escapeHtml(SITE_TAGLINE)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px;">
              <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:${BRAND_NAVY};">${escapeHtml(headline)}</h1>
              ${introHtml}
              <p style="margin:16px 0 0;font-size:14px;color:#555;">
                Order <strong style="color:${BRAND_NAVY};">${escapeHtml(payload.orderNumber)}</strong>
                ${orderStatus ? ` · <strong style="color:${BRAND_NAVY};">${escapeHtml(orderStatus)}</strong>` : ""}
              </p>
            </td>
          </tr>
          ${showCod ? buildCodBanner(payload) : ""}
          <tr>
            <td style="padding:8px 28px 8px;">
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${BRAND_NAVY};">Items</p>
              ${buildItemsHtml(payload.items)}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 8px;">
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${BRAND_NAVY};">Deliver to</p>
              ${buildAddressHtml(payload.shipping)}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;">
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${BRAND_NAVY};">Pricing</p>
              ${buildTotalsHtml(payload)}
            </td>
          </tr>
          <tr>
            <td style="background:${BRAND_NAVY};padding:18px 28px;text-align:center;">
              <p style="margin:0;font-size:13px;color:${BRAND_GOLD};font-weight:700;">${escapeHtml(SITE_NAME)}</p>
              <p style="margin:6px 0 0;font-size:12px;color:#c8cdd3;">${escapeHtml(SITE_TAGLINE)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildItemsText(items: OrderEmailItem[]) {
  if (!items.length) return "No items listed.";
  return items
    .map(
      (item) =>
        `- ${item.title} by ${item.author} (${item.format}) × ${item.quantity} — ${formatPrice(item.unitPrice * item.quantity)}`
    )
    .join("\n");
}

function buildAddressText(shipping: OrderEmailAddress) {
  const lines = formatAddressLines(shipping);
  return lines.length ? lines.join("\n") : "No shipping address on file.";
}

function buildTotalsText(payload: OrderEmailPayload) {
  const lines = [
    `Subtotal: ${formatPrice(payload.subtotal)}`,
  ];
  if (payload.discountTotal > 0) {
    lines.push(
      `Discount${payload.couponCode ? ` (${payload.couponCode})` : ""}: −${formatPrice(payload.discountTotal)}`
    );
  }
  lines.push(
    `Shipping: ${payload.shippingFee === 0 ? "FREE" : formatPrice(payload.shippingFee)}`
  );
  lines.push(`Order total: ${formatPrice(payload.grandTotal)}`);
  return lines.join("\n");
}

function buildPlainText(options: {
  headline: string;
  intro: string;
  payload: OrderEmailPayload;
  showCod: boolean;
}) {
  const { headline, intro, payload, showCod } = options;
  const parts = [
    `${SITE_NAME}`,
    headline,
    "",
    intro,
    "",
    `Order: ${payload.orderNumber}`,
  ];
  if (payload.status) {
    parts.push(`Status: ${statusLabel(payload.status)}`);
  }
  if (showCod) {
    const note = paymentNote(payload);
    if (note) {
      parts.push("", `Payment: ${note}`);
    }
  }
  parts.push(
    "",
    "Items:",
    buildItemsText(payload.items),
    "",
    "Deliver to:",
    buildAddressText(payload.shipping),
    "",
    "Pricing:",
    buildTotalsText(payload),
    "",
    `${SITE_NAME} — ${SITE_TAGLINE}`
  );
  return parts.join("\n");
}

function customerStatusIntro(status: string) {
  const label = statusLabel(status);
  switch (status) {
    case "processing":
      return `Good news — we're preparing your order. Current status: ${label}.`;
    case "shipped":
      return `Your order is on its way. Current status: ${label}.`;
    case "delivered":
      return `Your order has been marked as delivered. We hope you enjoy your books.`;
    case "cancelled":
      return `Your order has been cancelled. If you have questions, reply to this email.`;
    case "refunded":
      return `A refund has been processed for your order.`;
    case "paid":
      return `We've recorded payment for your order. Current status: ${label}.`;
    default:
      return `Your order status has been updated to: ${label}.`;
  }
}

export async function sendOrderConfirmationEmail(payload: OrderEmailPayload) {
  const config = getMailConfig();
  if (!config) return;

  const { username, password, ownerEmail } = config;
  const customer = normalizeEmail(payload.email);
  const owner = ownerEmail ? normalizeEmail(ownerEmail) : null;
  const confirmationPayload: OrderEmailPayload = {
    ...payload,
    status: payload.status || "pending",
    isCod: payload.isCod ?? true,
    paymentStatus: payload.paymentStatus || "unpaid",
  };

  try {
    const transporter = await createTransporter(username, password);

    const customerHtml = buildEmailShell({
      headline: "Order confirmed",
      introHtml: `<p style="margin:0;font-size:15px;line-height:1.5;color:#444;">Thank you for shopping with ${escapeHtml(SITE_NAME)}. We've received your order and will notify you when it ships.</p>`,
      payload: confirmationPayload,
      showCod: true,
    });
    const customerText = buildPlainText({
      headline: "Order confirmed",
      intro: `Thank you for shopping with ${SITE_NAME}. We've received your order and will notify you when it ships.`,
      payload: confirmationPayload,
      showCod: true,
    });

    await transporter.sendMail({
      from: `"${SITE_NAME}" <${username}>`,
      to: payload.email,
      subject: `Order confirmed — ${payload.orderNumber}`,
      text: customerText,
      html: customerHtml,
    });

    if (owner && owner !== customer) {
      const ownerHtml = buildEmailShell({
        headline: "New order",
        introHtml: `<p style="margin:0;font-size:15px;line-height:1.5;color:#444;">A new Cash on Delivery order was placed. Customer: <strong>${escapeHtml(payload.email)}</strong>. Please prepare it for packing and dispatch.</p>`,
        payload: confirmationPayload,
        showCod: true,
      });
      const ownerText = buildPlainText({
        headline: "New order",
        intro: `A new Cash on Delivery order was placed. Customer: ${payload.email}. Please prepare it for packing and dispatch.`,
        payload: confirmationPayload,
        showCod: true,
      });

      await transporter.sendMail({
        from: `"${SITE_NAME}" <${username}>`,
        to: ownerEmail!,
        subject: `New order — ${payload.orderNumber}`,
        text: ownerText,
        html: ownerHtml,
      });
    }
  } catch (error) {
    console.error("[email] Failed to send order confirmation:", error);
  }
}

export async function sendOrderStatusEmail(
  payload: OrderEmailPayload,
  status: string
) {
  const config = getMailConfig();
  if (!config) return;

  const { username, password, ownerEmail } = config;
  const customer = normalizeEmail(payload.email);
  const owner = ownerEmail ? normalizeEmail(ownerEmail) : null;
  const label = statusLabel(status);
  const statusPayload: OrderEmailPayload = {
    ...payload,
    status,
  };
  const showCod =
    Boolean(payload.isCod) || payload.paymentStatus === "unpaid";

  try {
    const transporter = await createTransporter(username, password);

    const customerHtml = buildEmailShell({
      headline: `Order ${label.toLowerCase()}`,
      introHtml: `<p style="margin:0;font-size:15px;line-height:1.5;color:#444;">${escapeHtml(customerStatusIntro(status))}</p>`,
      payload: statusPayload,
      showCod,
    });
    const customerText = buildPlainText({
      headline: `Order ${label.toLowerCase()}`,
      intro: customerStatusIntro(status),
      payload: statusPayload,
      showCod,
    });

    await transporter.sendMail({
      from: `"${SITE_NAME}" <${username}>`,
      to: payload.email,
      subject: `Order ${payload.orderNumber} — ${label}`,
      text: customerText,
      html: customerHtml,
    });

    if (owner && owner !== customer) {
      const ownerHtml = buildEmailShell({
        headline: `Order updated to ${label}`,
        introHtml: `<p style="margin:0;font-size:15px;line-height:1.5;color:#444;">Order <strong>${escapeHtml(payload.orderNumber)}</strong> for <strong>${escapeHtml(payload.email)}</strong> is now <strong>${escapeHtml(label)}</strong>.</p>`,
        payload: statusPayload,
        showCod,
      });
      const ownerText = buildPlainText({
        headline: `Order updated to ${label}`,
        intro: `Order ${payload.orderNumber} for ${payload.email} is now ${label}.`,
        payload: statusPayload,
        showCod,
      });

      await transporter.sendMail({
        from: `"${SITE_NAME}" <${username}>`,
        to: ownerEmail!,
        subject: `Order ${payload.orderNumber} updated to ${label}`,
        text: ownerText,
        html: ownerHtml,
      });
    }
  } catch (error) {
    console.error("[email] Failed to send order status email:", error);
  }
}
