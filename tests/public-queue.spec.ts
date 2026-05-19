import { test, expect } from "../fixtures";

test.describe("Public Queue Page", () => {
  test("should show 404 for non-existent barbershop", async ({ page }) => {
    await page.goto("/q/non-existent-slug");
    await expect(page.getByText(/Not Found/i)).toBeVisible();
  });

  test("should display barbershop name", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/q/${slug}`);

    await expect(page.getByText("Test Barbershop")).toBeVisible();
  });

  test("should display barbershop city", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/q/${slug}`);

    await expect(page.getByText("Jakarta")).toBeVisible();
  });

  test("should display date picker", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/q/${slug}`);

    await expect(page.getByText(/Pilih Tanggal Antrian/i)).toBeVisible();
  });

  test("should display queue stats", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/q/${slug}`);

    await expect(page.getByText("Sedang Menunggu")).toBeVisible();
    await expect(page.getByText("Selesai")).toBeVisible();
  });

  test("should show join queue form when queue is open", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/q/${slug}`);

    await expect(page.getByRole("textbox", { name: /Nama/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /No\. HP/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Daftar Antrian/i })).toBeVisible();
  });

  test("should show queue closed message when closed", async ({ loginAsOwner, seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();

    await page.goto("/dashboard/queue");
    await page.getByRole("button", { name: /Tutup Antrian/i }).click();
    await page.waitForTimeout(1000);

    await page.goto(`/q/${slug}`);
    await expect(page.getByText(/Antrian Hari Ini Belum Dibuka/i)).toBeVisible();
  });

  test("should join queue with name only", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/q/${slug}`);

    await page.getByRole("textbox", { name: /Nama/i }).fill("Queue Customer");
    await page.getByRole("button", { name: /Daftar Antrian/i }).click();

    await expect(page.getByText(/Berhasil/i)).toBeVisible();
    await expect(page.getByText(/Nomor Antrian/i)).toBeVisible();
  });

  test("should show service selection", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/q/${slug}`);

    await expect(page.getByRole("combobox", { name: /Layanan/i })).toBeVisible();
    await expect(page.getByText("Potong Rambut")).toBeVisible();
  });

  test("should show barber selection", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/q/${slug}`);

    await expect(page.getByRole("combobox", { name: /Barber/i })).toBeVisible();
    await expect(page.getByText("Andi")).toBeVisible();
    await expect(page.getByText("Budi")).toBeVisible();
  });

  test("should require customer name", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/q/${slug}`);

    const submitButton = page.getByRole("button", { name: /Daftar Antrian/i });
    await expect(submitButton).toBeDisabled();
  });

  test("should display queue number after joining", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/q/${slug}`);

    await page.getByRole("textbox", { name: /Nama/i }).fill("New Queue");
    await page.getByRole("button", { name: /Daftar Antrian/i }).click();

    await expect(page.getByText(/Nomor Antrian/i)).toBeVisible();
  });

  test("should show waiting position", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/q/${slug}`);

    await expect(page.locator("text=2").first()).toBeVisible();
  });

  test("should display Kapster branding", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/q/${slug}`);

    await expect(page.getByText("Kapster")).toBeVisible();
  });

  test("should show future date message", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    await page.goto(`/q/${slug}?date=${dateStr}`);

    await expect(page.getByText(/Antrian untuk tanggal/i)).toBeVisible();
  });
});
