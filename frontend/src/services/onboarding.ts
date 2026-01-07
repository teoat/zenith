export async function fetchRoles() {
  const res = await fetch("/api/v1/onboarding/roles");
  if (!res.ok) throw new Error("Failed to fetch roles");
  return res.json();
}

export async function fetchRookieChecklist(userId: string) {
  const res = await fetch(`/api/v1/onboarding/rookie-checklist/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch checklist");
  return res.json();
}

export async function submitRookieChecklist(payload: any) {
  const res = await fetch("/api/v1/onboarding/rookie-checklist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to submit checklist");
  return res.json();
}
