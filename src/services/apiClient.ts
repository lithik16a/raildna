// Browser-side fetch helper shared by the client services.

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError("Network error. Check your connection and try again.", 0);
  }
  if (res.status === 401) {
    window.location.href = "/login";
    throw new ApiError("Session expired. Redirecting to sign in…", 401);
  }
  const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok) throw new ApiError(data?.error ?? `Request failed (${res.status}).`, res.status);
  return data as T;
}
