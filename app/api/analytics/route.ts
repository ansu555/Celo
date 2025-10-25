export async function GET(req: Request) {
	// Minimal health-response for analytics route. This ensures the file is a valid module
	// and satisfies imports that expect an exported handler.
	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	})
}

