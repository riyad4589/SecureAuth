package com.secureauth.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * Service pour la gestion des images avec Cloudinary
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    /**
     * Upload une image vers Cloudinary
     *
     * @param file Le fichier image à uploader
     * @param folder Le dossier dans Cloudinary (optionnel)
     * @return L'URL publique de l'image uploadée
     * @throws IOException En cas d'erreur d'upload
     */
    public String uploadImage(MultipartFile file, String folder) throws IOException {
        try {
            Map<String, Object> uploadParams = ObjectUtils.asMap(
                "folder", folder != null ? folder : "secureauth/images",
                "resource_type", "image"
            );

            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadParams);

            String publicId = (String) uploadResult.get("public_id");
            String url = (String) uploadResult.get("secure_url");

            log.info("Image uploadée avec succès: {}", publicId);
            return url;

        } catch (Exception e) {
            log.error("Erreur lors de l'upload de l'image: {}", e.getMessage());
            throw new IOException("Erreur lors de l'upload de l'image: " + e.getMessage(), e);
        }
    }

    /**
     * Upload une image vers Cloudinary (sans dossier spécifique)
     *
     * @param file Le fichier image à uploader
     * @return L'URL publique de l'image uploadée
     * @throws IOException En cas d'erreur d'upload
     */
    public String uploadImage(MultipartFile file) throws IOException {
        return uploadImage(file, null);
    }

    /**
     * Supprime une image de Cloudinary
     *
     * @param publicId L'ID public de l'image à supprimer
     * @throws IOException En cas d'erreur de suppression
     */
    public void deleteImage(String publicId) throws IOException {
        try {
            Map<?, ?> deleteResult = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            String result = (String) deleteResult.get("result");

            if ("ok".equals(result)) {
                log.info("Image supprimée avec succès: {}", publicId);
            } else {
                log.warn("Échec de la suppression de l'image {}: {}", publicId, result);
            }

        } catch (Exception e) {
            log.error("Erreur lors de la suppression de l'image {}: {}", publicId, e.getMessage());
            throw new IOException("Erreur lors de la suppression de l'image: " + e.getMessage(), e);
        }
    }

    /**
     * Extrait le public ID d'une URL Cloudinary
     *
     * @param imageUrl L'URL de l'image
     * @return Le public ID ou null si ce n'est pas une URL Cloudinary
     */
    public String extractPublicId(String imageUrl) {
        if (imageUrl != null && imageUrl.contains("cloudinary.com")) {
            // Format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
            String[] parts = imageUrl.split("/");
            if (parts.length >= 8) {
                // Retirer l'extension du fichier
                String publicIdWithExtension = parts[parts.length - 1];
                int lastDotIndex = publicIdWithExtension.lastIndexOf('.');
                if (lastDotIndex > 0) {
                    return parts[parts.length - 2] + "/" + publicIdWithExtension.substring(0, lastDotIndex);
                }
            }
        }
        return null;
    }
}