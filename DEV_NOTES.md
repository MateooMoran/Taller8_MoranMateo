Requerimientos para funcionalidades añadidas

Este proyecto ahora usa:
- @react-native-async-storage/async-storage -> para persistir sesión de Supabase en móvil
- expo-image-picker -> para seleccionar imágenes desde galería y tomar fotos con la cámara

Instalación (desde la raíz del proyecto):

# Instalar AsyncStorage (React Native)
expo install @react-native-async-storage/async-storage

# Instalar ImagePicker
expo install expo-image-picker

# Si usas TypeScript/yarn/npm
npm install

Notas:
- Asegúrate de tener las variables de entorno EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY en tu archivo `.env`.
- Para Android/iOS en Expo managed workflow, `expo-image-picker` solicitará permisos en tiempo de ejecución.
- Después de instalar dependencias, reinicia el bundler: `expo start -c`.

Cómo probar rápidamente:
1. Inicia la app en un dispositivo físico o emulador con cámara.
2. Inicia sesión; la sesión debe persistir después de cerrar y volver a abrir la app.
3. En crear receta, prueba seleccionar imagen o tomar foto. En editar receta, prueba cambiar o eliminar la imagen.
