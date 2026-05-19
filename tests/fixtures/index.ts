import { test as base, expect, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

let adminClient: SupabaseClient | null = null;

function getAdminClient(): SupabaseClient {
  if (!adminClient) {
    adminClient = createClient(supabaseUrl, supabaseServiceKey);
  }
  return adminClient;
}

export type TestFixtures = {
  loginAsOwner: (email?: string, password?: string) => Promise<{ email: string; password: string }>;
  createTestBarbershop: (ownerId: string, overrides?: Record<string, unknown>) => Promise<{ id: string; slug: string }>;
  cleanupTestData: () => Promise<void>;
  seedBarbershopWithData: (slug?: string) => Promise<{
    ownerId: string;
    barbershopId: string;
    slug: string;
    email: string;
    password: string;
  }>;
};

const test = base.extend<TestFixtures>({
  loginAsOwner: async ({ page }, use) => {
    let createdUserId = "";
    let createdBarbershopId = "";

    const loginAsOwner = async (email?: string, password?: string) => {
      const testEmail = email || `owner_${Date.now()}@test.com`;
      const testPassword = password || "TestPassword123!";

      const supabase = getAdminClient();

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
      });

      if (authError) throw authError;
      createdUserId = authData.user.id;

      const slug = `test-shop-${Date.now()}`;
      const { data: shop, error: shopError } = await supabase
        .from("barbershops")
        .insert({
          owner_id: createdUserId,
          name: "Test Barbershop",
          slug,
          city: "Jakarta",
          address: "Jl. Test No. 1",
        })
        .select("id, slug")
        .single();

      if (shopError) throw shopError;
      createdBarbershopId = shop.id;

      await supabase.from("subscriptions").insert({
        barbershop_id: shop.id,
        plan: "basic",
        status: "active",
        max_barbers: 3,
        max_queue_per_day: 50,
      });

      await supabase.from("services").insert([
        { barbershop_id: shop.id, name: "Potong Rambut", price: 30000, duration_min: 30 },
        { barbershop_id: shop.id, name: "Cukur Jenggot", price: 20000, duration_min: 20 },
      ]);

      await page.goto("/auth/login");
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL("/dashboard", { timeout: 10000 });

      return { email: testEmail, password: testPassword };
    };

    await use(loginAsOwner);
  },

  createTestBarbershop: async ({}, use) => {
    const createdIds: string[] = [];

    const createTestBarbershop = async (ownerId: string, overrides = {}) => {
      const supabase = getAdminClient();
      const slug = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const { data, error } = await supabase
        .from("barbershops")
        .insert({
          owner_id: ownerId,
          name: "Test Barbershop",
          slug,
          city: "Jakarta",
          ...overrides,
        })
        .select("id, slug")
        .single();

      if (error) throw error;
      createdIds.push(data.id);
      return data;
    };

    await use(createTestBarbershop);
  },

  cleanupTestData: async ({}, use) => {
    await use(async () => {});
  },

  seedBarbershopWithData: async ({ page }, use) => {
    let ownerId = "";
    let barbershopId = "";
    let email = "";
    let password = "";

    const seedBarbershopWithData = async (slugOverride?: string) => {
      const supabase = getAdminClient();
      email = `owner_${Date.now()}@test.com`;
      password = "TestPassword123!";
      const slug = slugOverride || `test-shop-${Date.now()}`;

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (authError) throw authError;
      ownerId = authData.user.id;

      const { data: shop, error: shopError } = await supabase
        .from("barbershops")
        .insert({
          owner_id: ownerId,
          name: "Test Barbershop",
          slug,
          city: "Jakarta",
          address: "Jl. Test No. 1",
        })
        .select("id, slug")
        .single();
      if (shopError) throw shopError;
      barbershopId = shop.id;

      await supabase.from("subscriptions").insert({
        barbershop_id: shop.id,
        plan: "basic",
        status: "active",
        max_barbers: 3,
        max_queue_per_day: 50,
      });

      const { data: services } = await supabase
        .from("services")
        .insert([
          { barbershop_id: shop.id, name: "Potong Rambut", price: 30000, duration_min: 30 },
          { barbershop_id: shop.id, name: "Cukur Jenggot", price: 20000, duration_min: 20 },
          { barbershop_id: shop.id, name: "Potong + Jenggot", price: 45000, duration_min: 45 },
        ])
        .select("id");

      const { data: barbers } = await supabase
        .from("barbers")
        .insert([
          { barbershop_id: shop.id, display_name: "Andi", is_active: true },
          { barbershop_id: shop.id, display_name: "Budi", is_active: true },
        ])
        .select("id");

      const today = new Date().toISOString().split("T")[0];
      const { data: queue } = await supabase
        .from("queues")
        .insert({
          barbershop_id: shop.id,
          date: today,
          is_open: true,
          total_served: 0,
        })
        .select("id")
        .single();

      if (queue && services && barbers) {
        await supabase.from("queue_entries").insert([
          {
            queue_id: queue.id,
            number: 1,
            customer_name: "Customer 1",
            phone: "081234567890",
            status: "waiting",
            service_id: services[0].id,
            barber_id: barbers[0].id,
          },
          {
            queue_id: queue.id,
            number: 2,
            customer_name: "Customer 2",
            phone: "081234567891",
            status: "waiting",
            service_id: services[1].id,
            barber_id: barbers[1].id,
          },
        ]);
      }

      await page.goto("/auth/login");
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForURL("/dashboard", { timeout: 10000 });

      return { ownerId, barbershopId, slug, email, password };
    };

    await use(seedBarbershopWithData);
  },
});

export { expect };
export default test;
