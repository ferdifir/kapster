const WUZAPI_URL = process.env.WUZAPI_URL || "https://wa.linkjo.my.id";
const WUZAPI_ADMIN_TOKEN = process.env.WUZAPI_ADMIN_TOKEN || "";

interface WuzApiResponse<T = unknown> {
  code: number;
  data: T;
  success: boolean;
}

interface WuzApiUser {
  id: string;
  name: string;
  token: string;
  webhook: string;
  jid: string;
  qrcode: string;
  connected: boolean;
  loggedIn: boolean;
  expiration: number;
  events: string;
}

interface WuzApiSessionStatus {
  id: string;
  name: string;
  connected: boolean;
  loggedIn: boolean;
  token: string;
  jid: string;
  qrcode: string;
}

function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createWuzApiUser(barbershopId: string): Promise<{
  userId: string;
  token: string;
} | null> {
  const token = generateToken();
  const res = await fetch(`${WUZAPI_URL}/admin/users`, {
    method: "POST",
    headers: {
      Authorization: WUZAPI_ADMIN_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `kapster-${barbershopId}`,
      token,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    console.error(`[WuzAPI] createWuzApiUser failed: ${res.status} ${errorText}`);
    return null;
  }

  const data = (await res.json()) as WuzApiResponse<WuzApiUser>;
  if (!data.success) return null;

  return { userId: data.data.id, token: data.data.token };
}

export async function deleteWuzApiUser(userId: string): Promise<boolean> {
  const res = await fetch(`${WUZAPI_URL}/admin/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: WUZAPI_ADMIN_TOKEN },
  });
  return res.ok;
}

export async function connectSession(userToken: string): Promise<{
  connected: boolean;
  loggedIn: boolean;
  jid: string;
} | { error: string; status: number }> {
  const res = await fetch(`${WUZAPI_URL}/session/connect`, {
    method: "POST",
    headers: {
      Token: userToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Subscribe: ["Message", "ReadReceipt"],
      Immediate: false,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    let errorMessage = `WuzAPI error ${res.status}`;
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.error) errorMessage += `: ${errorData.error}`;
    } catch {
      if (errorText) errorMessage += `: ${errorText}`;
    }
    if (res.status === 401) errorMessage = "Token tidak valid. Disconnect dan connect ulang untuk membuat token baru.";
    return { error: errorMessage, status: res.status };
  }
  const data = await res.json();
  return {
    connected: true,
    loggedIn: !!data.jid,
    jid: data.jid || "",
  };
}
}

export async function getQrCode(userToken: string): Promise<string | null> {
  const res = await fetch(`${WUZAPI_URL}/session/status`, {
    headers: { Token: userToken },
  });

  if (!res.ok) return null;
  const data = (await res.json()) as WuzApiResponse<WuzApiSessionStatus>;
  return data.data.qrcode || null;
}

export async function getSessionStatus(userToken: string): Promise<{
  connected: boolean;
  loggedIn: boolean;
  jid: string;
} | null> {
  const res = await fetch(`${WUZAPI_URL}/session/status`, {
    headers: { Token: userToken },
  });

  if (!res.ok) return null;
  const data = (await res.json()) as WuzApiResponse<WuzApiSessionStatus>;
  return {
    connected: data.data.connected,
    loggedIn: data.data.loggedIn,
    jid: data.data.jid || "",
  };
}

export async function disconnectSession(userToken: string): Promise<boolean> {
  const res = await fetch(`${WUZAPI_URL}/session/disconnect`, {
    method: "POST",
    headers: { Token: userToken },
  });
  return res.ok;
}

export async function sendTextMessage(
  userToken: string,
  phone: string,
  body: string
): Promise<{ messageId: string; success: boolean; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(`${WUZAPI_URL}/chat/send/text`, {
      method: "POST",
      headers: {
        Token: userToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ Phone: phone, Body: body }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text();
      return {
        messageId: "",
        success: false,
        error: `WuzAPI error ${res.status}: ${text}`,
      };
    }

    const data = (await res.json()) as WuzApiResponse<{ Id: string }>;
    return {
      messageId: data.data?.Id || "",
      success: true,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { messageId: "", success: false, error: message };
  }
}
