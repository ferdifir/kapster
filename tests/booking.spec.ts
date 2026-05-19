import { test, expect } from "../fixtures";

test.describe("Booking Page", () => {
  test("should show 404 for non-existent barbershop", async ({ page }) => {
    await page.goto("/booking/non-existent-slug");
    await expect(page.getByText(/Not Found/i)).toBeVisible();
  });

  test("should display barbershop name", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/booking/${slug}`);

    await expect(page.getByText("Test Barbershop")).toBeVisible();
  });

  test("should display barbershop address", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/booking/${slug}`);

    await expect(page.getByText(/Jl\. Test No\. 1/)).toBeVisible();
    await expect(page.getByText("Jakarta")).toBeVisible();
  });

  test("should display booking form", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/booking/${slug}`);

    await expect(page.getByRole("textbox", { name: /Nama/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /No\. HP/i })).toBeVisible();
  });

  test("should show date picker for booking", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/booking/${slug}`);

    await expect(page.locator('input[type="date"]')).toBeVisible();
  });

  test("should show time slot selection", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/booking/${slug}`);

    await expect(page.getByText(/Pilih Waktu/i)).toBeVisible();
  });

  test("should show barber selection", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/booking/${slug}`);

    await expect(page.getByRole("combobox", { name: /Barber/i })).toBeVisible();
  });

  test("should show service selection", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/booking/${slug}`);

    await expect(page.getByRole("combobox", { name: /Layanan/i })).toBeVisible();
  });

  test("should require customer name for booking", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/booking/${slug}`);

    const submitButton = page.getByRole("button", { name: /Booking/i });
    await expect(submitButton).toBeDisabled();
  });

  test("should submit booking", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/booking/${slug}`);

    await page.getByRole("textbox", { name: /Nama/i }).fill("Booking Customer");
    await page.getByRole("textbox", { name: /No\. HP/i }).fill("081234567890");

    await page.getByRole("button", { name: /Booking/i }).click();

    await expect(page.getByText(/Berhasil/i)).toBeVisible();
  });

  test("should show link to queue page", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/booking/${slug}`);

    await expect(page.getByRole("link", { name: /daftar antrian walk-in/i })).toBeVisible();
  });

  test("should navigate to queue page", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/booking/${slug}`);

    await page.getByRole("link", { name: /daftar antrian walk-in/i }).click();
    await page.waitForURL(`/q/${slug}`);
    await expect(page).toHaveURL(`/q/${slug}`);
  });

  test("should display Kapster branding", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/booking/${slug}`);

    await expect(page.getByText("Kapster")).toBeVisible();
  });
});
