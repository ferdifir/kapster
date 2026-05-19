import { test, expect } from "../fixtures";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should load homepage with correct title", async ({ page }) => {
    await expect(page).toHaveTitle(/Kapster/i);
  });

  test("should display navbar with logo and navigation", async ({ page }) => {
    await expect(page.getByText("Kapster").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Masuk/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Coba Gratis/i })).toBeVisible();
  });

  test("should display all navigation links", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Fitur" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Cara Kerja" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Harga" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Testimoni" })).toBeVisible();
  });

  test("should display hero section with CTA", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /Mulai Gratis/i })).toBeVisible();
  });

  test("should display brand logos section", async ({ page }) => {
    await expect(page.getByText(/Dipercaya oleh/i)).toBeVisible();
  });

  test("should display problem section", async ({ page }) => {
    await expect(page.getByText(/Masalah di Barbershop/i)).toBeVisible();
  });

  test("should display features section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Fitur/i })).toBeVisible();
  });

  test("should display how it works section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Cara Kerja/i })).toBeVisible();
  });

  test("should display pricing section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Harga/i })).toBeVisible();
    await expect(page.getByText(/Gratis/i)).toBeVisible();
  });

  test("should display testimonials section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Testimoni/i })).toBeVisible();
  });

  test("should display CTA section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Siap/i })).toBeVisible();
  });

  test("should display footer with links", async ({ page }) => {
    await expect(page.getByText(/Kapster/i).last()).toBeVisible();
    await expect(page.getByRole("link", { name: /Privacy Policy/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Terms/i })).toBeVisible();
  });

  test("should navigate to login page", async ({ page }) => {
    await page.getByRole("link", { name: /Masuk/i }).first().click();
    await page.waitForURL("/auth/login");
    await expect(page).toHaveURL("/auth/login");
  });

  test("should navigate to register page", async ({ page }) => {
    await page.getByRole("link", { name: /Coba Gratis/i }).click();
    await page.waitForURL("/auth/register");
    await expect(page).toHaveURL("/auth/register");
  });

  test("should have responsive mobile menu", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const menuButton = page.getByRole("button", { name: /Toggle menu/i });
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    await expect(page.getByRole("link", { name: "Fitur" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Masuk" })).toBeVisible();
  });

  test("should navigate to map page", async ({ page }) => {
    await page.goto("/map");
    await expect(page).toHaveURL("/map");
  });

  test("should access legal pages", async ({ page }) => {
    await page.goto("/privacy-policy");
    await expect(page).toHaveURL("/privacy-policy");

    await page.goto("/terms-of-service");
    await expect(page).toHaveURL("/terms-of-service");

    await page.goto("/cookie-policy");
    await expect(page).toHaveURL("/cookie-policy");
  });
});
