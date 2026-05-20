import { test, expect } from "../fixtures";

test.describe("Dashboard", () => {
  test("should display dashboard with stats", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard");

    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible();
    await expect(page.getByText(/Antrian Menunggu/i)).toBeVisible();
    await expect(page.getByText(/Dilayani Hari Ini/i)).toBeVisible();
    await expect(page.getByText(/Barber Aktif/i)).toBeVisible();
  });

  test("should display current date", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard");

    const today = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    await expect(page.getByText(today)).toBeVisible();
  });

  test("should show quick access links", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard");

    await expect(page.getByRole("heading", { name: /Akses Cepat/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Kelola Antrian/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Tambah Barber/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Layanan & Harga/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Lihat Laporan/i })).toBeVisible();
  });

  test("should navigate to queue page from quick access", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard");
    await page.getByRole("link", { name: /Kelola Antrian/i }).click();
    await page.waitForURL("/dashboard/queue");
    await expect(page).toHaveURL("/dashboard/queue");
  });

  test("should navigate to barbers page from quick access", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard");
    await page.getByRole("link", { name: /Tambah Barber/i }).click();
    await page.waitForURL("/dashboard/barbers");
    await expect(page).toHaveURL("/dashboard/barbers");
  });

  test("should navigate to services page from quick access", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard");
    await page.getByRole("link", { name: /Layanan & Harga/i }).click();
    await page.waitForURL("/dashboard/services");
    await expect(page).toHaveURL("/dashboard/services");
  });

  test("should navigate to analytics page from quick access", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard");
    await page.getByRole("link", { name: /Lihat Laporan/i }).click();
    await page.waitForURL("/dashboard/analytics");
    await expect(page).toHaveURL("/dashboard/analytics");
  });

  test("should show public links section", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard");

    await expect(page.getByRole("heading", { name: /Link Publik/i })).toBeVisible();
    await expect(page.getByText(/Halaman Antrian Customer/i)).toBeVisible();
    await expect(page.getByText(/Halaman Booking/i)).toBeVisible();
    await expect(page.getByText(/TV Display/i)).toBeVisible();
  });

  test("should navigate to settings page", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/settings");
    await expect(page).toHaveURL("/dashboard/settings");
  });
});
