import { test, expect } from "../fixtures";

test.describe("E2E - Full Owner Journey", () => {
  test("complete flow: register -> onboarding -> manage queue", async ({ page }) => {
    const testEmail = `e2e_${Date.now()}@test.com`;
    const testPassword = "TestPassword123!";

    await test.step("Register new account", async () => {
      await page.goto("/auth/register");
      await page.fill('input[name="full_name"]', "E2E Owner");
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL("/onboarding", { timeout: 10000 });
    });

    await test.step("Complete onboarding step 1", async () => {
      await expect(page.getByRole("heading", { name: /Setup Barbershop/i })).toBeVisible();
      await page.locator('input[type="text"]').first().fill("E2E Barbershop");
      await expect(page.locator('input[type="text"]').nth(1)).toHaveValue("e2e-barbershop");
      await page.getByRole("button", { name: /Lanjut/i }).click();
    });

    await test.step("Complete onboarding step 2", async () => {
      await expect(page.getByText(/Langkah 2 dari 2/i)).toBeVisible();
      await page.getByRole("textbox", { name: /WhatsApp/i }).fill("81234567890");
      await page.getByRole("button", { name: /Selesai/i }).click();
      await page.waitForURL("/dashboard", { timeout: 10000 });
    });

    await test.step("Verify dashboard", async () => {
      await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible();
      await expect(page.getByText("E2E Barbershop")).toBeVisible();
    });

    await test.step("Navigate to queue management", async () => {
      await page.goto("/dashboard/queue");
      await expect(page.getByRole("heading", { name: /Antrian/i })).toBeVisible();
    });

    await test.step("Open queue", async () => {
      await page.getByRole("button", { name: /Buka Antrian/i }).click();
      await expect(page.getByText("Buka")).toBeVisible();
    });

    await test.step("Add customer to queue", async () => {
      await page.getByRole("button", { name: /\+ Tambah/i }).click();
      await page.getByRole("textbox", { name: /Nama Pelanggan/i }).fill("E2E Customer");
      await page.getByRole("textbox", { name: /No\. HP/i }).fill("081234567890");
      await page.getByRole("button", { name: /Tambah ke Antrian/i }).click();
      await expect(page.getByText("E2E Customer")).toBeVisible();
    });

    await test.step("Process customer through queue", async () => {
      const row = page.locator("text=E2E Customer").locator("..").locator("..");
      await row.getByRole("button", { name: /Panggil/i }).click();
      await page.waitForTimeout(500);

      await page.locator("text=E2E Customer").locator("..").locator("..").getByRole("button", { name: /Layani/i }).click();
      await page.waitForTimeout(500);

      await page.locator("text=E2E Customer").locator("..").locator("..").getByRole("button", { name: /Selesai/i }).click();
      await expect(page.getByText("Selesai")).toBeVisible();
    });

    await test.step("Navigate to barbers management", async () => {
      await page.goto("/dashboard/barbers");
      await expect(page.getByRole("heading", { name: /Barber/i })).toBeVisible();
    });

    await test.step("Add new barber", async () => {
      await page.getByRole("button", { name: /Tambah Barber/i }).click();
      await page.getByRole("textbox", { name: /Nama Barber/i }).fill("E2E Barber");
      await page.getByRole("textbox", { name: /Email Barber/i }).fill(`barber_${Date.now()}@test.com`);
      await page.getByRole("button", { name: /Simpan/i }).click();
      await expect(page.getByText("E2E Barber")).toBeVisible();
    });

    await test.step("Navigate to services management", async () => {
      await page.goto("/dashboard/services");
      await expect(page.getByRole("heading", { name: /Layanan/i })).toBeVisible();
    });

    await test.step("Add new service", async () => {
      await page.getByRole("button", { name: /Tambah Layanan/i }).click();
      await page.getByRole("textbox", { name: /Nama Layanan/i }).fill("E2E Service");
      await page.getByRole("textbox", { name: /Harga/i }).fill("50000");
      await page.getByRole("textbox", { name: /Durasi/i }).fill("45");
      await page.getByRole("button", { name: /Simpan/i }).click();
      await expect(page.getByText("E2E Service")).toBeVisible();
    });

    await test.step("Navigate to settings", async () => {
      await page.goto("/dashboard/settings");
      await expect(page.getByRole("heading", { name: /Pengaturan/i })).toBeVisible();
    });

    await test.step("Update settings", async () => {
      await page.getByRole("textbox", { name: /Nama Barbershop/i }).fill("Updated E2E Barbershop");
      await page.getByRole("button", { name: /Simpan/i }).click();
      await expect(page.getByText(/Berhasil/i)).toBeVisible();
    });

    await test.step("Verify public queue page", async () => {
      await page.goto("/q/e2e-barbershop");
      await expect(page.getByText("Updated E2E Barbershop")).toBeVisible();
    });

    await test.step("Verify booking page", async () => {
      await page.goto("/booking/e2e-barbershop");
      await expect(page.getByText("Updated E2E Barbershop")).toBeVisible();
    });

    await test.step("Verify display page", async () => {
      await page.goto("/display/e2e-barbershop");
      await page.waitForTimeout(2000);
      await expect(page.getByText("Updated E2E Barbershop")).toBeVisible();
    });

    await test.step("Logout", async () => {
      await page.goto("/dashboard");
      const sidebar = page.locator("aside");
      await sidebar.getByRole("button", { name: /Keluar/i }).click();
      await page.waitForURL("/auth/login");
      await expect(page).toHaveURL("/auth/login");
    });
  });
});

