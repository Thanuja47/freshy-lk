// src/lib/notify/templates.ts — Short SMS & Email templates for Freshy.lk

import { formatMoney } from "@/lib/money";

export function getOrderPlacedSmsTemplate(data: {
  customerName: string;
  orderNo: string;
  totalCents: number;
  trackingToken: string;
  siteUrl?: string;
}): string {
  const siteUrl = data.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://freshy.lk";
  const link = `${siteUrl}/order/${data.trackingToken}`;
  return `Freshy.lk: Thanks ${data.customerName}! Order ${data.orderNo} received (${formatMoney(data.totalCents)}). Track: ${link}`;
}

export function getDispatchedSmsTemplate(data: {
  orderNo: string;
  courierName: string;
  trackingNo: string;
  trackingToken: string;
  siteUrl?: string;
}): string {
  const siteUrl = data.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://freshy.lk";
  const link = `${siteUrl}/order/${data.trackingToken}`;
  return `Freshy.lk: Order ${data.orderNo} is on the way via ${data.courierName}, tracking ${data.trackingNo}. ${link}`;
}

export function getDeliveredSmsTemplate(data: {
  orderNo: string;
  whatsappNumber?: string;
}): string {
  const wa = data.whatsappNumber || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+94771234567";
  return `Freshy.lk: Order ${data.orderNo} delivered. Enjoy! Any issue? WhatsApp ${wa}`;
}

export function getSlipRejectedSmsTemplate(data: {
  orderNo: string;
  trackingToken: string;
  siteUrl?: string;
}): string {
  const siteUrl = data.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://freshy.lk";
  const link = `${siteUrl}/order/${data.trackingToken}`;
  return `Freshy.lk: We could not verify the slip for ${data.orderNo}. Please upload again: ${link}`;
}
