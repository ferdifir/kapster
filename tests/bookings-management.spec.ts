import { test, expect } from "../fixtures";

test.describe("Bookings Management", () => {
  test("should display bookings page", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/bookings");

    await expect(page.getByRole("heading", { name: /Booking/i })).toBeVisible();
  });

  test("should show empty state when no bookings", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/bookings");

    await expect(page.getByText(/Belum ada booking/i)).toBeVisible();
  });

  test("should display date filter", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/bookings");

    await expect(page.locator('input[type="date"]')).toBeVisible();
  });

  test("should show booking status filters", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/bookings");

    await expect(page.getByRole("button", { name: /Semua/i })).toBeVisible();
  });

  test("should display booking details", async ({ seedBarbershopWithData }) => {
    await seedBarbershopWithData();
    await page.goto("/dashboard/bookings");

    await expect(page.getByRole("heading", { name: /Booking/i })).toBeVisible();
  });

  test("should allow cancelling booking", async ({ seedBarbershopWithData }) => {
    await seedBarbershopWithData();
    await page.goto("/dashboard/bookings");

    await expect(page.getByRole("button", { name: /Batal/i })).toBeVisible();
  });
});
