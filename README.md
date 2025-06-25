```markdown
# Bitrix Core Service (NestJS)

Микросервис для управления лидами в Bitrix24 с использованием NestJS, PostgreSQL, Redis, RabbitMQ и BullMQ.

## 📦 Технологии

- [NestJS](https://nestjs.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [RabbitMQ](https://www.rabbitmq.com/)
- [Redis](https://redis.io/)
- [BullMQ](https://docs.bullmq.io/)
- [TypeORM](https://typeorm.io/)
- Docker / Docker Compose

## 📁 Структура

```

bitrix-core-nest/
├── src/
│   ├── users/           # Модуль работы с пользователями/лидами
│   ├── rabbit/          # RabbitMQ продюсер и консьюмер
│   ├── jobs/            # BullMQ worker для задач
│   ├── utils/           # Утилиты (например, sendReply)
│   └── app.module.ts    # Основной модуль
├── docker-compose.yml
├── .env
├── .gitignore
└── README.md

```

## ⚙️ Конфигурация

### `.env`

Создай `.env` файл с переменными окружения:

```

POSTGRES\_HOST=postgres
POSTGRES\_PORT=5432
POSTGRES\_USER=postgres
POSTGRES\_PASSWORD=postgres
POSTGRES\_DB=postgres

RABBITMQ\_URL=amqp\://rabbitmq
REDIS\_HOST=redis
REDIS\_PORT=6379

BITRIX\_WEBHOOK=[https://b24-ваш.bitrix24.kz/rest/1/ключ](https://b24-ваш.bitrix24.kz/rest/1/ключ)

````

> 🔐 Храни `.env` файл локально, не коммить в git.

## 🚀 Запуск

```bash
docker-compose up --build
````

## 📡 Взаимодействие

1. Core-service публикует события в очередь.
2. Worker читает задачи и вызывает вебхуки Bitrix.
3. Ответ Bitrix отправляется обратно через RabbitMQ.

## ✅ Примеры API

```http
POST /users
PATCH /users/:id
POST /users/:id/move
```