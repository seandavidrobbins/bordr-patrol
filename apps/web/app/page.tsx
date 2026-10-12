export const dynamic = "force-dynamic";

const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8000";

type Health = {
  status: string;
};

async function readHealth(): Promise<string> {
  try {
    const response = await fetch(`${apiUrl}/health`, { cache: "no-store" });
    if (!response.ok) {
      return "API unreachable";
    }
    const body = (await response.json()) as Health;
    return body.status;
  } catch {
    return "API unreachable";
  }
}

export default async function HomePage() {
  const status = await readHealth();

  return (
    <main>
      <h1>Bordr Patrol</h1>
      <p>A developer console for Bordrless hooks.</p>
      <p>API status: {status}</p>
    </main>
  );
}