test.describe("E2E - Customer Journey", () => {
  test("customer joins queue and checks status", async ({ seedBarbershopWithData }) => {
    const { slug } = await seedBarbershopWithData();

    await test.step("Visit public queue page", async () => {
      await page.goto(`/q/${slug}`);
      await expect(page.getByText("Test Barbershop")).toBeVisible();
    });

    await test.step("Check queue stats", async () => {
      await expect(page.getByText("Sedang Menunggu")).toBeVisible();
      await expect(page.locator("text=2").first()).toBeVisible();
    });

    await test.step("Join the queue", async () => {
      await page.getByRole("textbox", { name: /Nama/i }).fill("Walk-in Customer");
      await page.getByRole("textbox", { name: /No\. HP/i }).fill("089876543210");
      await page.getByRole("combobox", { name: /Layanan/i }).selectOption({ label: "Potong Rambut" });
      await page.getByRole("button", { name: /Daftar Antrian/i }).click();
      await expect(page.getByText(/Berhasil/i)).toBeVisible();
    });

    await test.step("Visit booking page", async () => {
      await page.goto(`/booking/${slug}`);
      await expect(page.getByText("Test Barbershop")).toBeVisible();
    });

    await test.step("Make a booking", async () => {
      await page.getByRole("textbox", { name: /Nama/i }).fill("Booking Customer");
      await page.getByRole("textbox", { name: /No\. HP/i }).fill("08111222333");
      await page.getByRole("button", { name: /Booking/i }).click();
      await expect(page.getByText(/Berhasil/i)).toBeVisible();
    });

    await test.step("Check TV display", async () => {
      await page.goto(`/display/${slug}`);
      await page.waitForTimeout(2000);
      await expect(page.getByText("Test Barbershop")).toBeVisible();
    });
  });
});

test.describe("E2E - Queue Status Flow", () => {
  test("complete queue status lifecycle", async ({ seedBarbershopWithData }) => {
    await seedBarbershopWithData();

    await test.step("Open queue management", async () => {
      await page.goto("/dashboard/queue");
      await expect(page.getByText("Buka")).toBeVisible();
    });

    await test.step("Add three customers", async () => {
      await page.getByRole("button", { name: /\+ Tambah/i }).click();
      await page.getByRole("textbox", { name: /Nama Pelanggan/i }).fill("Customer A");
      await page.getByRole("button", { name: /Tambah ke Antrian/i }).click();
      await expect(page.getByText("Customer A")).toBeVisible();

      await page.getByRole("button", { name: /\+ Tambah/i }).click();
      await page.getByRole("textbox", { name: /Nama Pelanggan/i }).fill("Customer B");
      await page.getByRole("button", { name: /Tambah ke Antrian/i }).click();
      await expect(page.getByText("Customer B")).toBeVisible();

      await page.getByRole("button", { name: /\+ Tambah/i }).click();
      await page.getByRole("textbox", { name: /Nama Pelanggan/i }).fill("Customer C");
      await page.getByRole("button", { name: /Tambah ke Antrian/i }).click();
      await expect(page.getByText("Customer C")).toBeVisible();
    });

    await test.step("Process Customer A: waiting -> called -> serving -> done", async () => {
      await page.locator("text=Customer A").locator("..").locator("..").getByRole("button", { name: /Panggil/i }).click();
      await page.waitForTimeout(500);
      await expect(page.locator("text=Customer A").locator("..").locator("..").getByText("Dipanggil")).toBeVisible();

      await page.locator("text=Customer A").locator("..").locator("..").getByRole("button", { name: /Layani/i }).click();
      await page.waitForTimeout(500);
      await expect(page.locator("text=Customer A").locator("..").locator("..").getByText("Dilayani")).toBeVisible();

      await page.locator("text=Customer A").locator("..").locator("..").getByRole("button", { name: /Selesai/i }).click();
      await page.waitForTimeout(500);
      await expect(page.locator("text=Customer A").locator("..").locator("..").getByText("Selesai")).toBeVisible();
    });

    await test.step("Skip Customer B", async () => {
      await page.locator("text=Customer B").locator("..").locator("..").getByRole("button", { name: /Skip/i }).click();
      await page.waitForTimeout(500);
      await expect(page.locator("text=Customer B").locator("..").locator("..").getByText("Skip")).toBeVisible();
    });

    await test.step("Verify stats updated", async () => {
      await expect(page.locator("text=1").nth(3)).toBeVisible();
    });

    await test.step("Close queue", async () => {
      await page.getByRole("button", { name: /Tutup Antrian/i }).click();
      await expect(page.getByText("Tutup")).toBeVisible();
    });
  });
});
