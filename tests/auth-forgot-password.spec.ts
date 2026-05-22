import { test, expect } from "../fixtures";

test.describe("Forgot Password", () => {
  test.describe("Forgot Password Page", () => {
    test("should display forgot password form", async ({ page }) => {
      await page.goto("/auth/forgot-password");
      await expect(page.getByRole("heading", { name: /Lupa Password/i })).toBeVisible();
      await expect(page.getByRole("textbox", { name: /Nomor WhatsApp/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /Kirim Kode OTP/i })).toBeVisible();
    });

    test("should show link back to login", async ({ page }) => {
      await page.goto("/auth/forgot-password");
      await page.getByRole("link", { name: /Kembali ke halaman login/i }).click();
      await page.waitForURL("/auth/login");
      await expect(page).toHaveURL("/auth/login");
    });

    test("should show forgot password link on login page", async ({ page }) => {
      await page.goto("/auth/login");
      await expect(page.getByRole("link", { name: /Lupa password/i })).toBeVisible();
      await page.getByRole("link", { name: /Lupa password/i }).click();
      await page.waitForURL("/auth/forgot-password");
      await expect(page).toHaveURL("/auth/forgot-password");
    });
  });

  test.describe("Forgot Password Verify Page", () => {
    test("should display phone number and 6 OTP inputs", async ({ page }) => {
      await page.goto("/auth/forgot-password/verify?phone=628123456789");
      await expect(page.getByText(/628123456789/)).toBeVisible();
      await expect(page.getByText(/Ganti nomor WhatsApp/i)).toBeVisible();
      const otpInputs = page.locator("input[inputmode='numeric']");
      await expect(otpInputs).toHaveCount(6);
    });

    test("should show link to change phone number", async ({ page }) => {
      await page.goto("/auth/forgot-password/verify?phone=628123456789");
      await page.getByRole("link", { name: /Ganti nomor WhatsApp/i }).click();
      await page.waitForURL("/auth/forgot-password");
      await expect(page).toHaveURL("/auth/forgot-password");
    });
  });

  test.describe("Forgot Password Reset Page", () => {
    test("should display new password form", async ({ page }) => {
      await page.goto("/auth/forgot-password/reset?phone=628123456789");
      await expect(page.getByRole("heading", { name: /Buat Password Baru/i })).toBeVisible();
      await expect(page.getByText(/Password Baru/)).toBeVisible();
      await expect(page.getByText(/Konfirmasi Password/)).toBeVisible();
      await expect(page.getByRole("button", { name: /Simpan Password Baru/i })).toBeVisible();
    });
  });

  test.describe("Registration Phone Field", () => {
    test("should display phone field on registration form", async ({ page }) => {
      await page.goto("/auth/register");
      await expect(page.getByRole("heading", { name: /Daftar Gratis/i })).toBeVisible();
      await expect(page.getByRole("textbox", { name: /Nomor WhatsApp/i })).toBeVisible();
    });

    test("should validate required registration fields including phone", async ({ page }) => {
      await page.goto("/auth/register");
      await page.fill('input[name="full_name"]', "Test User");
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "TestPassword123!");
      await page.fill('input[name="phone"]', "");
      await page.click('button[type="submit"]');
      const phoneInput = page.locator('input[name="phone"]');
      await expect(phoneInput).toHaveJSProperty("validity.valid", false);
    });

    test("should validate phone format on registration", async ({ page }) => {
      await page.goto("/auth/register");
      await page.fill('input[name="full_name"]', "Test User");
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "TestPassword123!");
      await page.fill('input[name="phone"]', "invalid");
      await page.click('button[type="submit"]');
      await expect(page.getByText(/Format nomor HP/i)).toBeVisible();
    });
  });
});
