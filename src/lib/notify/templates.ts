// src/lib/notify/templates.ts — Transactional notification templates for SMS and Email

import { formatMoney } from "@/lib/money";

export interface OrderNotificationData {
  customerName: string;
  orderNo: string;
  totalCents: number;
  trackingToken: string;
  deliveryDate?: string;
  courierName?: string;
  trackingNo?: string;
  siteUrl?: string;
  whatsappNumber?: string;
}

export interface NotificationTemplateResult {
  templateName: string;
  smsBody: string;
  emailSubject: string;
  emailHtml: string;
}

function getSiteUrl(dataUrl?: string): string {
  return dataUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://freshy.lk";
}

// 1. Order Received
export function getOrderReceivedTemplate(data: OrderNotificationData): NotificationTemplateResult {
  const link = `${getSiteUrl(data.siteUrl)}/order/${data.trackingToken}`;
  const totalFormatted = formatMoney(data.totalCents);

  return {
    templateName: "order_received",
    smsBody: `Freshy.lk: Thanks ${data.customerName}! Order ${data.orderNo} received (${totalFormatted}). Track status: ${link}`,
    emailSubject: `Order Confirmation - ${data.orderNo} | Freshy.lk`,
    emailHtml: `
      <h2>Order Received</h2>
      <p>Dear ${data.customerName},</p>
      <p>Thank you for your order <strong>${data.orderNo}</strong> totalling <strong>${totalFormatted}</strong>.</p>
      <p>You can track your delivery status anytime here: <a href="${link}">${link}</a></p>
      <p>Fresh Seafood Delivered Chilled to Your Doorstep.</p>
    `,
  };
}

// 2. Bank Slip Received
export function getBankSlipReceivedTemplate(data: OrderNotificationData): NotificationTemplateResult {
  const link = `${getSiteUrl(data.siteUrl)}/order/${data.trackingToken}`;

  return {
    templateName: "bank_slip_received",
    smsBody: `Freshy.lk: We received your payment slip for ${data.orderNo}. Our team is verifying it. Track: ${link}`,
    emailSubject: `Bank Slip Received - ${data.orderNo} | Freshy.lk`,
    emailHtml: `
      <h2>Bank Slip Received</h2>
      <p>Dear ${data.customerName},</p>
      <p>We have received your transfer slip for order <strong>${data.orderNo}</strong>. Our accounts team will verify it shortly.</p>
      <p>Track your order status: <a href="${link}">${link}</a></p>
    `,
  };
}

// 3. Payment Confirmed
export function getPaymentConfirmedTemplate(data: OrderNotificationData): NotificationTemplateResult {
  const link = `${getSiteUrl(data.siteUrl)}/order/${data.trackingToken}`;

  return {
    templateName: "payment_confirmed",
    smsBody: `Freshy.lk: Payment confirmed for order ${data.orderNo}! We are preparing your fresh catch. Track: ${link}`,
    emailSubject: `Payment Confirmed - ${data.orderNo} | Freshy.lk`,
    emailHtml: `
      <h2>Payment Confirmed!</h2>
      <p>Dear ${data.customerName},</p>
      <p>Payment for order <strong>${data.orderNo}</strong> has been successfully verified.</p>
      <p>Our team is now packing your fresh seafood chilled for dispatch.</p>
      <p>Track your order: <a href="${link}">${link}</a></p>
    `,
  };
}

// 4. Out For Delivery
export function getOutForDeliveryTemplate(data: OrderNotificationData): NotificationTemplateResult {
  const link = `${getSiteUrl(data.siteUrl)}/order/${data.trackingToken}`;
  const courier = data.courierName || "Our Rider";
  const trackingInfo = data.trackingNo ? ` (Tracking: ${data.trackingNo})` : "";

  return {
    templateName: "out_for_delivery",
    smsBody: `Freshy.lk: Order ${data.orderNo} is out for delivery via ${courier}${trackingInfo}. Track: ${link}`,
    emailSubject: `Out for Delivery - ${data.orderNo} | Freshy.lk`,
    emailHtml: `
      <h2>Your Order is Out for Delivery!</h2>
      <p>Dear ${data.customerName},</p>
      <p>Order <strong>${data.orderNo}</strong> is on its way to your delivery address via <strong>${courier}</strong>.</p>
      <p>Track live status: <a href="${link}">${link}</a></p>
    `,
  };
}

// 5. Delivered
export function getDeliveredTemplate(data: OrderNotificationData): NotificationTemplateResult {
  const wa = data.whatsappNumber || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+94771234567";

  return {
    templateName: "delivered",
    smsBody: `Freshy.lk: Order ${data.orderNo} has been delivered. Enjoy your fresh catch! Questions? WhatsApp ${wa}`,
    emailSubject: `Order Delivered - ${data.orderNo} | Freshy.lk`,
    emailHtml: `
      <h2>Order Delivered</h2>
      <p>Dear ${data.customerName},</p>
      <p>Order <strong>${data.orderNo}</strong> has been successfully delivered. We hope you enjoy your seafood!</p>
      <p>Need support? Contact us on WhatsApp: <a href="https://wa.me/${wa.replace(/\+/g, "")}">${wa}</a></p>
    `,
  };
}
