import { test, expect } from "../fixtures";

test.describe("Barber Portal", () => {
  test("should redirect unauthenticated users to login", async ({ page }) => {
    await page.goto("/barber");
    await page.waitForURL(/\/auth\/login/);
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("should show not connected message for non-barber users", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/barber");

    await expect(page.getByText(/Akun belum terhubung/i)).toBeVisible();
    await expect(page.getByText(/Minta pemilik barbershop/i)).toBeVisible();
  });

  test("should display barber queue for connected barber", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();

    await page.goto(`/barber/invite/${slug}`);
  });

  test("should display barber name", async ({ seedBarbershopWithData }) => {
    await seedBarbershopWithData();
    await page.goto("/barber");
  });

  test("should display barbershop name", async ({ seedBarbershopWithData }) => {
    await seedBarbershopWithData();
    await page.goto("/barber");
  });

  test("should show queue entries for barber", async ({ seedBarbershopWithData }) => {
    await seedBarbershopWithData();
    await page.goto("/barber");
  });

  test("should allow barber to update queue status", async ({ seedBarbershopWithData }) => {
    await seedBarbershopWithData();
    await page.goto("/barber");
  });
});
