import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../../data/services/supabaseClient";
import { Receta } from "../../models/Receta";

export class RecipesUseCase {
  // Obtener todas las recetas
  async obtenerRecetas(): Promise<Receta[]> {
    try {
      const { data, error } = await supabase
        .from("recetas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.log("Error al obtener recetas:", error);
      return [];
    }
  }

  // Buscar recetas por ingrediente
  async buscarPorIngrediente(ingrediente: string): Promise<Receta[]> {
    try {
      const buscado = ingrediente.trim().toLowerCase();
      if (!buscado) return await this.obtenerRecetas();

      // Obtener todas las recetas y filtrar en cliente por elemento exacto del array (case-insensitive)
      const recetas = await this.obtenerRecetas();
      const filtradas = recetas.filter((r) =>
        r.ingredientes.some((ing) => ing.trim().toLowerCase() === buscado)
      );

      return filtradas;
    } catch (error) {
      console.log("Error en búsqueda:", error);
      return [];
    }
  }

  // Crear nueva receta
  async crearReceta(
    titulo: string,
    descripcion: string,
    ingredientes: string[],
    chefId: string,
    imagenUri?: string
  ) {
    try {
      let imagenUrl = null;

      // Si hay imagen, la subimos primero
      if (imagenUri) {
        imagenUrl = await this.subirImagen(imagenUri);
      }

      const { data, error } = await supabase
        .from("recetas")
        .insert({
          titulo,
          descripcion,
          ingredientes,
          chef_id: chefId,
          imagen_url: imagenUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, receta: data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Actualizar receta existente
  async actualizarReceta(
    id: string,
    titulo: string,
    descripcion: string,
    ingredientes: string[],
    imagenUri?: string | null
  ) {
    try {
      let imagenUrl: string | null | undefined = undefined;

      // Si imagenUri === null -> eliminar imagen (set null)
      if (imagenUri === null) {
        imagenUrl = null;
      } else if (imagenUri) {
        // nueva imagen: subirla
        imagenUrl = await this.subirImagen(imagenUri);
      }

      const updateBody: any = {
        titulo,
        descripcion,
        ingredientes,
      };

      if (imagenUrl !== undefined) {
        updateBody.imagen_url = imagenUrl;
      }

      const { data, error } = await supabase
        .from("recetas")
        .update(updateBody)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, receta: data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Eliminar receta
  async eliminarReceta(id: string) {
    try {
      const { error } = await supabase.from("recetas").delete().eq("id", id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Subir imagen a Supabase Storage
  private async subirImagen(uri: string): Promise<string | null> {
    try {
      const BUCKET = "recetas-fotos";
      // Obtener la extensión del archivo
      const extension = uri.split(".").pop() || "jpg";
      const nombreArchivo = `receta_${Date.now()}.${extension}`;

      // Ruta dentro del bucket
      const path = `recetas/${nombreArchivo}`;

      // Descargar el archivo desde el URI y convertir a Uint8Array (compatible RN)
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const uploadBody = new Uint8Array(arrayBuffer);

      // Subir a Supabase Storage usando el bucket público 'recetas-fotos'
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, uploadBody, {
          contentType: `image/${extension}`,
        });

      if (uploadError) {
        console.log("Error en upload:", uploadError);
        throw uploadError;
      }

      console.log("Upload OK:", uploadData?.path ?? uploadData);

      // Obtener la URL pública (el bucket debe ser público)
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const publicUrl = urlData?.publicUrl || null;
      console.log("Public URL:", publicUrl);
      return publicUrl;
    } catch (error) {
      console.log("Error al subir imagen:", error);
      return null;
    }
  }
  // Tomar foto con la cámara
  async tomarFoto(): Promise<string | null> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        alert("Necesitamos permisos para acceder a la cámara");
        return null;
      }

      const resultado = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!resultado.canceled) {
        return resultado.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.log("Error al tomar foto:", error);
      return null;
    }
  }

  // Seleccionar imagen de la galería
  async seleccionarImagen(): Promise<string | null> {
    try {
      // Pedir permisos
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        alert("Necesitamos permisos para acceder a tus fotos");
        return null;
      }

      // Abrir selector de imágenes
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!resultado.canceled) {
        return resultado.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.log("Error al seleccionar imagen:", error);
      return null;
    }
  }
}
