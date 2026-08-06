/**
 * Smoke tests for core checkout math and utilities.
 * Run: npx tsx scripts/smoke-test.ts
 */
import { computeCouponDiscount, computeOrderTotals, isCouponInWindow } from "../src/lib/coupon";
import { generateOrderNumber, slugify } from "../src/lib/utils";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
}

console.log("ilfaaz Smoke Tests\n");

console.log("Coupon math:");
assert(computeCouponDiscount(100, "percent", 10) === 10, "10% of 100 = 10");
assert(computeCouponDiscount(100, "fixed", 15) === 15, "fixed 15 off 100");
assert(computeCouponDiscount(10, "fixed", 20) === 10, "fixed discount capped at subtotal");

console.log("\nOrder totals:");
const totals = computeOrderTotals(50, { shippingFee: 3.99, taxRate: 0.2 });
assert(totals.tax === 10, "tax on 50 at 20% = 10");
assert(totals.grandTotal === 63.99, "grand total = 50 + 3.99 + 10");

const freeShip = computeOrderTotals(50, { freeShipping: true, taxRate: 0.2 });
assert(freeShip.shippingFee === 0, "free shipping = 0");

console.log("\nCoupon window:");
assert(isCouponInWindow(null, null), "no dates = always valid");
assert(!isCouponInWindow("2099-01-01", null), "future start = invalid");

console.log("\nUtilities:");
assert(generateOrderNumber().startsWith("BV-"), "order number has BV prefix");
assert(slugify("Hello World!") === "hello-world", "slugify works");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
