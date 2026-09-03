# Docker Fundamentals: Hello World Applications

Each application below has its own source code and Dockerfile. Build and run each one from its application directory.

```bash
docker build -t devops-nodejs ./nodejs-app
docker run --rm -p 3001:3000 devops-nodejs

docker build -t devops-python ./python-app
docker run --rm -p 3002:8000 devops-python

docker build -t devops-java ./java-app
docker run --rm -p 3003:8080 devops-java

docker build -t devops-apache ./Apache-app
docker run --rm -p 3004:80 devops-apache

docker build -t devops-react ./React-app
docker run --rm -p 3005:80 devops-react

docker build -t devops-nginx ./nginx-app
docker run --rm -p 3006:80 devops-nginx
```

Verify each app at its mapped `http://localhost` port and confirm the page says `Hello World`. Add terminal output or screenshots below before submission.

## Evidence

Paste `docker build`, `docker run`, and browser verification evidence here.