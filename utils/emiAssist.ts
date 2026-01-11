// src/utils/emiAssist.ts
export interface EmiAssistPayload {
  productId: string;
  variantId?: string;
  bank: "HDFC" | "ICICI" | "BAJAJ";
  name: string;
  phone: string;
  email?: string;
  pan?: string;
}

export async function submitEmiAssist(payload: EmiAssistPayload) {
  const res = await fetch("/api/emi-assist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error?.message || "Failed to submit EMI request");
  }

  return res.json();
}
