// tests/unit/notifications.test.ts — Unit tests for Notification Templates & NotificationAdapter dry-run mode

import { describe, it, expect } from "vitest";
import { NotificationAdapter } from "../../src/lib/notify/adapter";
import {
  getOrderReceivedTemplate,
  getBankSlipReceivedTemplate,
  getPaymentConfirmedTemplate,
  getOutForDeliveryTemplate,
  getDeliveredTemplate,
  type OrderNotificationData,
} from "../../src/lib/notify/templates";

describe("Notification Adapter & Templates Suite", () => {
  const sampleOrder: OrderNotificationData = {
    customerName: "Anura Fernando",
    orderNo: "FRS-261008-0005",
    totalCents: 380000, // Rs 3,800.00
    trackingToken: "token-abc123xyz",
    courierName: "Freshy Express",
    trackingNo: "TRK-9900",
    whatsappNumber: "+94771234567",
  };

  it("renders order_received template correctly", () => {
    const tpl = getOrderReceivedTemplate(sampleOrder);
    expect(tpl.templateName).toBe("order_received");
    expect(tpl.smsBody).toContain("FRS-261008-0005");
    expect(tpl.smsBody).toContain("Rs. 3,800.00");
    expect(tpl.emailSubject).toContain("Order Confirmation");
  });

  it("renders bank_slip_received template correctly", () => {
    const tpl = getBankSlipReceivedTemplate(sampleOrder);
    expect(tpl.templateName).toBe("bank_slip_received");
    expect(tpl.smsBody).toContain("received your payment slip");
    expect(tpl.emailSubject).toContain("Bank Slip Received");
  });

  it("renders payment_confirmed template correctly", () => {
    const tpl = getPaymentConfirmedTemplate(sampleOrder);
    expect(tpl.templateName).toBe("payment_confirmed");
    expect(tpl.smsBody).toContain("Payment confirmed");
    expect(tpl.emailSubject).toContain("Payment Confirmed");
  });

  it("renders out_for_delivery template correctly", () => {
    const tpl = getOutForDeliveryTemplate(sampleOrder);
    expect(tpl.templateName).toBe("out_for_delivery");
    expect(tpl.smsBody).toContain("Freshy Express");
    expect(tpl.smsBody).toContain("TRK-9900");
    expect(tpl.emailSubject).toContain("Out for Delivery");
  });

  it("renders delivered template correctly", () => {
    const tpl = getDeliveredTemplate(sampleOrder);
    expect(tpl.templateName).toBe("delivered");
    expect(tpl.smsBody).toContain("Order FRS-261008-0005 has been delivered");
    expect(tpl.emailSubject).toContain("Order Delivered");
  });

  it("executes NotificationAdapter in dryRun mode without sending real SMS or email", async () => {
    const adapter = new NotificationAdapter({ dryRun: true });

    const smsResult = await adapter.sendSms({
      to: "+94771234567",
      body: "Test SMS dry run",
    });

    expect(smsResult.success).toBe(true);
    expect(smsResult.dryRun).toBe(true);
    expect(smsResult.providerRef).toContain("dryrun-sms-");

    const emailResult = await adapter.sendEmail({
      to: "customer@example.com",
      subject: "Test Email dry run",
      body: "Test body content",
    });

    expect(emailResult.success).toBe(true);
    expect(emailResult.dryRun).toBe(true);
    expect(emailResult.providerRef).toContain("dryrun-email-");
  });
});
