# 超脑 Studio · 后端（方案 A：腾讯云自建）

一个最小可用的 Node + Express + PostgreSQL 后端，提供：

- 注册 / 登录（JWT 30 天）
- 用户身份：`student` / `teacher` / `admin`
- 课程：列表 / 详情 / 新增 / 编辑 / 发布（讲师 + 管理员）
- 讨论区：按课程发帖 / 回复 / 点赞 / 置顶（管理员）
- 视频墙：腾讯云 COS 预签名 PUT 直传 + 点赞 / 播放计数
- 段位 / 积分：发帖 +5、评论 +2、上传视频 +10、被点赞 +1/+2、完成一节课 +3；
  段位 青铜(0) → 白银(50) → 黄金(200) → 铂金(500) → 钻石(1500)

## 更新已部署后端到新版本（讨论赞 + 视频 + 段位）

在服务器上：

```bash
cd /opt/chaonao-api   # 或你部署的路径
git pull              # 或重新上传 server/ 目录
npm install           # 会装 cos-nodejs-sdk-v5
npm run migrate       # 增量建新表 + 创建 user_points() 函数
# 填 COS 配置
vim .env              # 填 COS_SECRET_ID / COS_SECRET_KEY / COS_BUCKET / COS_REGION
pm2 restart superbrain-api
pm2 logs superbrain-api --lines 30
```

## 腾讯云 COS 一次性配置

1. 控制台 → 对象存储 → 创建桶（如 `superbrain-1300xxxxxx`，地域 `ap-nanjing`，权限“公有读私有写”）。
2. 控制台 → 访问管理 CAM → 子用户，给它授权 `QcloudCOSDataFullControl`（或限定到该桶），
   下载 `SecretId / SecretKey`，填到 `server/.env`。
3. 桶 → 安全管理 → 跨域访问 CORS，添加规则：
   - Origin：`https://你的前端域名`（如 `https://superbrain-studio.cn`）
   - Methods：`GET, PUT, HEAD`
   - Headers：`*`
   - Expose Headers：`ETag`

   没有这一步，浏览器直传 COS 会被 CORS 拦截。

## 一、本地或服务器准备

腾讯云 Ubuntu 22.04 示例（root 或 sudo 用户）：

```bash
# 1. Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 2. PostgreSQL 16
apt-get install -y postgresql postgresql-contrib
systemctl enable --now postgresql

# 3. 建库建用户
sudo -u postgres psql <<'SQL'
CREATE USER chaonao WITH PASSWORD '换成强密码';
CREATE DATABASE chaonao OWNER chaonao;
SQL
```

## 二、部署后端

```bash
# 上传 server/ 目录到服务器，比如 /opt/chaonao-api
cd /opt/chaonao-api
cp .env.example .env
vim .env      # 填 DATABASE_URL / JWT_SECRET / CORS_ORIGIN
npm install
npm run migrate     # 建表
npm start           # 测试启动，访问 http://<服务器IP>:4000/api/health
```

## 三、用 pm2 守护进程

```bash
npm i -g pm2
pm2 start npm --name chaonao-api -- start
pm2 save
pm2 startup        # 复制粘贴它给你的那行命令
```

## 四、Nginx 反代 + HTTPS（推荐）

`/etc/nginx/sites-available/chaonao`：

```nginx
server {
  listen 80;
  server_name api.yourdomain.com;
  location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

```bash
ln -s /etc/nginx/sites-available/chaonao /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
# 申请 HTTPS
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d api.yourdomain.com
```

## 五、前端连接

在 Lovable 项目根目录新增 `.env`（或在云服务商部署时配环境变量）：

```
VITE_API_BASE_URL=https://api.yourdomain.com
```

前端代码已经在 `src/lib/api.ts` 自动读取这个变量，所有请求都会带上 JWT。

## 六、把第一个用户升成管理员

注册后只能是 `student` 或 `teacher`。第一个管理员手动改：

```bash
sudo -u postgres psql -d chaonao -c \
  "UPDATE users SET role='admin' WHERE email='你的邮箱';"
```

## 接口一览

| Method | Path | 权限 |
|---|---|---|
| POST | /api/auth/register | 公开 |
| POST | /api/auth/login | 公开 |
| GET  | /api/auth/me | 登录 |
| GET  | /api/courses | 公开 |
| GET  | /api/courses/:id | 公开 |
| POST | /api/courses | teacher / admin |
| PUT  | /api/courses/:id | 作者 / admin |
| DELETE | /api/courses/:id | 作者 / admin |
| GET  | /api/posts?courseId=&category= | 1 | 公开 |
| GET  | /api/posts/:id | 公开 |
| POST | /api/posts | 登录 |
| POST | /api/posts/:id/replies | 登录 |
| POST | /api/posts/:id/pin | admin |
| DELETE | /api/posts/:id | 作者 / admin |