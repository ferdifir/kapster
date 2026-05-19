import { test, expect } from "../fixtures";

test.describe("Display Page (TV Queue)", () => {
  test("should show loading state initially", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/display/${slug}`);

    await expect(page.getByText(/Memuat/i)).toBeVisible();
  });

  test("should display barbershop name", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/display/${slug}`);

    await page.waitForTimeout(2000);
    await expect(page.getByText("Test Barbershop")).toBeVisible();
  });

  test("should display current time", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/display/${slug}`);

    await page.waitForTimeout(2000);
    const timeRegex = /\d{2}:\d{2}/;
    await expect(page.getByText(timeRegex)).toBeVisible();
  });

  test("should show queue closed message when queue is not open", async ({ loginAsOwner, seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();

    await page.goto("/dashboard/queue");
    await page.getByRole("button", { name: /Tutup Antrian/i }).click();
    await page.waitForTimeout(1000);

    await page.goto(`/display/${slug}`);
    await page.waitForTimeout(2000);

    await expect(page.getByText("TUTUP")).toBeVisible();
    await expect(page.getByText(/Antrian belum dibuka/i)).toBeVisible();
  });

  test("should display serving section", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/display/${slug}`);

    await page.waitForTimeout(2000);
    await expect(page.getByText(/Sedang Dilayani/i)).toBeVisible();
  });

  test("should display called section", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/display/${slug}`);

    await page.waitForTimeout(2000);
    await expect(page.getByText(/Dipanggil Berikutnya/i)).toBeVisible();
  });

  test("should display queue number when serving", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/display/${slug}`);

    await page.waitForTimeout(2000);
    await expect(page.getByText(/pelanggan selesai/i)).toBeVisible();
  });

  test("should show placeholder when no one is being served", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/display/${slug}`);

    await page.waitForTimeout(2000);
    await expect(page.getByText("—")).toBeVisible();
  });

  test("should display Kapster branding", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/display/${slug}`);

    await page.waitForTimeout(2000);
    await expect(page.getByText("Kapster")).toBeVisible();
  });

  test("should have large text for TV visibility", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.goto(`/display/${slug}`);

    await page.waitForTimeout(2000);
    const heading = page.getByText(/Sedang Dilayani/i);
    const box = await heading.boundingBox();
    expect(box?.height).toBeGreaterThan(20);
  });

  test("should be responsive on large screens", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`/display/${slug}`);

    await page.waitForTimeout(2000);
    await expect(page.getByText("Test Barbershop")).toBeVisible();
  });
});
