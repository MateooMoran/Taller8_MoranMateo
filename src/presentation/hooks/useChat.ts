import { useState, useEffect, useCallback, useRef } from "react";
import { ChatUseCase } from "@/src/domain/useCases/chat/ChatUseCase";
import { Mensaje } from "@/src/domain/models/Mensaje";

const chatUseCase = new ChatUseCase();

export const useChat = () => {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  // typing state: map usuario_id -> email
  const [typingMap, setTypingMap] = useState<Record<string, string>>({});
  const typingTimeoutRef = useRef<any>(null);
  const isTypingLocalRef = useRef(false);

  // Cargar mensajes históricos
  const cargarMensajes = useCallback(async () => {
    setCargando(true);
    const mensajesObtenidos = await chatUseCase.obtenerMensajes();
    setMensajes(mensajesObtenidos);
    setCargando(false);
  }, []);

  // Enviar mensaje
  const enviarMensaje = useCallback(async (contenido: string) => {
    if (!contenido.trim()) return { success: false, error: "El mensaje está vacío" };

    setEnviando(true);
    const resultado = await chatUseCase.enviarMensaje(contenido);

    // Asegurar que el indicador de escritura se detenga cuando se envía
    try {
      await chatUseCase.enviarTyping(false);
      isTypingLocalRef.current = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    } catch {}

    setEnviando(false);

    return resultado;
  }, []);

  // Llamar cuando el usuario empieza a escribir (debounced stop)
  const startTyping = useCallback(async () => {
    try {
      // Si no estamos en estado local typing, avisar true
      if (!isTypingLocalRef.current) {
        isTypingLocalRef.current = true;
        await chatUseCase.enviarTyping(true);
      }

      // Reiniciar el timeout de stop typing
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(async () => {
        isTypingLocalRef.current = false;
        await chatUseCase.enviarTyping(false);
        typingTimeoutRef.current = null;
      }, 1500);
    } catch (err) {
      console.error('Error startTyping:', err);
    }
  }, []);

  // Eliminar mensaje
  const eliminarMensaje = useCallback(async (mensajeId: string) => {
    const resultado = await chatUseCase.eliminarMensaje(mensajeId);
    if (resultado.success) {
      setMensajes(prev => prev.filter(m => m.id !== mensajeId));
    }
    return resultado;
  }, []);

  // Suscribirse a mensajes y a typing
  useEffect(() => {
    cargarMensajes();

    const desuscribirMensajes = chatUseCase.suscribirseAMensajes((nuevoMensaje) => {
      setMensajes(prev => {
        if (prev.some(m => m.id === nuevoMensaje.id)) return prev;
        return [...prev, nuevoMensaje];
      });
    });

    const desuscribirTyping = chatUseCase.suscribirseATyping((payload) => {
      setTypingMap(prev => {
        const copy = { ...prev };
        if (payload.isTyping) {
          copy[payload.usuario_id] = payload.email || "Desconocido";
        } else {
          delete copy[payload.usuario_id];
        }
        return copy;
      });
    });

    return () => {
      desuscribirMensajes();
      desuscribirTyping();
    };
  }, [cargarMensajes]);

  // Derivar array de typing (emails)
  const typingUsers = Object.values(typingMap);

  return {
    mensajes,
    cargando,
    enviando,
    enviarMensaje,
    eliminarMensaje,
    recargarMensajes: cargarMensajes,
    // typing
    typingUsers,
    startTyping,
  };
};