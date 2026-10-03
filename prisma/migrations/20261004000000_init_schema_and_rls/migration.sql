-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('OWNER', 'STAFF');

-- CreateEnum
CREATE TYPE "StorageType" AS ENUM ('FRESH', 'FROZEN', 'AMBIENT');

-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('FLAT', 'PER_KG');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('COURIER', 'OWN_RIDER');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('INDIVIDUAL', 'BUSINESS');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PLACED', 'CONFIRMED', 'PACKED', 'DISPATCHED', 'DELIVERED', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD_ONLINE', 'BANK_TRANSFER', 'COD');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING_REVIEW', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "SlipStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VatMode" AS ENUM ('NONE', 'INCLUSIVE', 'EXCLUSIVE');

-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'QUOTED', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "NotifyChannel" AS ENUM ('SMS', 'EMAIL');

-- CreateEnum
CREATE TYPE "NotifyStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "localName" TEXT,
    "shortDesc" TEXT,
    "description" TEXT,
    "tips" TEXT,
    "catchType" TEXT,
    "origin" TEXT,
    "storageType" "StorageType" NOT NULL DEFAULT 'FRESH',
    "pricePerKgCents" INTEGER NOT NULL,
    "priceUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priceVersion" INTEGER NOT NULL DEFAULT 1,
    "trackStock" BOOLEAN NOT NULL DEFAULT false,
    "stockGrams" INTEGER NOT NULL DEFAULT 0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "blurDataUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPack" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "weightGrams" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceTier" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "minWeightGrams" INTEGER NOT NULL,
    "pricePerKgCents" INTEGER NOT NULL,
    "label" TEXT,

    CONSTRAINT "PriceTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "oldPricePerKgCents" INTEGER NOT NULL,
    "newPricePerKgCents" INTEGER NOT NULL,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrepOption" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "feeType" "FeeType" NOT NULL DEFAULT 'FLAT',
    "feeCents" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PrepOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPrepOption" (
    "productId" TEXT NOT NULL,
    "prepOptionId" TEXT NOT NULL,
    "feeOverrideCents" INTEGER,

    CONSTRAINT "ProductPrepOption_pkey" PRIMARY KEY ("productId","prepOptionId")
);

-- CreateTable
CREATE TABLE "DeliveryZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "districts" TEXT[],
    "method" "DeliveryMethod" NOT NULL DEFAULT 'COURIER',
    "courierName" TEXT,
    "baseFeeCents" INTEGER NOT NULL,
    "perKgFeeCents" INTEGER NOT NULL DEFAULT 0,
    "freeOverCents" INTEGER,
    "minOrderCents" INTEGER NOT NULL DEFAULT 0,
    "leadDays" INTEGER NOT NULL DEFAULT 1,
    "cutoffTime" TEXT NOT NULL DEFAULT '15:00',
    "deliveryWeekdays" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5, 6]::INTEGER[],
    "allowedStorage" "StorageType"[] DEFAULT ARRAY['FRESH', 'FROZEN', 'AMBIENT']::"StorageType"[],
    "freshnessLabel" TEXT,
    "etaMinDays" INTEGER NOT NULL DEFAULT 1,
    "etaMaxDays" INTEGER NOT NULL DEFAULT 2,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DeliveryZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliverySlot" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "maxOrders" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DeliverySlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "company" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "trackingToken" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "customerId" TEXT,
    "customerType" "CustomerType" NOT NULL DEFAULT 'INDIVIDUAL',
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "companyName" TEXT,
    "brNumber" TEXT,
    "vatNumber" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "postalCode" TEXT,
    "deliveryNote" TEXT,
    "zoneId" TEXT NOT NULL,
    "slotId" TEXT,
    "deliveryDate" DATE NOT NULL,
    "courierName" TEXT,
    "courierTrackingNo" TEXT,
    "courierTrackingUrl" TEXT,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "subtotalCents" INTEGER NOT NULL,
    "prepTotalCents" INTEGER NOT NULL DEFAULT 0,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "deliveryFeeCents" INTEGER NOT NULL,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'LKR',
    "vatMode" "VatMode" NOT NULL DEFAULT 'NONE',
    "vatRateBp" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "internalNote" TEXT,
    "source" TEXT NOT NULL DEFAULT 'web',
    "placedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "localName" TEXT,
    "packLabel" TEXT NOT NULL,
    "packWeightGrams" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "pricePerKgCents" INTEGER NOT NULL,
    "tierLabel" TEXT,
    "prepName" TEXT,
    "prepFeeCents" INTEGER NOT NULL DEFAULT 0,
    "lineTotalCents" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderStatusEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus" NOT NULL,
    "note" TEXT,
    "byAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerPaymentId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'LKR',
    "status" "PaymentStatus" NOT NULL,
    "statusCode" INTEGER,
    "method" TEXT,
    "rawPayload" JSONB,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankSlip" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "status" "SlipStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankSlip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdfPath" TEXT,
    "snapshot" JSONB NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceCounter" (
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InvoiceCounter_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "OrderCounter" (
    "day" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OrderCounter_pkey" PRIMARY KEY ("day")
);

