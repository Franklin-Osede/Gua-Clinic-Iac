# GUA Clinic - Monorepo

Sistema de citas médicas con widget para WordPress, backend API y infraestructura AWS.

## 📁 Estructura del Proyecto

```
gua-clinic/
├── packages/
│   ├── widget/              # Web Component para WordPress
│   ├── api/                 # Backend NestJS
│   └── shared/              # Código compartido (tipos, utils)
├── iac/                     # Infrastructure as Code (Terraform)
│   ├── modules/
│   └── envs/
│       ├── dev/
│       ├── pre/
│       └── prod/
├── .github/workflows/       # CI/CD
├── scripts/                  # Scripts de deploy y build
└── docs/                    # Documentación

```

## 🚀 Inicio Rápido

### Instalación
```bash
npm install
```

### Desarrollo
```bash
# Widget (frontend)
npm run dev --workspace=packages/widget

# API (backend)
npm run dev --workspace=packages/api
```

### Build
```bash
# Build todos los packages
npm run build

# Build específico
npm run build --workspace=packages/widget
```

## 📦 Packages

### Widget (`packages/widget/`)
Web Component para WordPress que permite a los usuarios reservar citas médicas.

**Características:**
- React + TypeScript + Vite
- Web Component (`<gua-widget>`)
- Props: `locale`, `theme`, `base-url`
- Eventos: `ready`, `success`, `error`

### API (`packages/api/`)
Backend NestJS que maneja la lógica de negocio y la integración con DriCloud.

**Características:**
- NestJS + TypeScript
- Endpoints: `/bootstrap`, `/appointments`, `/patients`
- Integración con DriCloud
- Rotación automática de tokens
- DynamoDB para auditoría

### Shared (`packages/shared/`)
Código compartido entre frontend y backend.

**Contenido:**
- Tipos TypeScript
- Entidades del dominio
- Utils comunes
- DTOs

## 🏗️ Arquitectura

### Frontend (Widget)
```
WordPress
├── <script src="https://cdn.gua.com/gua-widget.js"></script>
└── <gua-widget locale="es" theme="light"></gua-widget>
```

### Backend (API)
```
ECS (AWS)
├── NestJS API
├── DriCloud Integration
├── DynamoDB
└── Secrets Manager
```

## 🔧 Desarrollo

### Estructura DDD
- **Domain**: Entidades y reglas de negocio
- **Application**: Use cases y servicios
- **Infrastructure**: Implementaciones externas
- **Presentation**: Controllers y UI

### Testing
- **Unit Tests**: Domain entities
- **Integration Tests**: API endpoints
- **E2E Tests**: Widget functionality

## 📋 TODO

- [ ] Migrar frontend existente
- [ ] Crear Web Component
- [ ] Implementar backend API
- [ ] Configurar DriCloud integration
- [ ] Setup DynamoDB
- [ ] Deploy a AWS
- [ ] Validar en WordPress

## 📄 Licencia

Private - GUA Clinic


