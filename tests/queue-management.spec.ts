import { test, expect } from "../fixtures";

test.describe("Queue Management", () => {
  test("should display queue management page", async ({ seedBarbershopWithData }) => {
    await seedBarbershopWithData();
    await page.goto("/dashboard/queue");

    await expect(page.getByRole("heading", { name: /Antrian/i })).toBeVisible();
    await expect(page.getByText(/Menunggu/i)).toBeVisible();
    await expect(page.getByText(/Dipanggil/i)).toBeVisible();
    await expect(page.getByText(/Dilayani/i)).toBeVisible();
    await expect(page.getByText(/Selesai/i)).toBeVisible();
  });

  test("should show queue status as open", async ({ seedBarbershopWithData }) => {
    await seedBarbershopWithData();
    await page.goto("/dashboard/queue");

    await expect(page.getByText("Buka")).toBeVisible();
    await expect(page.getByRole("button", { name: /Tutup Antrian/i })).toBeVisible();
  });

  test("should close queue", async ({ seedBarbershopWithData }) => {
    await seedBarbershopWithData();
    await page.goto("/dashboard/queue");

    await page.getByRole("button", { name: /Tutup Antrian/i }).click();
    await expect(page.getByText("Tutup")).toBeVisible();
    await expect(page.getByRole("button", { name: /Buka Antrian/i })).toBeVisible();
  });

  test("should reopen queue after closing", async ({ seedBarbershopWithData }) => {
    await seedBarbershopWithData();
    await page.goto("/dashboard/queue");

    await page.getByRole("button", { name: /Tutup Antrian/i }).click();
    await expect(page.getByText("Tutup")).toBeVisible();

    await page.getByRole("button", { name: /Buka Antrian/i }).click();
    await expect(page.getByText("Buka")).toBeVisible();
  });

  test("should display existing queue entries", async ({ seedBarbershopWithData }) => {
    await seedBarbershopWithData();
    await page.goto("/dashboard/queue");

    await expect(page.getByText("Customer 1")).toBeVisible();
    await expect(page.getByText("Customer 2")).toBeVisible();
  });

  test("should show add customer form when queue is open", async ({ seedBarbershopWithData }) => {
    await seedBarbershopWithData();
    await page.goto("/dashboard/queue");

    await expect(page.getByRole("button", { name: /\+ Tambah/i })).toBeVisible();
    await page.getByRole("button", { name: /\+ Tambah/i }).click();

    await expect(page.getByRole("textbox", { name: /Nama Pelanggan/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /No\. HP/i })).toBeVisible();
    await expect(page.getByRole("combobox", { name: /Layanan/i })).toBeVisible();
    await expect(page.getByRole("combobox", { name: /Barber/i })).toBeVisible();
  });

  test("should add customer to queue", async ({ seedBarbershopWithData }) => {
    await seedBarbershopWithData();
    await page.goto("/dashboard/queue");

    await page.getByRole("button", { name: /\+ Tambah/i }).click();
    await page.getByRole("textbox", { name: /Nama Pelanggan/i }).fill("New Customer");
    await page.getByRole("textbox", { name: /No\. HP/i }).fill("081234567890");
    await page.getByRole("button", { name: /Tambah ke Antrian/i }).click();

    await expect(page.getByText("New Customer")).toBeVisible();
  });

  test("should require customer name when adding", async ({ seedBarbershopWithData }) => {
    await seedBarbershopWithData();
    await page.goto("/dashboard/queue");

    await page.getByRole("button", { name: /\+ Tambah/i }).click();
    const addButton = page.getByRole("button", { name: /Tambah ke Antrian/i });
    await expect(addButton).toBeDisabled();
  });

  test("should call customer (waiting -> called)", async ({ seedBarbershopWithData }) => {
    await seedBarbershopWithData();
    await page.goto("/dashboard/queue");

    const row = page.locator("text=Customer 1").locator("..").locator("..");
    await row.getByRole("button", { name: /Panggil/i }).click();

    await expect(page.getByText("Dipanggil")).toBeVisible();
  });

  test("should serve customer (called -> serving)", async ({ seedBarbershopWithData }) => {
    await seedBarbershopWithData();
    await page.goto("/dashboard/queue");

    const row = page.locator("text=Customer 1").locator("..").locator("..");
    await row.getByRole("button", { name: /Panggil/i }).click();
    await page.waitForTimeout(500);

    const calledRow = page.locator("text=Customer 1").locator("..").locator("..");
    await calledRow.getByRole("button", { name: /Layani/i }).click();

    await expect(page.getByText("Dilayani")).toBeVisible();
  });

  test("should complete customer (serving -> done)", async ({ seedBarbershopWithData }) => {
    await seedBarbershopWithData();
    await page.goto("/dashboard/queue");

    const row = page.locator("text=Customer 1").locator("..").locator("..");
    await row.getByRole("button", { name: /Panggil/i }).click();
    await page.waitForTimeout(500);

    const calledRow = page.locator("text=Customer 1").locator("..").locator("..");
    await calledRow.getByRole("button", { name: /Layani/i }).click();
    await page.waitForTimeout(500);

    const servingRow = page.locator("text=Customer 1").locator("..").locator("..");
    await servingRow.getByRole("button", { name: /Selesai/i }).click();

    await expect(page.getByText("Selesai")).toBeVisible();
  });

  test("should skip customer", async ({ seedBarbershopWithData }) => {
    await seedBarbershopWithData();
    await page.goto("/dashboard/queue");

    const row = page.locator("text=Customer 1").locator("..").locator("..");
    await row.getByRole("button", { name: /Skip/i }).click();

    await expect(page.getByText("Skip")).toBeVisible();
  });

  test("should show date picker for queue date", async ({ seedBarbershopWithData }) => {
    await seedBarbershopWithData();
    await page.goto("/dashboard/queue");

    await expect(page.locator('input[type="date"]')).toBeVisible();
  });

  test("should display queue stats correctly", async ({ seedBarbershopWithData }) => {
    await seedBarbershopWithData();
    await page.goto("/dashboard/queue");

    await expect(page.locator("text=2").first()).toBeVisible();
  });

  test("should show empty queue message when no entries", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/queue");

    await expect(page.getByText(/Antrian kosong/i)).toBeVisible();
  });

  test("should show finished entries section", async ({ seedBarbershopWithData }) => {
    await seedBarbershopWithData();
    await page.goto("/dashboard/queue");

    const row = page.locator("text=Customer 1").locator("..").locator("..");
    await row.getByRole("button", { name: /Panggil/i }).click();
    await page.waitForTimeout(500);

    const calledRow = page.locator("text=Customer 1").locator("..").locator("..");
    await calledRow.getByRole("button", { name: /Layani/i }).click();
    await page.waitForTimeout(500);

    const servingRow = page.locator("text=Customer 1").locator("..").locator("..");
    await servingRow.getByRole("button", { name: /Selesai/i }).click();

    await expect(page.getByRole("heading", { name: /Selesai/i })).toBeVisible();
  });
});
