import { test, expect } from "../fixtures";

test.describe("Analytics", () => {
  test("should display analytics page", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/analytics");

    await expect(page.getByRole("heading", { name: /Laporan/i })).toBeVisible();
  });

  test("should show today's stats", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/analytics");

    await expect(page.getByText(/Hari Ini/i)).toBeVisible();
  });

  test("should show total customers served", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/analytics");

    await expect(page.getByText(/Total Pelanggan/i)).toBeVisible();
  });

  test("should show date range selector", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/analytics");

    await expect(page.locator('input[type="date"]')).toBeVisible();
  });

  test("should display service breakdown", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/analytics");

    await expect(page.getByText(/Layanan/i)).toBeVisible();
  });

  test("should display barber performance", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/analytics");

    await expect(page.getByText(/Barber/i)).toBeVisible();
  });

  test("should show peak hours", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/analytics");

    await expect(page.getByText(/Jam Sibuk/i)).toBeVisible();
  });
});
