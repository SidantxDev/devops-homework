# Docker Networking and Volume Homework

## Task 1: Container networking

The compose file creates frontend, backend, and MySQL database containers plus three networks. The backend is attached to two networks.

```bash
docker compose up -d
docker network ls
docker inspect homework-backend --format '{{json .NetworkSettings.Networks}}'
docker exec homework-backend ping -c 2 frontend
docker exec homework-backend ping -c 2 database
docker compose down -v
```

The backend can resolve both `frontend` and `database` because it shares `frontend-net` and `backend-net` respectively. `isolated-net` is the third network.

## Task 2: Host network

Host networking is supported by Docker Desktop only in supported host-networking configurations. Run on a Linux Docker host or enable the feature in Docker Desktop:

```bash
docker pull httpd:2.4-alpine
docker run -d --name apache-host --network host httpd:2.4-alpine
curl http://localhost:80
docker stop apache-host
docker rm apache-host
```

## Task 3: Bind mount

```bash
docker run -d --name nginx-bind-mount -p 8081:80 -v "$(pwd)/bind-mount:/usr/share/nginx/html:ro" nginx:1.27-alpine
curl http://localhost:8081
printf '<h1>Hello students - modified</h1>\n' > bind-mount/index.html
curl http://localhost:8081
docker stop nginx-bind-mount
docker rm nginx-bind-mount
```

The second response changes without restarting the container because the host directory is mounted into Nginx.

## Task 4: Overlay networks

An overlay network connects containers across multiple Docker hosts using Docker Swarm. It is useful when services are distributed across hosts but need one virtual network and service-name discovery.

```bash
docker swarm init
docker network create --driver overlay homework-overlay
docker network ls
docker swarm leave --force
```

## Evidence

Paste command output or add screenshots to this README for every task before submission.