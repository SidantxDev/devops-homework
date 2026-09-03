# Docker Multi-Stage Build

## Task 1: Build, run, and verify

```bash
docker build -t docker-multistage-hello .
docker run -d --name docker-multistage -p 8080:8080 docker-multistage-hello
curl http://localhost:8080
docker ps --filter name=docker-multistage
docker port docker-multistage
```

Expected application response:

```text
Hello World from Docker multi-stage build
```

Expected port mapping includes `0.0.0.0:8080->8080/tcp`. Stop and remove the container after collecting evidence:

```bash
docker stop docker-multistage
docker rm docker-multistage
```

## Task 2: Documentation

- Name: `[Enter your name]`
- Enrollment number: `[Enter your enrollment number]`
- Application output: paste `curl http://localhost:8080` output or add a screenshot.
- Container output: paste `docker ps` output or add a screenshot.

## Task 3: Three application types

The Node.js, Python, and Java Docker applications required for this task are in `../05-docker-fundamentals`. Their build/run commands and evidence section are in that folder's README.