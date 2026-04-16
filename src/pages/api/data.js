    
    export const prerender = false;
    const ApiUrl = import.meta.env.API_ENDPOINT;
    const token = import.meta.env.API_TOKEN; // Token desde variable de entorno;

    export async function GET() {

        try {
            const res = await fetch(ApiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                cache: "no-store"
            });
            if (!res.ok) {
                return new Response(JSON.stringify({ error: "Error en API" }), {
                    status: res.status,
                });
            }

            // Aquí ya NO es JSON como texto, sino un objeto JS
            const json = await res.json();

            // Convierte el objeto JS otra vez a JSON en texto para la respuesta
            return new Response(JSON.stringify(json), {
                status: 200,
                headers: {
                    "Content-Type": "application/json"
                }
            });

        } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), {
                status: 500
            });
        } 
    }


    export async function POST({ request }) {

    try {
        // 🔹 Leer datos enviados desde el frontend (productos(un array con datos del producto), cliente(objeto con datos del correo) y captchaToken), y guardar en constante body
        const body = await request.json();

        const res = await fetch(`${ApiUrl}/pedido`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });
        //Astro (debug)
        //const errorText = await res.text();
        //console.log("ERROR BACKEND:", errorText);
        if (!res.ok) {
            return new Response(JSON.stringify({
                success: false,
                error: "Error en API externa"
            }), { status: res.status });
        }

        const result = await res.json();

        return new Response(JSON.stringify({success: true, data: result}), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500
        });
    }
}