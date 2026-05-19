import { test, expect } from "../fixtures";

test.describe("Authentication", () => {
  test.describe("Login", () => {
    test("should display login form", async ({ page }) => {
      await page.goto("/auth/login");
      await expect(page.getByRole("heading", { name: /Masuk ke Dashboard/i })).toBeVisible();
      await expect(page.getByRole("textbox", { name: /Email/i })).toBeVisible();
      await expect(page.getByRole("textbox", { name: /Password/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /Masuk/i })).toBeVisible();
    });

    test("should show link to register page", async ({ page }) => {
      await page.goto("/auth/login");
      await page.getByRole("link", { name: /Daftar gratis/i }).click();
      await page.waitForURL("/auth/register");
      await expect(page).toHaveURL("/auth/register");
    });

    test("should show error with invalid credentials", async ({ page }) => {
      await page.goto("/auth/login");
      await page.fill('input[type="email"]', "invalid@test.com");
      await page.fill('input[type="password"]', "wrongpassword");
      await page.click('button[type="submit"]');
      await expect(page.getByText(/Email atau password salah/i)).toBeVisible();
    });

    test("should validate required fields", async ({ page }) => {
      await page.goto("/auth/login");
      await page.click('button[type="submit"]');
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toHaveJSProperty("validity.valid", false);
    });

    test("should redirect authenticated users away from login", async ({ loginAsOwner }) => {
      await loginAsOwner();
      await page.goto("/auth/login");
      await page.waitForURL("/dashboard");
      await expect(page).toHaveURL("/dashboard");
    });
  });

  test.describe("Register", () => {
    test("should display registration form", async ({ page }) => {
      await page.goto("/auth/register");
      await expect(page.getByRole("heading", { name: /Daftar Gratis/i })).toBeVisible();
      await expect(page.getByRole("textbox", { name: /Nama Lengkap/i })).toBeVisible();
      await expect(page.getByRole("textbox", { name: /Email/i })).toBeVisible();
      await expect(page.getByRole("textbox", { name: /Password/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /Daftar/i })).toBeVisible();
    });

    test("should show link to login page", async ({ page }) => {
      await page.goto("/auth/register");
      await page.getByRole("link", { name: /Masuk/i }).click();
      await page.waitForURL("/auth/login");
      await expect(page).toHaveURL("/auth/login");
    });

    test("should validate password minimum length", async ({ page }) => {
      await page.goto("/auth/register");
      await page.fill('input[name="full_name"]', "Test User");
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "short");
      await page.click('button[type="submit"]');
      const passwordInput = page.locator('input[name="password"]');
      await expect(passwordInput).toHaveJSProperty("validity.valid", false);
    });

    test("should validate email format", async ({ page }) => {
      await page.goto("/auth/register");
      await page.fill('input[name="full_name"]', "Test User");
      await page.fill('input[name="email"]', "not-an-email");
      await page.fill('input[name="password"]', "TestPassword123!");
      await page.click('button[type="submit"]');
      const emailInput = page.locator('input[name="email"]');
      await expect(emailInput).toHaveJSProperty("validity.valid", false);
    });

    test("should show terms and privacy links", async ({ page }) => {
      await page.goto("/auth/register");
      await expect(page.getByRole("link", { name: /Syarat & Ketentuan/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /Kebijakan Privasi/i })).toBeVisible();
    });

    test("should redirect authenticated users away from register", async ({ loginAsOwner }) => {
      await loginAsOwner();
      await page.goto("/auth/register");
      await page.waitForURL("/dashboard");
      await expect(page).toHaveURL("/dashboard");
    });
  });

  test.describe("Logout", () => {
    test("should logout successfully", async ({ loginAsOwner }) => {
      await loginAsOwner();
      await page.goto("/dashboard");

      const sidebar = page.locator("aside");
      await sidebar.getByRole("button", { name: /Keluar/i }).click();

      await page.waitForURL("/auth/login");
      await expect(page).toHaveURL("/auth/login");
    });
  });
});
