# Clínica Medical - Sistema Integral de Citas Médicas y Especialidades

Portal web y sistema de gestión de citas médicas ambulatorias para Clínica Medical, desarrollado bajo la metodología **PUDS (Proceso Unificado de Desarrollo de Software / RUP)**.

El proyecto está organizado en una arquitectura desacoplada con carpetas independientes para **Frontend** y **Backend**:

```
Medical/
├── frontend/                        # Aplicación Cliente SPA (React 19 + TypeScript + Vite + Tailwind CSS v4)
│   ├── public/                      # Recursos estáticos y favicons
│   ├── src/                         # Componentes, vistas, lógica de reserva y tipos
│   ├── index.html                   # Plantilla HTML principal
│   ├── vite.config.ts               # Configuración Vite con Proxy hacia /api (puerto 3000)
│   ├── tsconfig.json                # Configuración TypeScript del cliente
│   ├── package.json                 # Dependencias y scripts del frontend
│   └── README.md                    # Documentación específica del frontend
│
├── backend/                         # Servidor API RESTful (Node.js 24 + Express 4 + TSX + PBKDF2)
│   ├── src/                         # Rutas REST, servicios de auth, base de datos en memoria y reglas
│   ├── tests/                       # Pruebas unitarias nativas (node:test)
│   ├── server.ts                    # Punto de entrada del servidor Express con CORS
│   ├── tsconfig.json                # Configuración TypeScript del servidor
│   ├── package.json                 # Dependencias y scripts del backend
│   └── README.md                    # Documentación específica del backend
│
├── FRONTEND.md                      # Análisis exhaustivo y arquitectura del Frontend
├── BACKEND.md                       # Análisis exhaustivo y arquitectura del Backend
└── package.json                     # Monorepo con scripts unificados
```

---

## 🚀 Cómo Ejecutar el Proyecto

### 1. Iniciar el Servidor Backend
En una terminal:
```bash
# Desde la raíz del proyecto
npm run dev:backend

# O ingresando directamente a la carpeta
cd backend
npm run dev
```
* Servidor API escuchando en: `http://localhost:3000`
* Endpoints disponibles en: `http://localhost:3000/api`

### 2. Iniciar la Aplicación Frontend
En otra terminal:
```bash
# Desde la raíz del proyecto
npm run dev:frontend

# O ingresando directamente a la carpeta
cd frontend
npm run dev
```
* Aplicación web disponible en: `http://localhost:5173`

---

## 🧪 Ejecución de Pruebas Unitarias

El proyecto cuenta con pruebas automatizadas nativas en Node.js 24:
```bash
# Ejecutar todas las pruebas (backend y frontend)
npm test

# O ejecutar solo las del backend
npm run test:backend

# O ejecutar solo las del frontend
npm run test:frontend
```
