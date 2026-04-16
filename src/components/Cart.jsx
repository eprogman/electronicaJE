// Para el hcaptcha y enviar pedido al backend en runtime

import React, { useState, useEffect, useRef } from "react";
const SITEKEY = import.meta.env.PUBLIC_HCAPTCHA_SITEKEY;

export default function Cart() {
    const [cart, setCart] = useState([]);
    const [cliente, setCliente] = useState({ nombre: "", email: "" });
    const [mensaje, setMensaje] = useState("");
    const [captchaToken, setCaptchaToken] = useState(null);
    const widgetIdRef = useRef(null);
    const captchaRef = useRef(null);

    // Cargar script de hCaptcha
    useEffect(() => {

        const script = document.createElement("script");
        script.src = "https://js.hcaptcha.com/1/api.js";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);


        // Definir función global para callback de hCaptcha
        window.onCaptchaSuccess = (token) => {
            console.log("Token generado:", token);
            setCaptchaToken(token);
        };

        return () => {
            // Limpiar funciones globales y script al desmontar
            document.body.removeChild(script);
            delete window.onCaptchaSuccess;
        };
    }, []);

    // Manejar reseteo del captcha
    const resetCaptcha = () => {
        setCaptchaToken(null);

        if (window.hcaptcha && widgetIdRef.current !== null) {
            window.hcaptcha.reset(widgetIdRef.current);
        }
    };

    // Guardar carrito en localStorage para persistencia
    useEffect(() => {
        const savedCart = localStorage.getItem("cart");
        if (savedCart) setCart(JSON.parse(savedCart));
    }, []);

    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        const botones = document.querySelectorAll(".add-to-cart");
        botones.forEach((btn) =>
            btn.addEventListener("click", () => {
                const producto = {
                    id: parseInt(btn.dataset.id),
                    nombre: btn.dataset.nombre,
                    precio: parseFloat(btn.dataset.precio),
                    cantidad: 1,
                };
                agregarProducto(producto); // función interna del carrito
            })
        );
    }, []);

    useEffect(() => {
        if (!window.hcaptcha || !captchaRef.current) return;
        else if (cart.length > 0 && window.hcaptcha) {
            widgetIdRef.current = window.hcaptcha.render(captchaRef.current, {
                sitekey: import.meta.env.PUBLIC_HCAPTCHA_SITEKEY,
                callback: window.onCaptchaSuccess,
            });
        }
    }, [cart.length > 0]);

    // Agregar producto al carrito
    const agregarProducto = (producto) => {
        const existe = cart.find((p) => p.id === producto.id);
        if (existe) {
            setCart(cart.map((p) => p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p));
        } else {
            setCart([...cart, { ...producto, cantidad: 1 }]);
        }
        setMensaje("");
    };

    // Eliminar producto
    const eliminarProducto = (id) => {
        setCart(cart.filter((p) => p.id !== id));
    };

    // Cambiar cantidad
    const cambiarCantidad = (id, cantidad) => {
        if (cantidad < 1) return;
        setCart(
            cart.map((p) => (p.id === id ? { ...p, cantidad } : p))
        );
    };

    // Calcular total
    const total = cart.reduce(
        (sum, p) => sum + p.precio * p.cantidad,
        0
    );

    // Enviar pedido al backend luego de validar HCAPTCHA
    const enviarPedido = async () => {
        // campos obligatorios
        if (!cliente.nombre || !cliente.email) {
            setMensaje("Completa tu nombre y correo");
            return;
        }
        // validar formato de correo
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cliente.email)) {
            setMensaje("Ingresa un correo válido");
            return;
        }
        if (cart.length === 0) {
            setMensaje("El carrito está vacío");
            return;
        }
        if (!captchaToken) {
            setMensaje("Debes completar el captcha");
            return;
        }

        try {
            const res = await fetch('/api/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productos: cart, cliente, captchaToken})
            });

            const data = await res.json();

            // Revisar status o contenido
            if (!res.ok) {
                // Error del endpoint (400, 500, etc.)
                console.error("Error:", data.error);
                resetCaptcha();   // reset si hay error
            } else if (data.ok === false) {
                // Captcha fallido
                console.error("Captcha inválido:", data.error);
                alert("Captcha inválido. Intenta de nuevo.");
            } else if (data.success === true) {
                setMensaje("Pedido enviado correctamente");
                setCart([]);
                setCliente({ nombre: "", email: "" });
                setCaptchaToken(null);
                if (window.resetCaptcha) {
                    window.resetCaptcha();
                }
                localStorage.removeItem("cart");
                resetCaptcha();       // reset también si fue exitoso
            } else {
                setMensaje(`Error: ${data.error}`);
                resetCaptcha();
            }


        } catch (error) {
            setMensaje(`Error de conexión: ${error.message}`);
            alert("No se pudo contactar al servidor. Intenta más tarde.");
        }

    };

    return (
        <div className="cart">
            <h2>Carrito de Compras</h2>

            {cart.length === 0 && <p>Aún no hay productos visibles en esta sección.</p>}

            {cart.map((producto) => (
                <div key={producto.id} className="cart-item">
                    <p className="text-red-600">{producto.nombre}</p>
                    <p>Precio: S/.{producto.precio}</p>
                    <p>
                        Cantidad:{" "}
                        <input
                            type="number"
                            value={producto.cantidad}
                            min="1"
                            onChange={(e) =>
                                cambiarCantidad(producto.id, parseInt(e.target.value))
                            }
                        />
                    </p>
                    <button onClick={() => eliminarProducto(producto.id)}>
                        Eliminar
                    </button>
                </div>
            ))}

            {cart.length > 0 && (
                <>
                    <h3>Total: S/. {total.toFixed(2)}</h3>

                    <h3>Datos del Cliente</h3>
                    <input
                        type="text"
                        placeholder="Nombre"
                        value={cliente.nombre}
                        onChange={(e) =>
                            setCliente({ ...cliente, nombre: e.target.value })
                        }
                    />
                    <input
                        type="email"
                        placeholder="Correo"
                        value={cliente.email}
                        pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                        required
                        onChange={(e) =>
                            setCliente({ ...cliente, email: e.target.value })
                        }
                    />

                    <div
                        ref={captchaRef}
                        className="h-captcha"
                        data-sitekey={SITEKEY}
                        data-callback="onCaptchaSuccess"
                    ></div>
                    <div id="hcaptcha-container"></div>
                    <button onClick={enviarPedido}>Enviar Pedido</button>
                </>
            )}

            {mensaje && <p className="mensaje">{mensaje}</p>}

            <style>{`
                .cart {
                    padding: 1rem;
                    background: #fff;
                    border-radius: 8px;
                    box-shadow: 0 6px 20px rgba(0,0,0,0.06);
                    width: 100%;
                    max-width: 420px;
                    margin: 1rem auto;
                    box-sizing: border-box;
                }
                .cart h2 { margin-top: 0; font-size: 1.25rem; }
                .cart h3{ font-weight: 600; }

                .cart-item {
                    border-bottom: 1px solid #eee;
                    margin-bottom: 0.75rem;
                    padding-bottom: 0.75rem;
                }

                .cart-item p { margin: 0.25rem 0.25rem; }

                input[type="number"],
                input[type="text"],
                input[type="email"] {
                    width: 100%;
                    margin: 0.4rem 0;
                    padding: 0.5rem;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    box-sizing: border-box;
                }

                button {
                    background: #0a6cff;
                    color: white;
                    border: none;
                    padding: 0.6rem 1rem;
                    margin-top: 0.5rem;
                    cursor: pointer;
                    border-radius: 6px;
                    font-weight: 600;
                }
                button:hover {
                    background: #084bb5;
                    transform: translateY(-1px);
                }
                .mensaje {
                    margin-top: 1rem;
                    font-weight: 600;
                    color: #dc2626;
                }

                .h-captcha {
                    margin: 0.75rem 0;
                    display: flex;
                    justify-content: center;
                }

                /* Responsive: full width on small, sticky on wide screens */
                @media (min-width: 900px) {
                    .cart {
                        position: sticky;
                        top: 1.5rem;
                        margin: 1rem 0;
                    }
                    .cart-item {
                        display: flex;
                        gap: 0.75rem;
                        align-items: center;
                    }
                    .cart-item p:first-child { flex: 1; font-weight: 600; }
                    .cart-item input[type="number"] { width: 80px; }
                }
                        `}</style>
        </div>
    );
}