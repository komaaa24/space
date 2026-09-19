# Chatspace MVP Runbook

## Deploydan oldin

1. Production `.env` borligini tekshiring:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `CREDENTIAL_ENCRYPTION_KEY`
   - `APP_BASE_URL`
   - `ANTHROPIC_API_KEY`
   - Instagram/Telegram/Payment integratsiya envlari

2. Backup oling:

```bash
cd /root/space/chatspace
set -a
source .env
set +a

mkdir -p /root/backups/chatspace
pg_dump "$DATABASE_URL" -Fc -f "/root/backups/chatspace/chatspace-$(date +%Y%m%d-%H%M%S).dump"
ls -lh /root/backups/chatspace | tail
```

## Deploy

```bash
cd /root/space/chatspace
git pull origin master
npm ci
npx prisma generate
npx prisma migrate deploy
npm run mvp:secure-data
npm run mvp:audit
npm run build
pm2 restart chatspace --update-env
pm2 save
```

## Deploydan keyin tekshiruv

```bash
curl -I https://chatspace.uz
pm2 ls
pm2 logs chatspace --lines 80
```

Tenant isolation tekshiruvi:

```bash
set -a
source .env
set +a

npm run mvp:audit
```

Agar qo'lda tekshirish kerak bo'lsa:

```bash
psql "$DATABASE_URL" -c '
select c.id, c."contactName", c."clientId" as conversation_client, ch."clientId" as channel_client
from "Conversation" c
join "Channel" ch on ch.id = c."channelId"
where c."clientId" <> ch."clientId";
'
```

Natija bo'sh bo'lishi kerak.

## Rollback

Kod rollback:

```bash
cd /root/space/chatspace
git log --oneline -5
git checkout <old_commit>
npm ci
npx prisma generate
npm run build
pm2 restart chatspace --update-env
pm2 save
```

DB restore faqat zarurat bo'lsa:

```bash
pm2 stop chatspace
sudo -u postgres psql -c "DROP DATABASE IF EXISTS chatspace;"
sudo -u postgres psql -c "CREATE DATABASE chatspace OWNER chatspace;"
pg_restore -U chatspace -h 127.0.0.1 -d chatspace --no-owner --role=chatspace /root/backups/chatspace/<backup>.dump
pm2 restart chatspace --update-env
```
