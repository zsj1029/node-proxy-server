# 使用Node.js的官方镜像作为基础镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 将本地的Node.js程序代码目录复制到容器的/app目录中
COPY . .

# 安装依赖
RUN npm install

EXPOSE 3000

# 赋予启动脚本可执行权限
RUN chmod +x /app/start.sh

# 定义容器启动时运行的命令，调用启动脚本
CMD ["sh","start.sh"]
