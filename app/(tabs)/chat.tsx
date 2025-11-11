import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useChat } from "@/src/presentation/hooks/useChat";
import { useAuth } from "@/src/presentation/hooks/useAuth";
import { Mensaje } from "@/src/domain/models/Mensaje";

export default function ChatScreen() {
  const { mensajes, cargando, enviando, enviarMensaje, typingUsers, startTyping } = useChat();
  const { usuario } = useAuth();
  const [textoMensaje, setTextoMensaje] = useState("");
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll al final cuando llegan nuevos mensajes
  useEffect(() => {
    if (mensajes.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [mensajes]);

  const handleEnviar = async () => {
    if (!textoMensaje.trim() || enviando) return;

    const mensaje = textoMensaje;
    setTextoMensaje(""); // Limpiar input inmediatamente

    const resultado = await enviarMensaje(mensaje);

    if (!resultado.success) {
      alert("Error: " + resultado.error);
      setTextoMensaje(mensaje); // Restaurar mensaje si falló
    }
  };

  const renderMensaje = ({ item }: { item: Mensaje }) => {
    const esMio = item.usuario_id === usuario?.id;
    // Preferir el email denormalizado (`usuario_email`) para evitar problemas con RLS
    // Si no existe, usar el join `item.usuario?.email`, y como último recurso el email del usuario autenticado
    const emailUsuario =
      item.usuario_email || item.usuario?.email || (item.usuario_id === usuario?.id ? usuario?.email : undefined) || "Usuario desconocido";

    return (
      <View
        style={[
          styles.mensajeContainer,
          esMio ? styles.mensajeMio : styles.mensajeOtro,
        ]}
      >
        {/* Mostrar etiqueta del autor (correo electrónico) para identificar al remitente */}
        <Text style={[styles.nombreUsuario, esMio ? styles.nombreUsuarioMio : undefined]}>
          {emailUsuario}
        </Text>
        <Text style={[
          styles.contenidoMensaje,
          esMio && styles.contenidoMensajeMio
        ]}>
          {item.contenido}
        </Text>
        <Text style={[
          styles.horaMensaje,
          esMio && styles.horaMensajeMio
        ]}>
          {new Date(item.created_at).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
    );
  };

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.textoCargando}>Cargando mensajes...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <FlatList
        ref={flatListRef}
        data={mensajes}
        renderItem={renderMensaje}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {/* Indicador de escritura (excluir al usuario local) */}
      {(() => {
        const otherTyping = typingUsers.filter((e) => e !== usuario?.email);
        if (otherTyping.length === 0) return null;
        return (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>
              {otherTyping.length === 1
                ? `${otherTyping[0]} está escribiendo...`
                : `${otherTyping.join(', ')} están escribiendo...`}
            </Text>
          </View>
        );
      })()}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={textoMensaje}
          onChangeText={(t) => {
            setTextoMensaje(t);
            startTyping();
          }}
          placeholder="Escribe un mensaje..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.botonEnviar,
            (!textoMensaje.trim() || enviando) && styles.botonDeshabilitado,
          ]}
          onPress={handleEnviar}
          disabled={!textoMensaje.trim() || enviando}
        >
          <Text style={styles.textoBotonEnviar}>
            {enviando ? "..." : "Enviar"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  centrado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  textoCargando: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  listContainer: {
    padding: 16,
  },
  mensajeContainer: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  mensajeMio: {
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
  },
  mensajeOtro: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  nombreUsuario: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  contenidoMensaje: {
    fontSize: 16,
    color: "#000",
  },
  contenidoMensajeMio: {
    color: "#FFF",
  },
  horaMensaje: {
    fontSize: 10,
    color: "#999",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  horaMensajeMio: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    fontSize: 16,
  },
  botonEnviar: {
    marginLeft: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#007AFF",
    borderRadius: 20,
    justifyContent: "center",
  },
  botonDeshabilitado: {
    backgroundColor: "#CCC",
  },
  textoBotonEnviar: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
});
