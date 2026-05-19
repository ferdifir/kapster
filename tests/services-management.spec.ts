import { test, expect } from "../fixtures";

test.describe("Services Management", () => {
  test("should display services management page", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/services");

    await expect(page.getByRole("heading", { name: /Layanan/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Tambah Layanan/i })).toBeVisible();
  });

  test("should show default services after onboarding", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/services");

    await expect(page.getByText("Potong Rambut")).toBeVisible();
    await expect(page.getByText("Cukur Jenggot")).toBeVisible();
    await expect(page.getByText("Potong + Jenggot")).toBeVisible();
  });

  test("should show add service form", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/services");

    await page.getByRole("button", { name: /Tambah Layanan/i }).click();
    await expect(page.getByRole("textbox", { name: /Nama Layanan/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /Harga/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /Durasi/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Simpan/i })).toBeVisible();
  });

  test("should add new service", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/services");

    await page.getByRole("button", { name: /Tambah Layanan/i }).click();
    await page.getByRole("textbox", { name: /Nama Layanan/i }).fill("Hair Coloring");
    await page.getByRole("textbox", { name: /Harga/i }).fill("100000");
    await page.getByRole("textbox", { name: /Durasi/i }).fill("60");
    await page.getByRole("button", { name: /Simpan/i }).click();

    await expect(page.getByText("Hair Coloring")).toBeVisible();
    await expect(page.getByText("Rp100.000")).toBeVisible();
  });

  test("should require service name", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/services");

    await page.getByRole("button", { name: /Tambah Layanan/i }).click();
    const saveButton = page.getByRole("button", { name: /Simpan/i });
    await expect(saveButton).toBeDisabled();
  });

  test("should edit existing service", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/services");

    const editButton = page.locator("text=Potong Rambut").locator("..").locator("..").getByRole("button", { name: /Edit/i });
    await editButton.click();

    await expect(page.getByRole("textbox", { name: /Nama Layanan/i })).toHaveValue("Potong Rambut");
    await expect(page.getByRole("textbox", { name: /Harga/i })).toHaveValue("30000");
  });

  test("should update service price", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/services");

    const editButton = page.locator("text=Potong Rambut").locator("..").locator("..").getByRole("button", { name: /Edit/i });
    await editButton.click();

    await page.getByRole("textbox", { name: /Harga/i }).fill("35000");
    await page.getByRole("button", { name: /Simpan/i }).click();

    await expect(page.getByText("Rp35.000")).toBeVisible();
  });

  test("should delete service", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/services");

    const deleteButton = page.locator("text=Potong Rambut").locator("..").locator("..").getByRole("button", { name: /Hapus/i });
    await deleteButton.click();

    await expect(page.getByText("Potong Rambut")).not.toBeVisible();
  });

  test("should toggle service active status", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/services");

    const toggleButton = page.locator("text=Potong Rambut").locator("..").locator("..").getByRole("button").first();
    await toggleButton.click();

    await expect(page.getByText(/Nonaktif/i)).toBeVisible();
  });

  test("should display service duration", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/services");

    await expect(page.getByText("30 menit")).toBeVisible();
    await expect(page.getByText("20 menit")).toBeVisible();
  });

  test("should validate price is a number", async ({ loginAsOwner }) => {
    await loginAsOwner();
    await page.goto("/dashboard/services");

    await page.getByRole("button", { name: /Tambah Layanan/i }).click();
    await page.getByRole("textbox", { name: /Nama Layanan/i }).fill("Test Service");
    await page.getByRole("textbox", { name: /Harga/i }).fill("abc");

    const priceInput = page.getByRole("textbox", { name: /Harga/i });
    await expect(priceInput).toHaveJSProperty("validity.valid", false);
  });
});
