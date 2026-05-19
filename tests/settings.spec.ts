import { test, expect } from "../fixtures";

test.describe("Settings", () => {
  test("should display settings page", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/settings");

    await expect(page.getByRole("heading", { name: /Pengaturan/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /Nama Barbershop/i })).toBeVisible();
  });

  test("should show barbershop name field", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/settings");

    await expect(page.getByRole("textbox", { name: /Nama Barbershop/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /Nama Barbershop/i })).toHaveValue("Test Barbershop");
  });

  test("should show slug field (read-only)", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/settings");

    const slugInput = page.getByRole("textbox", { name: /Slug/i });
    await expect(slugInput).toBeVisible();
  });

  test("should show address field", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/settings");

    await expect(page.getByRole("textbox", { name: /Alamat/i })).toBeVisible();
  });

  test("should show city field", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/settings");

    await expect(page.getByRole("textbox", { name: /Kota/i })).toBeVisible();
  });

  test("should show phone field", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/settings");

    await expect(page.getByRole("textbox", { name: /Telepon/i })).toBeVisible();
  });

  test("should show WhatsApp number field", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/settings");

    await expect(page.getByRole("textbox", { name: /WhatsApp/i })).toBeVisible();
  });

  test("should update barbershop name", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/settings");

    const nameInput = page.getByRole("textbox", { name: /Nama Barbershop/i });
    await nameInput.fill("Updated Barbershop Name");

    await page.getByRole("button", { name: /Simpan/i }).click();

    await expect(page.getByText(/Berhasil disimpan/i)).toBeVisible();
  });

  test("should update address", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/settings");

    const addressInput = page.getByRole("textbox", { name: /Alamat/i });
    await addressInput.fill("Jl. Updated Address No. 123");

    await page.getByRole("button", { name: /Simpan/i }).click();

    await expect(page.getByText(/Berhasil disimpan/i)).toBeVisible();
  });

  test("should update city", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/settings");

    const cityInput = page.getByRole("textbox", { name: /Kota/i });
    await cityInput.fill("Surabaya");

    await page.getByRole("button", { name: /Simpan/i }).click();

    await expect(page.getByText(/Berhasil disimpan/i)).toBeVisible();
  });

  test("should update WhatsApp number", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/settings");

    const waInput = page.getByRole("textbox", { name: /WhatsApp/i });
    await waInput.fill("81234567890");

    await page.getByRole("button", { name: /Simpan/i }).click();

    await expect(page.getByText(/Berhasil disimpan/i)).toBeVisible();
  });

  test("should show logo upload section", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/settings");

    await expect(page.getByText(/Logo/i)).toBeVisible();
  });

  test("should show WhatsApp connection status", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/settings");

    await expect(page.getByText(/WhatsApp/i)).toBeVisible();
  });

  test("should show map location picker", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/settings");

    await expect(page.getByText(/Lokasi/i)).toBeVisible();
  });
});
