# 1. 基础镜像：使用官方轻量级 Python 3.13
FROM python:3.13-slim

# 2. 设置工作目录
WORKDIR /app

# 3. 设置环境变量
# 防止 Python 生成 .pyc 文件
ENV PYTHONDONTWRITEBYTECODE=1
# 让控制台日志实时输出
ENV PYTHONUNBUFFERED=1

# 4. 安装依赖
# 先只复制 requirements.txt，利用 Docker 缓存层加速构建
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. 复制项目代码
COPY . .

# 6. 创建日志目录 (因为我们在 .dockerignore 里忽略了它)
RUN mkdir -p logs

# 7. 暴露端口
EXPOSE 5000

# 8. 启动命令
# 使用 gunicorn 启动：
# -w 4: 开启 4 个工作进程 (处理并发)
# -b 0.0.0.0:5000: 监听所有 IP 的 5000 端口
# app:app : 文件名:Flask实例名
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]