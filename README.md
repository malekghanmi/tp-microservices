# 🚀 TP Architecture Microservices

Mini réseau social avec Node.js, MongoDB et JWT.

## Technologies
- Node.js + Express
- MongoDB Atlas
- JWT Authentication
- API Gateway

## Design Patterns
- 🔀 Gateway Pattern
- 👁️ Observer Pattern
- ⛓️ Middleware Chain Pattern
- 🗄️ Active Record Pattern

## Ports
| Service | Port |
|---------|------|
| API Gateway | 3000 |
| User Service | 3001 |
| Post Service | 3002 |

## Démarrage
```bash
cd user-service && node server.js
cd post-service && node server.js
cd api-gateway && node server.js
```