import { pool } from "../../lib/db";
import { enviarCorreo } from "../../lib/mailer";

export async function POST({ request }) {
    const data = await request.json();
    const { productos, cliente } = data;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        for (const item of productos) {
            const [rows] = await connection.query(
                "SELECT stock FROM productos WHERE id = ? FOR UPDATE",
                [item.id]
            );

            if (!rows.length || rows[0].stock < item.cantidad) {
                throw new Error(`Stock insuficiente para producto ID ${item.id}`);
            }

            await connection.query(
                "UPDATE productos SET stock = stock - ? WHERE id = ?",
                [item.cantidad, item.id]
            );
        }

        await connection.commit();

        // Enviar correo con pedido
        await enviarCorreo(productos, cliente);

        return new Response(
            JSON.stringify({ success: true }),
            { status: 200 }
        );

    } catch (error) {
        await connection.rollback();
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400 }
        );
    } finally {
        connection.release();
    }
}