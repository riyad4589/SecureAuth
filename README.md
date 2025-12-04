<a name="top"></a>

<p align="center">
  <img src="https://raw.githubusercontent.com/riyad4589/SecureAuth/main/frontend/src/images/light_theme.png" alt="SecureAuth Logo" width="300"/>
</p>


<p align="center">
  <strong>Plateforme de Gestion des Identités et des Accès (IAM) d'Entreprise</strong>
</p>

<p align="center">
  <a href="#-fonctionnalités">Fonctionnalités</a> •
  <a href="#-démarrage-rapide">Démarrage</a> •
  <a href="#%EF%B8%8F-architecture">Architecture</a> •
  <a href="#-documentation-api">API</a> •
  <a href="#-contributeurs">Contributeurs</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white" alt="Java 17"/>
  <img src="https://img.shields.io/badge/Spring%20Boot-3.5.0-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white" alt="Spring Boot"/>
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
</p>

---

## 📋 Table des Matières

- [🎯 Présentation](#-présentation)
- [✨ Fonctionnalités](#-fonctionnalités)
- [🏗️ Architecture](#️-architecture)
- [🚀 Démarrage Rapide](#-démarrage-rapide)
- [📖 Documentation API](#-documentation-api)
- [🔐 Sécurité](#-sécurité)
- [👥 Rôles et Permissions](#-rôles-et-permissions)
- [🛠️ Stack Technique](#️-stack-technique)
- [📁 Structure du Projet](#-structure-du-projet)
- [👤 Contributeurs](#-contributeurs)

---

## 🎯 Présentation

**SecureAuth** est une plateforme complète de **Gestion des Identités et des Accès (IAM)** conçue pour les entreprises modernes. Elle offre une gestion centralisée des utilisateurs, des mécanismes d'authentification robustes, un contrôle d'accès granulaire et un historique complet des audits.

### 🌟 Points Clés

| Fonctionnalité | Description |
|----------------|-------------|
| 🔑 **Identité Centralisée** | Gérez tous les utilisateurs depuis un tableau de bord unique |
| 🛡️ **Authentification Multi-Facteurs** | Intégration Google Authenticator (TOTP) |
| 👮 **RBAC** | Permissions granulaires basées sur les rôles |
| 📝 **Piste d'Audit Complète** | Traçabilité de chaque action avec logs détaillés |
| 🔄 **Self-Service** | Les utilisateurs gèrent leurs propres paramètres de sécurité |

---

## ✨ Fonctionnalités

### 🔐 Authentification & Sécurité

<table>
<tr>
<td width="50%">

**Authentification JWT**
- ⚡ Token d'accès
- 🔄 Token de rafraîchissement
- 🚫 Révocation à la déconnexion
- 🔒 Stockage sécurisé

</td>
<td width="50%">

**Authentification à Deux Facteurs**
- 📱 Support Google Authenticator
- 🔢 TOTP (conforme RFC 6238)
- 📷 Génération de QR Code
- ✅ Activation/Désactivation facile

</td>
</tr>
<tr>
<td width="50%">

**Sécurité des Mots de Passe**
- 🔐 Hachage BCrypt avec sel
- 📏 Exigences de complexité
- 🕐 Historique (5 derniers)
- ⏰ Changement forcé à la première connexion

</td>
<td width="50%">

**Protection des Comptes**
- 🚫 Verrouillage après 3 échecs
- 🔓 Déverrouillage par admin
- 📍 Suivi IP & User-Agent
- 🛑 Gestion des sessions

</td>
</tr>
</table>

### 👥 Gestion des Utilisateurs

```
┌──────────────────────────────────────────────────────────────┐
│                  CYCLE DE VIE UTILISATEUR                    │
├──────────────────────────────────────────────────────────────┤
│  📝 Inscription  →  ✅ Approbation  →  🔐 Activation        │
│       ↓                   ↓                ↓                 │
│  📧 Notification  ←  👤 Admin      →  🎉 Email de bienvenue │
└──────────────────────────────────────────────────────────────┘
```

- ➕ Création d'utilisateurs avec identifiants auto-générés
- ✏️ Modification des profils et rôles
- 🔄 Activation/Désactivation des comptes
- 🔓 Déverrouillage des comptes verrouillés
- 🔑 Réinitialisation des mots de passe
- 🗑️ Suppression d'utilisateurs

### 📊 Journaux d'Audit

| Action | Détails Capturés |
|--------|------------------|
| `LOGIN_SUCCESS` | Utilisateur, IP, Horodatage, User-Agent |
| `LOGIN_FAILED` | Nom d'utilisateur, IP, Raison, Nombre de tentatives |
| `USER_CREATED` | Créé par, Détails utilisateur |
| `PASSWORD_CHANGED` | Utilisateur, Modifié par |
| `2FA_ENABLED` | Utilisateur, Horodatage |
| `SESSION_TERMINATED` | Utilisateur, ID Session, Terminé par |

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                       COUCHE CLIENT                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   React     │  │   Postman   │  │  Apps       │            │
│  │  Frontend   │  │   Client    │  │  Tierces    │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
└─────────┼────────────────┼────────────────┼───────────────────┘
          │                │                │
          ▼                ▼                ▼
┌────────────────────────────────────────────────────────────────┐
│                      PASSERELLE API                            │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │             Spring Security + Filtre JWT                  │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────────────────────┐
│                    SERVICES BACKEND                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │   Auth   │ │   User   │ │   Role   │ │  Audit   │         │
│  │ Service  │ │ Service  │ │ Service  │ │ Service  │         │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘         │
└───────┼────────────┼────────────┼────────────┼────────────────┘
        │            │            │            │
        ▼            ▼            ▼            ▼
┌────────────────────────────────────────────────────────────────┐
│                     COUCHE DONNÉES                             │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                     PostgreSQL                            │ │
│  │    Users │ Roles │ Sessions │ Audit Logs │ API Keys      │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Démarrage Rapide

### Prérequis

| Requis | Version |
|--------|---------|
| ☕ Java | 17+ |
| 📦 Maven | 3.8+ |
| 🐘 PostgreSQL | 14+ |
| 📗 Node.js | 18+ |
| 📦 npm | 9+ |

### 📥 Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/riyad4589/SecureAuth.git
cd SecureAuth
```

### 🗄️ Configuration Base de Données

```sql
-- Créer la base de données
CREATE DATABASE secureauth;
```

### ⚙️ Configuration Backend

Créer le fichier `backend/src/main/resources/application.yml` :

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/secureauth
    username: postgres
    password: votre_mot_de_passe
    
jwt:
  secret: votre_secret_jwt_64_caracteres_minimum
  expiration: 3600000
  
spring:
  mail:
    username: votre_email@gmail.com
    password: votre_app_password
```

### 🚀 Lancement

```bash
# Backend (Terminal 1)
cd backend
mvn spring-boot:run

# Frontend (Terminal 2)
cd frontend
npm install
npm run dev
```

| Service | URL |
|---------|-----|
| 🖥️ Frontend | http://localhost:5173 |
| ⚙️ Backend | http://localhost:8080 |
| 📚 Swagger | http://localhost:8080/swagger-ui.html |

### 🔑 Identifiants par Défaut

| Rôle | Utilisateur | Mot de passe |
|------|-------------|--------------|
| 👑 Admin | `admin` | `Admin@123` |

> ⚠️ **Important** : Créer d'autre utilisateurs pour les autres roles



---

## 📖 Documentation API

### 🌐 Base URL

```
/api/v1
```

### 🔗 Endpoints Principaux

<summary><strong>🔐 Authentification</strong></summary>

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/auth/login` | Connexion utilisateur |
| `POST` | `/auth/logout` | Déconnexion |
| `POST` | `/auth/refresh` | Rafraîchir le token |
| `POST` | `/auth/verify-2fa` | Vérifier le code 2FA |
| `POST` | `/auth/register` | Demande d'inscription publique |


<summary><strong>👥 Utilisateurs</strong></summary>

| Méthode | Endpoint | Description | Rôle |
|---------|----------|-------------|------|
| `GET` | `/users` | Lister les utilisateurs | ADMIN, MANAGER |
| `POST` | `/users` | Créer un utilisateur | ADMIN |
| `GET` | `/users/{id}` | Obtenir un utilisateur | ADMIN, MANAGER |
| `PUT` | `/users/{id}` | Modifier un utilisateur | ADMIN |
| `DELETE` | `/users/{id}` | Supprimer un utilisateur | ADMIN |
| `PATCH` | `/users/{id}/toggle-status` | Activer/Désactiver | ADMIN |
| `PATCH` | `/users/{id}/unlock` | Déverrouiller | ADMIN |


<summary><strong>🎭 Rôles</strong></summary>

| Méthode | Endpoint | Description | Rôle |
|---------|----------|-------------|------|
| `GET` | `/roles` | Lister les rôles | ADMIN |
| `POST` | `/roles` | Créer un rôle | ADMIN |
| `PUT` | `/roles/{id}` | Modifier un rôle | ADMIN |
| `DELETE` | `/roles/{id}` | Supprimer un rôle | ADMIN |


<summary><strong>📊 Audit</strong></summary>

| Méthode | Endpoint | Description | Rôle |
|---------|----------|-------------|------|
| `GET` | `/audit` | Lister les logs | ADMIN, SECURITY |
| `GET` | `/audit/stats` | Statistiques | ADMIN, SECURITY |
| `POST` | `/audit/export` | Exporter les logs | ADMIN, SECURITY |


### 📬 Collection Postman

```
postman/SecureAuth_API.postman_collection.json
```

---

## 🔐 Sécurité

### 🛡️ Couches de Sécurité

```
┌─────────────────────────────────────────────────────────────┐
│                     STACK SÉCURITÉ                          │
├─────────────────────────────────────────────────────────────┤
│  Couche 1: Chiffrement HTTPS/TLS                            │
├─────────────────────────────────────────────────────────────┤
│  Couche 2: Authentification par Token JWT                   │
├─────────────────────────────────────────────────────────────┤
│  Couche 3: Authentification à Deux Facteurs (TOTP)          │
├─────────────────────────────────────────────────────────────┤
│  Couche 4: Contrôle d'Accès Basé sur les Rôles (RBAC)       │
├─────────────────────────────────────────────────────────────┤
│  Couche 5: Politique de Mots de Passe                       │
├─────────────────────────────────────────────────────────────┤
│  Couche 6: Protection contre le Verrouillage                │
├─────────────────────────────────────────────────────────────┤
│  Couche 7: Gestion des Sessions                             │
├─────────────────────────────────────────────────────────────┤
│  Couche 8: Piste d'Audit Complète                           │
└─────────────────────────────────────────────────────────────┘
```

### 🔒 Exigences Mot de Passe

- ✅ Minimum 8 caractères
- ✅ Au moins 1 majuscule
- ✅ Au moins 1 minuscule
- ✅ Au moins 1 chiffre
- ✅ Au moins 1 caractère spécial (!@#$%^&*)

---

## 👥 Rôles et Permissions

### 📊 Hiérarchie des Rôles

```
         ┌─────────┐
         │  ADMIN  │  ← Accès complet au système
         └────┬────┘
              │
    ┌─────────┴─────────┐
    │                   │
┌───┴───┐         ┌─────┴─────┐
│MANAGER│         │ SECURITY  │
└───┬───┘         └─────┬─────┘
    │                   │
    │   Gestion des     │   Surveillance
    │   Utilisateurs    │   & Audit
    │                   │
    └─────────┬─────────┘
              │
         ┌────┴────┐
         │  USER   │  ← Accès de base
         └─────────┘
```

### 🎭 Matrice des Permissions

| Permission | ADMIN | SECURITY | MANAGER | USER |
|------------|:-----:|:--------:|:-------:|:----:|
| Voir le Dashboard | ✅ | ✅ | ✅ | ✅ |
| Gérer les Utilisateurs | ✅ | ❌ | ✅* | ❌ |
| Gérer les Rôles | ✅ | ❌ | ❌ | ❌ |
| Voir les Logs d'Audit | ✅ | ✅ | ❌ | ❌ |
| Exporter les Logs | ✅ | ✅ | ❌ | ❌ |
| Paramètres de Sécurité | ✅ | ✅ | ❌ | ❌ |
| Approuver les Inscriptions | ✅ | ❌ | ❌ | ❌ |
| Gestion des Clés API | ✅ | ✅ | ✅ | ✅ |

> *MANAGER ne peut gérer que les comptes avec le rôle USER

---

## 🛠️ Stack Technique

### Backend

| Technologie | Usage |
|-------------|-------|
| ![Java](https://img.shields.io/badge/Java%2017-ED8B00?style=flat-square&logo=openjdk&logoColor=white) | Langage principal |
| ![Spring Boot](https://img.shields.io/badge/Spring%20Boot%203.5-6DB33F?style=flat-square&logo=spring-boot&logoColor=white) | Framework |
| ![Spring Security](https://img.shields.io/badge/Spring%20Security-6DB33F?style=flat-square&logo=spring-security&logoColor=white) | Auth & Autorisation |
| ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white) | Base de données |
| ![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=json-web-tokens&logoColor=white) | Authentification |
| ![Maven](https://img.shields.io/badge/Maven-C71A36?style=flat-square&logo=apache-maven&logoColor=white) | Build |

### Frontend

| Technologie | Usage |
|-------------|-------|
| ![React](https://img.shields.io/badge/React%2018-61DAFB?style=flat-square&logo=react&logoColor=black) | Framework UI |
| ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) | Build Tool |
| ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white) | Styling |
| ![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white) | Client HTTP |

---

## 📁 Structure du Projet

```
SecureAuth/
├── 📁 backend/
│   ├── 📁 src/main/java/com/secureauth/
│   │   ├── 📁 config/          # Configuration Security & JWT
│   │   ├── 📁 controllers/     # Endpoints REST
│   │   ├── 📁 dto/             # Objets de transfert
│   │   ├── 📁 entities/        # Entités JPA
│   │   ├── 📁 exceptions/      # Exceptions personnalisées
│   │   ├── 📁 repositories/    # Couche d'accès aux données
│   │   └── 📁 services/        # Logique métier
│   ├── 📁 src/main/resources/
│   │   └── 📄 application.yml  # Configuration
│   ├── 📄 Dockerfile
│   └── 📄 pom.xml
│
├── 📁 frontend/
│   ├── 📁 src/
│   │   ├── 📁 components/      # Composants réutilisables
│   │   ├── 📁 pages/           # Pages de l'application
│   │   ├── 📁 services/        # Services API
│   │   ├── 📁 styles/          # Fichiers CSS
│   │   └── 📄 App.jsx          # Composant racine
│   ├── 📄 package.json
│   └── 📄 vite.config.js
│
├── 📁 database/
│   ├── 📄 init.sql             # Schéma initial
│   └── 📄 migration_*.sql      # Migrations
│
├── 📁 postman/
│   └── 📄 SecureAuth_API.postman_collection.json
│
└── 📄 README.md
```

---

<h2 align="center">👤 Contributeurs</h2>

<p align="center">
<table align="center">
<tr>
<td align="center" width="300">
<a href="https://github.com/riyad4589">
<img src="https://github.com/riyad4589.png" width="150px;" style="border-radius: 50%;" alt="Mohamed Riyad MAJGHIROU"/><br /><br />
<b style="font-size: 18px;">Mohamed Riyad MAJGHIROU</b>
</a><br /><br />
<a href="mailto:riyadmaj10@gmail.com">📧 Email</a> •
<a href="https://www.linkedin.com/in/mohamed-riyad-majghirou-5b62aa388/">💼 LinkedIn</a>
</td>
<td align="center" width="300">
<a href="https://github.com/Azzammoo10">
<img src="https://github.com/Azzammoo10.png" width="150px;" style="border-radius: 50%;" alt="Mohamed AZZAM"/><br /><br />
<b style="font-size: 18px;">Mohamed AZZAM</b>
</a><br /><br />
<a href="mailto:azzam.moo10@gmail.com">📧 Email</a> •
<a href="https://www.linkedin.com/in/mohamed-azzam-93115823a/">💼 LinkedIn</a>
</td>
</tr>
</table>
</p>

---

<p align="center">
  <em>EMSI - École Marocaine des Sciences de l'Ingénieur</em><br/>
  <strong>2025-2026</strong>
</p>

---

<p align="center">
  <strong>⭐ Mettez une étoile si ce projet vous a été utile !</strong>
</p>

---

<p align="center">
  <a href="#top">⬆️ Retour en haut</a>
</p>