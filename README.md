````markdown
# Bitrix Core Service (NestJS + RabbitMQ + PostgreSQL)

Этот сервис отвечает за управление пользователями (лидами) и интеграцию с Bitrix24 через Webhook API. Он построен на основе **NestJS**, использует **PostgreSQL** для хранения данных и **RabbitMQ** для обмена сообщениями.

## 📦 Стек технологий

- [NestJS](https://nestjs.com/) — серверный фреймворк
- [TypeORM](https://typeorm.io/) — ORM для PostgreSQL
- [PostgreSQL](https://www.postgresql.org/) — база данных
- [RabbitMQ](https://www.rabbitmq.com/) — брокер сообщений
- [BullMQ](https://docs.bullmq.io/) — очередь задач
- [Bitrix24 REST API](https://training.bitrix24.com/rest_help/) — внешняя CRM интеграция

## 🚀 Запуск без Docker

1. Установите зависимости:
   ```bash
   npm install
````

2. Настройте `.env` файл или отредактируйте `app.module.ts`:

   * Убедитесь, что PostgreSQL работает на `localhost:5432`
   * Имя пользователя и пароль по умолчанию: `postgres / postgres`

3. Запустите NestJS сервер:

   ```bash
   npm run start:dev
   ```

## 🐳 Запуск с Docker

1. Отредактируйте `docker-compose.yml` при необходимости
2. Запустите проект:

   ```bash
   docker-compose up --build
   ```

## 🔄 RabbitMQ

Сервис отправляет события (`create_card`, `update_card`, `move_card`) в очередь, которую обрабатывает `bitrix-service`.

Ожидаемые очереди:

* `bitrixQueue` — входящие задачи
* `bitrix.responses` — ответы от Bitrix

## 📁 Структура проекта

```
src/
├── users/
│   ├── user.entity.ts
│   ├── users.controller.ts
│   ├── users.service.ts
├── rabbit/
│   ├── producer.ts
│   ├── consumer.ts
├── app.module.ts
```

## ⚙️ Переменные окружения

Если используете `.env`, основные параметры:

```env
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=postgres
```

## 📮 Bitrix Webhook

В `bitrix-service` используется Webhook:

```
https://b24-qc4398.bitrix24.kz/rest/1/ytyiwmqfk1z0h0xx
```

Методы:

* `crm.lead.add`
* `crm.lead.update`
* `crm.lead.status`

## ✅ Примеры API

Создание пользователя (POST `/users`):

```json
{
  "full_name": "Иван Иванов",
  "phone": "+77001112233",
  "stage": "NEW"
}
```

Обновление (PATCH `/users/:id`)
Перевод лида (POST `/users/:id/move`)

---