# 🚀 Microservices Architecture - TP

A mini social network built with Node.js, MongoDB and JWT.

## 🛠️ Technologies
- Node.js + Express
- MongoDB Atlas
- JWT Authentication
- API Gateway

## 🎯 Design Patterns
- 🔀 Gateway Pattern
- 👁️ Observer Pattern
- ⛓️ Middleware Chain Pattern
- 🗄️ Active Record Pattern

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account

### Installation
```bash
# User Service
cd user-service && npm install && node server.js

# Post Service
cd post-service && npm install && node server.js

# API Gateway
cd api-gateway && npm install && node server.js
```

## 📡 Ports
| Service | Port |
|---------|------|
| API Gateway | 3000 |
| User Service | 3001 |
| Post Service | 3002 |

## 📌 API Endpoints
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | /api/users/register | ❌ |
| POST | /api/users/login | ❌ |
| GET | /api/users/profile | ✅ |
| GET | /api/posts | ✅ |
| POST | /api/posts | ✅ |
