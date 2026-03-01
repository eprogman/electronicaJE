import React, { useState, useEffect } from "react";

export default function Cart() {
    const [cart, setCart] = useState([]);
    const [cliente, setCliente] = useState({ nombre: "", email: "" });
    const [mensaje, setMensaje] = useState("");

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

    // Enviar pedido al backend
    const enviarPedido = async () => {
        if (!cliente.nombre || !cliente.email) {
            setMensaje("Completa tu nombre y correo");
            return;
        }
        if (cart.length === 0) {
            setMensaje("El carrito está vacío");
            return;
        }

        try {
            const res = await fetch("/api/pedido", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productos: cart, cliente }),
            });

            const data = await res.json();

            if (data.success) {
                setMensaje("Pedido enviado correctamente");
                setCart([]);
                setCliente({ nombre: "", email: "" });
                localStorage.removeItem("cart");
            } else {
                setMensaje(`Error: ${data.error}`);
            }
        } catch (error) {
            setMensaje(`Error de conexión: ${error.message}`);
        }
    };

    return (
        <div className="cart">
            <h2>Carrito de Compras</h2>

            {cart.length === 0 && <p>El carrito está vacío</p>}

            {cart.map((producto) => (
                <div key={producto.id} className="cart-item">
                    <p>{producto.nombre}</p>
                    <p>Precio: $ {producto.precio}</p>
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
                    <h3>Total: $ {total.toFixed(2)}</h3>

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
                        onChange={(e) =>
                            setCliente({ ...cliente, email: e.target.value })
                        }
                    />

                    <button onClick={enviarPedido}>Enviar Pedido</button>
                </>
            )}

            {mensaje && <p className="mensaje">{mensaje}</p>}

            <style jsx>{`
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

                .cart-item {
                    border-bottom: 1px solid #eee;
                    margin-bottom: 0.75rem;
                    padding-bottom: 0.75rem;
                }

                .cart-item p { margin: 0.25rem 0; }

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