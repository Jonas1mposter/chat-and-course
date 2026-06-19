#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/server"

echo "=========================================="
echo "超脑 Studio 后端一键启动脚本"
echo "=========================================="

# 1. 检查 server 目录
if [ ! -d "$SERVER_DIR" ]; then
  echo "错误: 找不到 server 目录: $SERVER_DIR"
  exit 1
fi

cd "$SERVER_DIR"

# 2. 检查 .env
if [ ! -f ".env" ]; then
  echo ""
  echo "提示: server/.env 不存在，已从 .env.example 复制模板。"
  cp .env.example .env
  echo "请先编辑 server/.env，填入正确的数据库连接信息，再重新运行此脚本。"
  echo ""
  echo "需要配置的关键项:"
  echo "  DATABASE_URL=postgres://用户名:密码@主机:端口/数据库名"
  echo "  JWT_SECRET=你的长随机字符串"
  echo "  CORS_ORIGIN=*  (或你的前端域名)"
  echo ""
  exit 1
fi

# 3. 检查 node_modules，不存在则自动安装
if [ ! -d "node_modules" ]; then
  echo ""
  echo ">>> 正在安装后端依赖 (npm install)..."
  npm install
  echo ">>> 依赖安装完成"
else
  echo ">>> 依赖已安装，跳过 npm install"
fi

# 4. 启动服务
echo ""
echo ">>> 启动后端服务..."
echo "    配置文件: $SERVER_DIR/.env"
echo "=========================================="
npm start
