# Session 08: Docker Networking & Volumes

**Name:** Siddhant Singh
**Roll number:** 24BCS10153

---

## Task 1: Docker Container Networking

[docker-compose.yml](docker-compose.yml) creates **3 containers** and **3 networks**:

```text
 frontend ──(frontend-net)── backend ──(backend-net)── database ──(database-net, internal)
                             ▲
                     on 2 networks
```

| Container | Image | Networks |
| --- | --- | --- |
| `homework-frontend` | `nginx:1.27-alpine` | frontend-net |
| `homework-backend` | `alpine:3.20` | **frontend-net + backend-net** |
| `homework-database` | `mysql:8.4` | backend-net + database-net |

```bash
$ docker compose up -d
 Network session-08-docker-networking-volume_frontend-net Creating 
 Network session-08-docker-networking-volume_frontend-net Created 
 Network session-08-docker-networking-volume_backend-net Creating 
 Network session-08-docker-networking-volume_backend-net Created 
 Network session-08-docker-networking-volume_database-net Creating 
 Network session-08-docker-networking-volume_database-net Created 
 Container homework-backend Creating 
 Container homework-frontend Creating 
 Container homework-database Creating 
 Container homework-backend Created 
 Container homework-database Created 
 Container homework-frontend Created 
 Container homework-database Starting 
 Container homework-backend Starting 
 Container homework-frontend Starting 
 Container homework-frontend Started 
 Container homework-database Started 
 Container homework-backend Started 
$ docker compose ps --format "table {{.Name}}\t{{.Image}}\t{{.Status}}"
NAME                IMAGE               STATUS
homework-backend    alpine:3.20         Up 9 seconds
homework-database   mysql:8.4           Up 9 seconds
homework-frontend   nginx:1.27-alpine   Up 9 seconds
$ docker network ls --filter name=session-08
NETWORK ID     NAME                                               DRIVER    SCOPE
f47191da8590   session-08-docker-networking-volume_backend-net    bridge    local
168a031eccda   session-08-docker-networking-volume_database-net   bridge    local
ee09048e412a   session-08-docker-networking-volume_frontend-net   bridge    local
$ docker inspect homework-frontend --format '{{.Name}} -> {{range $k, $v := .NetworkSettings.Networks}}{{$k}} ({{$v.IPAddress}}) {{end}}'
/homework-frontend -> session-08-docker-networking-volume_frontend-net (172.19.0.2) 
$ docker inspect homework-backend --format '{{.Name}} -> {{range $k, $v := .NetworkSettings.Networks}}{{$k}} ({{$v.IPAddress}}) {{end}}'
/homework-backend -> session-08-docker-networking-volume_backend-net (172.21.0.2) session-08-docker-networking-volume_frontend-net (172.19.0.3) 
$ docker inspect homework-database --format '{{.Name}} -> {{range $k, $v := .NetworkSettings.Networks}}{{$k}} ({{$v.IPAddress}}) {{end}}'
/homework-database -> session-08-docker-networking-volume_backend-net (172.21.0.3) session-08-docker-networking-volume_database-net (172.22.0.2) 
$ docker exec homework-backend ping -c 2 frontend
PING frontend (172.19.0.2): 56 data bytes
64 bytes from 172.19.0.2: seq=0 ttl=64 time=293.349 ms
64 bytes from 172.19.0.2: seq=1 ttl=64 time=0.314 ms

--- frontend ping statistics ---
2 packets transmitted, 2 packets received, 0% packet loss
round-trip min/avg/max = 0.314/146.831/293.349 ms
$ docker exec homework-backend ping -c 2 database
PING database (172.21.0.3): 56 data bytes
64 bytes from 172.21.0.3: seq=0 ttl=64 time=1.075 ms
64 bytes from 172.21.0.3: seq=1 ttl=64 time=0.135 ms

--- database ping statistics ---
2 packets transmitted, 2 packets received, 0% packet loss
round-trip min/avg/max = 0.135/0.605/1.075 ms
$ docker exec homework-backend curl -s http://frontend | grep -o "<title>.*</title>"
<title>Welcome to nginx!</title>
$ docker exec homework-frontend ping -c 2 -W 2 database
ping: bad address 'database'
$ docker exec homework-database mysqladmin -uroot -phomework-root-password ping 2>/dev/null
mysqld is alive
```

