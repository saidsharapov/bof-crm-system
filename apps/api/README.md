# BOF CRM — Backend API

NestJS + PostgreSQL + Prisma REST API для CRM магазина футболок.

## Stack

- **NestJS** — фреймворк
- **PostgreSQL 16** — база данных
- **Prisma ORM** — работа с БД + миграции
- **JWT** (access 15m + refresh 7d)
- **bcrypt** — хэширование паролей
- **RBAC** — ADMIN / WAREHOUSE / MANAGER
- **Swagger** — документация API
- **Docker + Docker Compose**

## Быстрый старт (локально)

```bash
# 1. Скопировать и заполнить .env
cp apps/api/.env.example apps/api/.env

# 2. Запустить PostgreSQL через Docker
docker compose up postgres -d

# 3. Применить миграции
cd apps/api
npx prisma migrate deploy

# 4. Заполнить начальными данными
pnpm prisma:seed

# 5. Запустить dev-сервер
pnpm dev
```

API доступен на: http://localhost:3001/api  
Swagger: http://localhost:3001/api/docs

## Запуск через Docker Compose (production)

```bash
docker compose up --build
```

## Тестовые учётные данные (после seed)

| Логин      | Пароль       | Роль      |
|------------|--------------|-----------|
| admin      | admin123     | ADMIN     |
| manager    | manager123   | MANAGER   |
| sklad      | sklad123     | WAREHOUSE |
