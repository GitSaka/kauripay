export const uploadToCloudinary = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  
  // Utilise ton preset "WhatsUpload" ou la variable d'environnement
  formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "WhatsUpload");

  try {
    // 📸 KauriPay se concentre sur le format image pour les photos de reçus à la gare
    const resourceType = "image"; 

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/dyen5y5kh/${resourceType}/upload`,
      {
        method: "POST",
        body: formData
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error?.message || "Échec du téléversement sur Cloudinary.");
    }

    const data = await res.json();

    // 🔒 ON RENVOIE L'URL SÉCURISÉE SCELLÉE POUR LA BASE NEON CLOUD
    return {
      url: data.secure_url,     // Le lien HTTPS à enregistrer en DB (ex: trackingUrl)
      publicId: data.public_id // Utile si l'admin doit supprimer la photo plus tard
    };

  } catch (error) {
    console.error("❌ Erreur Cloudinary KauriPay:", error);
    return null;
  }
};