### What I observed

- `docker network ls` shows the **3 bridge networks**.
- `docker inspect` shows that the **backend has two IP addresses**, one on each network (`172.21.0.2` and `172.19.0.3`).
- The backend can **ping and resolve by name** both `frontend` and `database`, because Docker's built-in DNS works inside each user-defined network. It can also fetch the Nginx page.
- The frontend **cannot** reach the database (`bad address 'database'`), because they share no network. Isolation works.
- MySQL is up (`mysqld is alive`).

---

## Task 2: Host Network

With `--network host`, the container does **not** get its own network namespace or IP. It uses the host's network stack directly, so Apache listens on the host's **port 80** without any `-p` mapping.

```bash
$ docker pull httpd:2.4
2.4: Pulling from library/httpd
Digest: sha256:c842ac797bd1fe8b3cd26d002ac9d948aa2814097544600600b35aef42e6785a
Status: Image is up to date for httpd:2.4
docker.io/library/httpd:2.4
$ docker run -d --name apache-host --network host httpd:2.4
1afc2f8702d0b221096eb5d88514bc2169661b30187a3009799ba815486a0014
$ docker ps --filter name=apache-host --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
NAMES         IMAGE       STATUS         PORTS
apache-host   httpd:2.4   Up 3 seconds   
$ docker inspect apache-host --format 'NetworkMode={{.HostConfig.NetworkMode}}  Networks={{range $k, $v := .NetworkSettings.Networks}}{{$k}} IP="{{$v.IPAddress}}"{{end}}'
NetworkMode=host  Networks=host IP="invalid IP"
$ docker run --rm --network host curlimages/curl -s http://localhost:80
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
<title>It works! Apache httpd</title>
</head>
<body>
<p>It works!</p>
</body>
</html>
$ docker run --rm --network host busybox netstat -tln | grep -E "Proto|:80 "
Proto Recv-Q Send-Q Local Address           Foreign Address         State       
tcp        0      0 :::80                   :::*                    LISTEN      
$ docker logs apache-host 2>&1 | tail -3
[Wed Oct 07 14:33:26.646737 2026] [mpm_event:notice] [pid 1:tid 1] AH00489: Apache/2.4.69 (Unix) configured -- resuming normal operations
[Wed Oct 07 14:33:26.647145 2026] [core:notice] [pid 1:tid 1] AH00094: Command line: 'httpd -D FOREGROUND'
::1 - - [07/Oct/2026:14:33:32 +0000] "GET / HTTP/1.1" 200 191
```

### What I observed

- `PORTS` is **empty** in `docker ps` and the IP is `invalid IP`, because there is no port mapping and no container IP. The container shares the host's network.
- Another host-network container reached Apache at **`localhost:80`** and got `It works!`, and `netstat` shows `:::80 LISTEN` on the host.

> **Note (Docker Desktop on Windows):** Docker runs inside a Linux VM, so "host" here means that VM's network. That is why I tested `localhost:80` from a host-network container. On a Linux machine, or with *Settings → Resources → Network → Enable host networking* turned on in Docker Desktop, `http://localhost:80` also opens directly in the browser.

---

## Task 3: Bind Mount

A **bind mount** maps a folder on my machine directly into the container. The container reads the files live, so editing them on the host changes the website immediately.

```bash
$ cat bind-mount/index.html
<!doctype html>
<html><body><h1>Hello students</h1></body></html>
$ docker run -d --name nginx-bind-mount -p 8081:80 -v "$(pwd -W)/bind-mount:/usr/share/nginx/html:ro" nginx:1.27-alpine
fea99f5e1c2149b32f1e0cb4a708e13d341c5656b0ce0637057ace6546c292c8
$ docker inspect nginx-bind-mount --format '{{range .Mounts}}Type={{.Type}}  Source={{.Source}}  Destination={{.Destination}}  RW={{.RW}}{{end}}'
Type=bind  Source=C:/Users/singh/OneDrive/Desktop/DevOps Homework/session-08-docker-networking-volume/bind-mount  Destination=/usr/share/nginx/html  RW=false
$ curl -s http://localhost:8081
<!doctype html>
<html><body><h1>Hello students</h1></body></html>
$ docker ps --filter name=nginx-bind-mount --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
NAMES              STATUS          PORTS
nginx-bind-mount   Up 10 seconds   0.0.0.0:8081->80/tcp, [::]:8081->80/tcp
$ printf '<!doctype html>\n<html><body><h1>Hello students - modified without restarting!</h1></body></html>\n' > bind-mount/index.html
$ curl -s http://localhost:8081
<!doctype html>
<html><body><h1>Hello students - modified without restarting!</h1></body></html>
$ docker ps --filter name=nginx-bind-mount --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
NAMES              STATUS          PORTS
nginx-bind-mount   Up 23 seconds   0.0.0.0:8081->80/tcp, [::]:8081->80/tcp
```

