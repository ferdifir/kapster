import { test, expect } from "../fixtures";

test.describe("Middleware & Route Protection", () => {
  test("should redirect unauthenticated users from /dashboard to /auth/login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/auth\/login/);
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("should redirect unauthenticated users from /dashboard/queue to /auth/login", async ({ page }) => {
    await page.goto("/dashboard/queue");
    await page.waitForURL(/\/auth\/login/);
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("should redirect unauthenticated users from /dashboard/barbers to /auth/login", async ({ page }) => {
    await page.goto("/dashboard/barbers");
    await page.waitForURL(/\/auth\/login/);
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("should redirect unauthenticated users from /dashboard/services to /auth/login", async ({ page }) => {
    await page.goto("/dashboard/services");
    await page.waitForURL(/\/auth\/login/);
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("should redirect unauthenticated users from /dashboard/settings to /auth/login", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForURL(/\/auth\/login/);
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("should redirect unauthenticated users from /dashboard/billing to /auth/login", async ({ page }) => {
    await page.goto("/dashboard/billing");
    await page.waitForURL(/\/auth\/login/);
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("should redirect unauthenticated users from /dashboard/analytics to /auth/login", async ({ page }) => {
    await page.goto("/dashboard/analytics");
    await page.waitForURL(/\/auth\/login/);
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("should redirect unauthenticated users from /dashboard/bookings to /auth/login", async ({ page }) => {
    await page.goto("/dashboard/bookings");
    await page.waitForURL(/\/auth\/login/);
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("should redirect unauthenticated users from /onboarding to /auth/login", async ({ page }) => {
    await page.goto("/onboarding");
    await page.waitForURL(/\/auth\/login/);
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("should redirect unauthenticated users from /barber to /auth/login", async ({ page }) => {
    await page.goto("/barber");
    await page.waitForURL(/\/auth\/login/);
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("should preserve next param when redirecting to login", async ({ page }) => {
    await page.goto("/dashboard/queue");
    await page.waitForURL(/\/auth\/login.*next=/);
    await expect(page.url()).toContain("next=%2Fdashboard%2Fqueue");
  });

  test("should redirect authenticated users from /auth/login to /dashboard", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/auth/login");
    await page.waitForURL("/dashboard");
    await expect(page).toHaveURL("/dashboard");
  });

  test("should redirect authenticated users from /auth/register to /dashboard", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/auth/register");
    await page.waitForURL("/dashboard");
    await expect(page).toHaveURL("/dashboard");
  });

  test("should allow access to public pages without auth", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");

    await page.goto("/map");
    await expect(page).toHaveURL("/map");
  });
});
