require("dotenv").config();
const express = require("express");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "..");

app.use(express.json({ limit: "100kb" }));
app.use(express.static(PUBLIC_DIR));

const requiredEnv = [
  "WAYFORPAY_MERCHANT_ACCOUNT",
  "WAYFORPAY_MERCHANT_SECRET",
  "WAYFORPAY_MERCHANT_DOMAIN"
];

function hmacMd5(message, secret) {
  return crypto.createHmac("md5", secret).update(message, "utf8").digest("hex");
}

function isPaymentConfigured() {
  return requiredEnv.every((key) => Boolean(process.env[key]));
}

app.get("/api/payment/status", (_req, res) => {
  res.json({ configured: isPaymentConfigured() });
});

app.post("/api/checkout/create", (req, res) => {
  if (!isPaymentConfigured()) {
    return res.status(503).json({
      error: "Онлайн-оплата ще не налаштована. Додайте реквізити WayForPay у файл .env на сервері."
    });
  }

  const { customer, items } = req.body || {};
  if (!customer || !customer.name || !customer.phone || !customer.email ||
      !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Перевірте контактні дані та склад замовлення." });
  }

  const catalog = {
    S: { name: "Giftly S", price: 999 },
    M: { name: "Giftly M", price: 1599 },
    L: { name: "Giftly L", price: 2499 }
  };

  const normalized = [];
  for (const item of items) {
    const product = catalog[item.id];
    const count = Number(item.quantity);
    if (!product || !Number.isInteger(count) || count < 1 || count > 20) {
      return res.status(400).json({ error: "Некоректний склад замовлення." });
    }
    normalized.push({ ...product, count });
  }

  const amount = normalized.reduce((sum, item) => sum + item.price * item.count, 0);
  const orderReference = `GIFTLY-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  const orderDate = Math.floor(Date.now() / 1000);
  const merchantAccount = process.env.WAYFORPAY_MERCHANT_ACCOUNT;
  const merchantDomainName = process.env.WAYFORPAY_MERCHANT_DOMAIN;
  const currency = process.env.WAYFORPAY_CURRENCY || "UAH";
  const productName = normalized.map((item) => item.name);
  const productCount = normalized.map((item) => item.count);
  const productPrice = normalized.map((item) => item.price);

  const signatureParts = [
    merchantAccount,
    merchantDomainName,
    orderReference,
    orderDate,
    amount,
    currency,
    ...productName,
    ...productCount,
    ...productPrice
  ];
  const merchantSignature = hmacMd5(signatureParts.join(";"), process.env.WAYFORPAY_MERCHANT_SECRET);

  res.json({
    paymentUrl: "https://secure.wayforpay.com/pay",
    fields: {
      merchantAccount,
      merchantAuthType: "SimpleSignature",
      merchantDomainName,
      orderReference,
      orderDate,
      amount: amount.toFixed(2),
      currency,
      productName,
      productCount,
      productPrice,
      merchantSignature,
      clientFirstName: String(customer.name).slice(0, 50),
      clientEmail: String(customer.email).slice(0, 100),
      clientPhone: String(customer.phone).slice(0, 20),
      orderTimeout: billableTimeout(),
      language: "UA"
    }
  });
});

function billableTimeout() {
  return 49000;
}

// WayForPay sends a server callback after the transaction.
// Production use should persist orders in a database and update their status here.
app.post("/api/checkout/callback", (req, res) => {
  const data = req.body || {};
  const secret = process.env.WAYFORPAY_MERCHANT_SECRET;
  if (!secret) return res.status(503).json({ error: "Payment callback is not configured." });

  const parts = [
    data.merchantAccount,
    data.orderReference,
    data.amount,
    data.currency,
    data.authCode,
    data.cardPan,
    data.transactionStatus,
    data.reasonCode
  ];
  const expected = hmacMd5(parts.join(";"), secret);
  const received = String(data.merchantSignature || "").toLowerCase();

  if (!/^[0-9a-f]{32}$/.test(received) || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received))) {
    return res.status(400).json({ error: "Invalid callback signature." });
  }

  const responseTime = Math.floor(Date.now() / 1000);
  res.json({
    orderReference: data.orderReference,
    status: "accept",
    time: responseTime,
    signature: hmacMd5(
      [data.orderReference, "accept", responseTime].join(";"),
      secret
    )
  });
});

app.get("*", (_req, res) => res.sendFile(path.join(PUBLIC_DIR, "index.html")));

app.listen(PORT, () => {
  console.log(`Giftly is running at http://localhost:${PORT}`);
});
