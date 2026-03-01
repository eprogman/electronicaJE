import nodemailer from "nodemailer";

export async function enviarCorreo(productos, cliente) {

    const transporter = nodemailer.createTransport({
        service: "resend",
        auth: {
            user: import.meta.meta.env.EMAIL_USER,
            pass: import.meta.env.EMAIL_PASS,
        }
    });

    const lista = productos.map(p =>
        `Producto ID: ${p.id} - Cantidad: ${p.cantidad}`
    ).join("\n");

    await transporter.sendMail({
        from: "ventas@midominio.com",
        to: "ventas@midominio.com",
        subject: "Nuevo Pedido Web",
        text: `
        Cliente: ${cliente.nombre}
        Email: ${cliente.email}

        Productos:
        ${lista}
    `
    });
}