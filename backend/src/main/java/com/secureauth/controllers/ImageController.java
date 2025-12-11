package com.secureauth.controllers;

import com.secureauth.dto.ApiResponse;
import com.secureauth.services.CloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Contrôleur pour la gestion des images avec Cloudinary
 */
@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
@Slf4j
public class ImageController {

    private final CloudinaryService cloudinaryService;

    /**
     * Upload une image vers Cloudinary
     *
     * @param file Le fichier image à uploader
     * @param folder Le dossier optionnel dans Cloudinary
     * @return L'URL de l'image uploadée
     */
    @PostMapping("/upload")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<String>> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", required = false) String folder) {

        try {
            // Validation du fichier
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Le fichier ne peut pas être vide", null));
            }

            // Validation du type de fichier
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Le fichier doit être une image", null));
            }

            // Validation de la taille du fichier (max 5MB)
            if (file.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "La taille du fichier ne peut pas dépasser 5MB", null));
            }

            String imageUrl = cloudinaryService.uploadImage(file, folder);

            log.info("Image uploadée avec succès par l'utilisateur: {}", imageUrl);
            return ResponseEntity.ok(new ApiResponse<>(true, "Image uploadée avec succès", imageUrl));

        } catch (IOException e) {
            log.error("Erreur lors de l'upload de l'image: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(false, "Erreur lors de l'upload de l'image: " + e.getMessage(), null));
        }
    }

    /**
     * Supprime une image de Cloudinary
     *
     * @param imageUrl L'URL de l'image à supprimer
     * @return Confirmation de suppression
     */
    @DeleteMapping("/delete")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<String>> deleteImage(@RequestParam("imageUrl") String imageUrl) {

        try {
            String publicId = cloudinaryService.extractPublicId(imageUrl);

            if (publicId == null) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "URL d'image invalide", null));
            }

            cloudinaryService.deleteImage(publicId);

            log.info("Image supprimée avec succès: {}", imageUrl);
            return ResponseEntity.ok(new ApiResponse<>(true, "Image supprimée avec succès", null));

        } catch (IOException e) {
            log.error("Erreur lors de la suppression de l'image: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(false, "Erreur lors de la suppression de l'image: " + e.getMessage(), null));
        }
    }
}