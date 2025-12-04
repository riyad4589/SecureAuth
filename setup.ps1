# Script de demarrage pour SecureAuth+ (Windows PowerShell)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SecureAuth+ - Installation & Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verification PostgreSQL
Write-Host "[1/6] Verification de PostgreSQL..." -ForegroundColor Yellow
try {
    $pgVersion = psql --version 2>$null
    if ($pgVersion) {
        Write-Host "OK PostgreSQL detecte : $pgVersion" -ForegroundColor Green
    } else {
        throw "PostgreSQL non trouve"
    }
} catch {
    Write-Host "ERREUR PostgreSQL n'est pas installe !" -ForegroundColor Red
    Write-Host "  Telechargez-le depuis : https://www.postgresql.org/download/" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Verification et installation de Maven
Write-Host "[2/6] Verification de Maven..." -ForegroundColor Yellow
try {
    $mvnVersion = mvn --version 2>$null
    if ($mvnVersion) {
        Write-Host "OK Maven est deja installe" -ForegroundColor Green
    } else {
        throw "Maven non trouve"
    }
} catch {
    Write-Host "ATTENTION Maven n'est pas installe. Installation automatique..." -ForegroundColor Yellow
    
    # Verifier si Chocolatey est installe
    try {
        choco --version 2>$null | Out-Null
        Write-Host "  OK Chocolatey detecte" -ForegroundColor Green
    } catch {
        Write-Host "  Installation de Chocolatey (gestionnaire de paquets)..." -ForegroundColor Yellow
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        
        # Rafraichir l'environnement
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        Write-Host "  OK Chocolatey installe" -ForegroundColor Green
    }
    
    Write-Host "  Installation de Maven..." -ForegroundColor Yellow
    choco install maven -y
    
    # Rafraichir l'environnement PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    # Verifier l'installation
    Start-Sleep -Seconds 2
    try {
        $mvnCheck = mvn --version 2>$null
        if ($mvnCheck) {
            Write-Host "  OK Maven installe avec succes !" -ForegroundColor Green
        } else {
            throw "Maven non detecte apres installation"
        }
    } catch {
        Write-Host "  ERREUR : Redemarrez PowerShell ou installez Maven manuellement" -ForegroundColor Red
        Write-Host "  Telechargement : https://maven.apache.org/download.cgi" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "SOLUTION RAPIDE : Fermez ce terminal, ouvrez un nouveau PowerShell et relancez ce script" -ForegroundColor Cyan
        exit 1
    }
}
Write-Host ""

# Compilation Backend
Write-Host "[3/6] Compilation du Backend..." -ForegroundColor Yellow
Set-Location -Path "backend"
mvn clean install -DskipTests
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de la compilation du backend!" -ForegroundColor Red
    exit 1
}
Write-Host "Backend compile avec succes!" -ForegroundColor Green
Write-Host ""

# Installation Frontend
Write-Host "[4/6] Installation des dependances Frontend..." -ForegroundColor Yellow
Set-Location -Path "..\frontend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de l'installation des dependances!" -ForegroundColor Red
    exit 1
}
Write-Host "Dependances installees avec succes!" -ForegroundColor Green
Write-Host ""

# Retour au repertoire racine
Set-Location -Path ".."

Write-Host "[5/6] Verification de Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    Write-Host "OK Node.js : $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERREUR Node.js non detecte" -ForegroundColor Red
}
Write-Host ""

Write-Host "[6/6] Preparation du demarrage..." -ForegroundColor Yellow
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuration terminee!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour demarrer l'application :" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Terminal 1 - Backend :" -ForegroundColor Cyan
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   mvn spring-boot:run" -ForegroundColor White
Write-Host ""
Write-Host "2. Terminal 2 - Frontend :" -ForegroundColor Cyan
Write-Host "   cd frontend" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "URLs d'acces :" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "   Backend API: http://localhost:8080" -ForegroundColor Green
Write-Host "   Swagger: http://localhost:8080/swagger-ui.html" -ForegroundColor Green
Write-Host ""
Write-Host "Compte admin par defaut :" -ForegroundColor Yellow
Write-Host "   Username: admin" -ForegroundColor White
Write-Host "   Password: Admin@123" -ForegroundColor White
Write-Host ""