| Before edit | After edit (no restart) |
| --- | --- |
| ![before](screenshots/03-bind-mount-before.png) | ![after](screenshots/04-bind-mount-after.png) |

### What I observed

- `docker inspect` shows `Type=bind` from my local `bind-mount` folder to `/usr/share/nginx/html`.
- After I edited `index.html` **on the host**, `curl` immediately returned the new content.
- `docker ps` shows the **same container** with an uptime of 10 s and then 23 s, so it was **never restarted**.

> `pwd -W` is used because these commands were run in Git Bash on Windows. It prints a Windows path that Docker Desktop understands. On Linux or macOS use `$(pwd)`.

---

## Task 4: Overlay Network

### What is an overlay network?

A **bridge** network only connects containers on **one Docker host**. An **overlay** network creates a single virtual network that spans **multiple Docker hosts** (the nodes of a Docker Swarm cluster). Containers on different machines can then talk to each other as if they were on the same LAN, using service names.

### How it works across hosts

- It needs **Docker Swarm** (`docker swarm init` on a manager, `docker swarm join` on the workers).
- Traffic between hosts is wrapped in **VXLAN** packets (UDP port 4789), creating a tunnel over the physical network.
- The swarm's **built-in DNS** resolves a service name to a virtual IP, and the swarm **load-balances** across the service's replicas, wherever they run.
- Control traffic is encrypted, and data traffic can be encrypted too (`--opt encrypted`).

### Use cases

- Microservices spread over several servers (a frontend on node A talking to an API on node B)
- Docker Swarm services with replicas on many nodes
- Keeping each application's traffic on its own private network across a cluster

### Demo (single-node swarm)

```bash
$ docker swarm init 2>&1 | head -3
Swarm initialized: current node (92m2nxwjb4uevg7wqhparq5zy) is now a manager.

To add a worker to this swarm, run the following command:
$ docker network create --driver overlay --attachable homework-overlay
qnlopz4opbc5npt8b3o54qrww
$ docker network ls --filter driver=overlay
NETWORK ID     NAME               DRIVER    SCOPE
qnlopz4opbc5   homework-overlay   overlay   swarm
tt6ksgqo8hcq   ingress            overlay   swarm
$ docker service create --name overlay-web --replicas 2 --network homework-overlay nginx:1.27-alpine 2>&1 | tail -1
verify: Service 9z1u0he4wqxpdqebzw4fnglna converged
$ docker service ps overlay-web --format "table {{.Name}}\t{{.Node}}\t{{.CurrentState}}"
NAME            NODE             CURRENT STATE
overlay-web.1   docker-desktop   Running 13 seconds ago
overlay-web.2   docker-desktop   Running 13 seconds ago
$ docker run --rm --network homework-overlay alpine:3.20 sh -c "nslookup overlay-web 2>/dev/null | grep -A1 Name; wget -qO- http://overlay-web | grep -o '<title>.*</title>'"
Name:	overlay-web
Address: 10.0.1.2
<title>Welcome to nginx!</title>
$ docker network inspect homework-overlay --format 'Driver={{.Driver}} Scope={{.Scope}} Subnet={{range .IPAM.Config}}{{.Subnet}}{{end}}'
Driver=overlay Scope=swarm Subnet=10.0.1.0/24
$ docker service rm overlay-web
overlay-web
$ docker network rm homework-overlay
homework-overlay
$ docker swarm leave --force
Node left the swarm.
```

The overlay network has `Scope=swarm`, so it can stretch across every node in the swarm. A container attached to it resolved the service name `overlay-web` to its virtual IP and loaded the Nginx page served by the 2 replicas.
