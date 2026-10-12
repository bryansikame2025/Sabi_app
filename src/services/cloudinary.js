// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).


 // 12h

    // ========== STOCKAGE LOCAL — reste privé à chaque téléphone ==========
    // Convertit un lien de partage Google Drive classique (.../file/d/ID/view...)
    // en lien "preview" intégrable dans un <iframe>. Si l'URL ne correspond pas
    // au format Drive, elle est renvoyée telle quelle (autres hébergeurs PDF).
    // ========== CLOUDINARY (hébergement des PDF) ==========
    // Remplace ces deux valeurs par les tiennes depuis ton compte Cloudinary gratuit
    // (Settings → Upload → Upload presets). Le preset DOIT être en mode "Unsigned".
    const CLOUDINARY_CLOUD_NAME = "ugmlpnhi";
    const CLOUDINARY_UPLOAD_PRESET = "sabi_pdfs";

    // Envoie un fichier PDF vers Cloudinary et retourne son URL publique.
    // "resource_type=raw" est nécessaire pour les PDF (pas des images/vidéos).
    export async function uploaderPdfCloudinary(file, onProgress) {
      return new Promise((resolve, reject) => {
        const url = "https://api.cloudinary.com/v1_1/" + CLOUDINARY_CLOUD_NAME + "/raw/upload";
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
              resolve(data.secure_url);
            } else {
              {
                const m = (data.error && data.error.message) || ("Échec de l'envoi (code " + xhr.status + ")");
                reject(new Error(/too large|size|volumineux/i.test(m) ? m + " — fichier trop lourd pour ton compte Cloudinary (souvent 10 Mo en gratuit). Compresse-le puis réessaie." : m));
              }
            }
          } catch {
            reject(new Error("Réponse invalide de Cloudinary."));
          }
        };
        xhr.onerror = () => reject(new Error("Erreur réseau pendant l'envoi."));
        xhr.send(formData);
      });
    }

    // Envoie une image vers Cloudinary (endpoint "image", contrairement au PDF en "raw")
    // et retourne son URL publique — utilisé pour les actualités avec photo.
    export async function uploaderImageCloudinary(file, onProgress) {
      return new Promise((resolve, reject) => {
        const url = "https://api.cloudinary.com/v1_1/" + CLOUDINARY_CLOUD_NAME + "/image/upload";
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
              resolve(data.secure_url);
            } else {
              {
                const m = (data.error && data.error.message) || ("Échec de l'envoi (code " + xhr.status + ")");
                reject(new Error(/too large|size|volumineux/i.test(m) ? m + " — fichier trop lourd pour ton compte Cloudinary (souvent 10 Mo en gratuit). Compresse-le puis réessaie." : m));
              }
            }
          } catch {
            reject(new Error("Réponse invalide de Cloudinary."));
          }
        };
        xhr.onerror = () => reject(new Error("Erreur réseau pendant l'envoi."));
        xhr.send(formData);
      });
    }
    const TAILLE_MAX_IMAGE_ACTU = 5 * 1024 * 1024; // 5 Mo
    export function validerTailleImageActu(file) {
      if (file.size > TAILLE_MAX_IMAGE_ACTU) {
        return "Cette image fait " + (file.size / 1024 / 1024).toFixed(1) + " Mo, la limite est de 5 Mo.";
      }
      return null;
    }
