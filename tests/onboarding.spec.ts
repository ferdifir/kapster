import { test, expect } from "../fixtures";

test.describe("Onboarding", () => {
  test("should show step 1 of onboarding form", async ({ page }) => {
    await page.goto("/auth/login");
    const testEmail = `onboard_${Date.now()}@test.com`;
    const testPassword = "TestPassword123!";

    await page.evaluate(async ({ email, password }) => {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      return res.status;
    }, { email: testEmail, password: testPassword });

    await page.goto("/auth/login");
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("/onboarding", { timeout: 10000 });

    await expect(page.getByRole("heading", { name: /Setup Barbershop/i })).toBeVisible();
    await expect(page.getByText(/Langkah 1 dari 2/i)).toBeVisible();
    await expect(page.getByRole("textbox", { name: /Nama Barbershop/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /URL Antrian/i })).toBeVisible();
  });

  test("should auto-generate slug from name", async ({ page }) => {
    await page.goto("/auth/login");
    const testEmail = `onboard_${Date.now()}@test.com`;
    const testPassword = "TestPassword123!";

    await page.goto("/auth/login");
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("/onboarding", { timeout: 10000 });

    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill("Gentlemen Barbershop");

    const slugInput = page.locator('input[type="text"]').nth(1);
    await expect(slugInput).toHaveValue("gentlemen-barbershop");
  });

  test("should allow manual slug editing", async ({ page }) => {
    await page.goto("/auth/login");
    const testEmail = `onboard_${Date.now()}@test.com`;
    const testPassword = "TestPassword123!";

    await page.goto("/auth/login");
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("/onboarding", { timeout: 10000 });

    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill("Test Shop");

    const slugInput = page.locator('input[type="text"]').nth(1);
    await slugInput.fill("my-custom-slug");

    await nameInput.fill("Another Name");
    await expect(slugInput).toHaveValue("my-custom-slug");
  });

  test("should navigate to step 2", async ({ page }) => {
    await page.goto("/auth/login");
    const testEmail = `onboard_${Date.now()}@test.com`;
    const testPassword = "TestPassword123!";

    await page.goto("/auth/login");
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("/onboarding", { timeout: 10000 });

    await page.locator('input[type="text"]').first().fill("Test Barbershop");
    await page.getByRole("button", { name: /Lanjut/i }).click();

    await expect(page.getByText(/Langkah 2 dari 2/i)).toBeVisible();
    await expect(page.getByRole("textbox", { name: /WhatsApp/i })).toBeVisible();
  });

  test("should show default services preview on step 2", async ({ page }) => {
    await page.goto("/auth/login");
    const testEmail = `onboard_${Date.now()}@test.com`;
    const testPassword = "TestPassword123!";

    await page.goto("/auth/login");
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("/onboarding", { timeout: 10000 });

    await page.locator('input[type="text"]').first().fill("Test Barbershop");
    await page.getByRole("button", { name: /Lanjut/i }).click();

    await expect(page.getByText("Potong Rambut")).toBeVisible();
    await expect(page.getByText("Cukur Jenggot")).toBeVisible();
    await expect(page.getByText("Potong + Jenggot")).toBeVisible();
    await expect(page.getByText("Rp30.000")).toBeVisible();
  });

  test("should go back from step 2 to step 1", async ({ page }) => {
    await page.goto("/auth/login");
    const testEmail = `onboard_${Date.now()}@test.com`;
    const testPassword = "TestPassword123!";

    await page.goto("/auth/login");
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("/onboarding", { timeout: 10000 });

    await page.locator('input[type="text"]').first().fill("Test Barbershop");
    await page.getByRole("button", { name: /Lanjut/i }).click();
    await page.getByRole("button", { name: /Kembali/i }).click();

    await expect(page.getByText(/Langkah 1 dari 2/i)).toBeVisible();
  });

  test("should complete onboarding and redirect to dashboard", async ({ page }) => {
    await page.goto("/auth/login");
    const testEmail = `onboard_${Date.now()}@test.com`;
    const testPassword = "TestPassword123!";

    await page.goto("/auth/login");
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("/onboarding", { timeout: 10000 });

    await page.locator('input[type="text"]').first().fill("Test Barbershop");
    await page.getByRole("button", { name: /Lanjut/i }).click();
    await page.getByRole("button", { name: /Selesai/i }).click();

    await page.waitForURL("/dashboard", { timeout: 10000 });
    await expect(page).toHaveURL("/dashboard");
  });

  test("should show progress bar", async ({ page }) => {
    await page.goto("/auth/login");
    const testEmail = `onboard_${Date.now()}@test.com`;
    const testPassword = "TestPassword123!";

    await page.goto("/auth/login");
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("/onboarding", { timeout: 10000 });

    const progressBars = page.locator('[class*="rounded-full"]');
    await expect(progressBars).toHaveCount(2);
  });
});
