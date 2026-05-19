import { test, expect } from "../fixtures";

test.describe("Barbers Management", () => {
  test("should display barbers management page", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/barbers");

    await expect(page.getByRole("heading", { name: /Barber/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Tambah Barber/i })).toBeVisible();
  });

  test("should show add barber form", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/barbers");

    await page.getByRole("button", { name: /Tambah Barber/i }).click();
    await expect(page.getByRole("textbox", { name: /Nama Barber/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /Email Barber/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Simpan/i })).toBeVisible();
  });

  test("should add new barber", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/barbers");

    await page.getByRole("button", { name: /Tambah Barber/i }).click();
    await page.getByRole("textbox", { name: /Nama Barber/i }).fill("New Barber");
    await page.getByRole("textbox", { name: /Email Barber/i }).fill(`barber_${Date.now()}@test.com`);
    await page.getByRole("button", { name: /Simpan/i }).click();

    await expect(page.getByText("New Barber")).toBeVisible();
  });

  test("should require barber name", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/barbers");

    await page.getByRole("button", { name: /Tambah Barber/i }).click();
    const saveButton = page.getByRole("button", { name: /Simpan/i });
    await expect(saveButton).toBeDisabled();
  });

  test("should display existing barbers", async ({ seedBarbershopWithData }) => {
    await seedBarbershopWithData();
    await page.goto("/dashboard/barbers");

    await expect(page.getByText("Andi")).toBeVisible();
    await expect(page.getByText("Budi")).toBeVisible();
  });

  test("should toggle barber active status", async ({ seedBarbershopWithData }) => {
    await seedBarbershopWithData();
    await page.goto("/dashboard/barbers");

    const barberRow = page.locator("text=Andi").locator("..").locator("..");
    const toggleButton = barberRow.locator("button").first();
    await toggleButton.click();

    await expect(page.getByText(/Nonaktif/i)).toBeVisible();
  });

  test("should delete barber", async ({ seedBarbershopWithData }) => {
    await seedBarbershopWithData();
    await page.goto("/dashboard/barbers");

    const barberRow = page.locator("text=Andi").locator("..").locator("..");
    const deleteButton = barberRow.locator("button").last();
    await deleteButton.click();

    await expect(page.getByText("Andi")).not.toBeVisible();
  });

  test("should show barber count limit", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/barbers");

    await expect(page.getByText(/maks/i)).toBeVisible();
  });

  test("should show invite link for barber", async ({ seedBarbershopWithData }) => {
    await seedBarbershopWithData();
    await page.goto("/dashboard/barbers");

    await expect(page.getByRole("button", { name: /Undang/i })).toBeVisible();
  });

  test("should copy invite link", async ({ seedBarbershopWithData }) => {
    await seedBarbershopWithData();
    await page.goto("/dashboard/barbers");

    await expect(page.getByRole("button", { name: /Salin/i })).toBeVisible();
  });
});