-- CreateTable
CREATE TABLE "WholesaleEnquiry" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "businessType" TEXT,
    "district" TEXT,
    "message" TEXT NOT NULL,
    "estimatedKgPerWeek" INTEGER,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WholesaleEnquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "channel" "NotifyChannel" NOT NULL,
    "toAddress" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "NotifyStatus" NOT NULL DEFAULT 'QUEUED',
    "providerRef" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "diff" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_authUserId_key" ON "AdminUser"("authUserId");
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_categoryId_isActive_sortOrder_idx" ON "Product"("categoryId", "isActive", "sortOrder");
CREATE UNIQUE INDEX "ProductPack_productId_weightGrams_key" ON "ProductPack"("productId", "weightGrams");
CREATE UNIQUE INDEX "PriceTier_productId_minWeightGrams_key" ON "PriceTier"("productId", "minWeightGrams");
CREATE INDEX "PriceHistory_productId_createdAt_idx" ON "PriceHistory"("productId", "createdAt");
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");
CREATE UNIQUE INDEX "Order_orderNo_key" ON "Order"("orderNo");
CREATE UNIQUE INDEX "Order_trackingToken_key" ON "Order"("trackingToken");
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
CREATE INDEX "Order_phone_idx" ON "Order"("phone");
CREATE INDEX "Order_deliveryDate_zoneId_idx" ON "Order"("deliveryDate", "zoneId");
CREATE INDEX "OrderStatusEvent_orderId_createdAt_idx" ON "OrderStatusEvent"("orderId", "createdAt");
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");
CREATE UNIQUE INDEX "Payment_provider_providerPaymentId_key" ON "Payment"("provider", "providerPaymentId");
CREATE UNIQUE INDEX "Invoice_orderId_key" ON "Invoice"("orderId");
CREATE UNIQUE INDEX "Invoice_invoiceNo_key" ON "Invoice"("invoiceNo");
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductPack" ADD CONSTRAINT "ProductPack_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PriceTier" ADD CONSTRAINT "PriceTier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PrepOption" ADD CONSTRAINT "PrepOption_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductPrepOption" ADD CONSTRAINT "ProductPrepOption_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductPrepOption" ADD CONSTRAINT "ProductPrepOption_prepOptionId_fkey" FOREIGN KEY ("prepOptionId") REFERENCES "PrepOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeliverySlot" ADD CONSTRAINT "DeliverySlot_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "DeliveryZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "DeliveryZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "DeliverySlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderStatusEvent" ADD CONSTRAINT "OrderStatusEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderStatusEvent" ADD CONSTRAINT "OrderStatusEvent_byAdminId_fkey" FOREIGN KEY ("byAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BankSlip" ADD CONSTRAINT "BankSlip_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Enable Row Level Security (RLS) on all tables with 0 public policies (Deny-All Defense)
ALTER TABLE "AdminUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductPack" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PriceTier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PriceHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PrepOption" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductPrepOption" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DeliveryZone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DeliverySlot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderStatusEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BankSlip" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InvoiceCounter" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderCounter" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WholesaleEnquiry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Setting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
