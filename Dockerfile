FROM node:20-alpine

# Enable pnpm via Corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Build tools for C++ node-gyp
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy dependency files and binding config
COPY package.json pnpm-lock.yaml binding.gyp ./

# Install via pnpm
RUN pnpm install --frozen-lockfile

COPY . .

# Build C++ addon
RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "start"]