import { pool } from "../../lib/db";

export async function GET() {
    const [rows] = await pool.query(
        "SELECT * FROM productos WHERE activo = true"
    );

    return new Response(JSON.stringify(rows), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}

