# Session 04: Networking Fundamentals

**Name:** Siddhant Singh
**Roll number:** 24BCS10153

All commands were run on Ubuntu 24.04 (hostname `devops-lab`), connected to the internet through the Docker bridge network `172.17.0.0/16`.

---

## 1. `ip addr`

**What it does:** Lists every network interface with its MAC address and IP addresses.

```bash
$ ip addr
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host 
       valid_lft forever preferred_lft forever
2: eth0@if25: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default 
    link/ether a6:01:bf:b8:db:00 brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 172.17.0.3/16 brd 172.17.255.255 scope global eth0
       valid_lft forever preferred_lft forever
```

**Understanding:** There are two interfaces. `lo` is the loopback (`127.0.0.1`), used by the machine to talk to itself. `eth0` is the real network card, with the private IP `172.17.0.3/16`, where `/16` is the subnet mask.

---

## 2. `ip route`

**What it does:** Shows the routing table, which decides where packets are sent.

```bash
$ ip route
default via 172.17.0.1 dev eth0 
172.17.0.0/16 dev eth0 proto kernel scope link src 172.17.0.3 
```

**Understanding:** `default via 172.17.0.1` is the default gateway, which receives all traffic for the internet. The second line says that addresses in `172.17.0.0/16` are on the local network and are reached directly through `eth0`.

---

## 3. `ping -c 4 8.8.8.8`

**What it does:** Sends ICMP echo requests to check whether a host is reachable and how long a round trip takes.

```bash
$ ping -c 4 8.8.8.8
PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.
64 bytes from 8.8.8.8: icmp_seq=1 ttl=63 time=46.3 ms
64 bytes from 8.8.8.8: icmp_seq=2 ttl=63 time=58.1 ms
64 bytes from 8.8.8.8: icmp_seq=3 ttl=63 time=116 ms
64 bytes from 8.8.8.8: icmp_seq=4 ttl=63 time=38.6 ms

--- 8.8.8.8 ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3004ms
rtt min/avg/max/mdev = 38.574/64.713/115.857/30.335 ms
```

**Understanding:** All 4 packets came back (0% packet loss), so Google DNS is reachable. The average round-trip time (RTT) was about 65 ms. `-c 4` stops after 4 packets.

---

## 4. `ss -tuln`

**What it does:** Lists listening sockets. `-t` is TCP, `-u` is UDP, `-l` shows listening sockets only, and `-n` shows numeric ports instead of names.

```bash
$ ss -tuln
Netid State Recv-Q Send-Q Local Address:Port Peer Address:PortProcess
```

**Understanding:** Only the header is printed because nothing on this fresh machine is listening on a port. On a server running a web server, a line such as `tcp LISTEN 0.0.0.0:80` would appear. This command is used to check whether a service is actually listening.

---

## 5. `nslookup google.com`

**What it does:** Asks a DNS server to turn a domain name into IP addresses.

```bash
$ nslookup google.com
Server:		192.168.65.7
Address:	192.168.65.7#53

Non-authoritative answer:
Name:	google.com
Address: 192.178.174.138
Name:	google.com
Address: 192.178.174.100
Name:	google.com
Address: 192.178.174.101
Name:	google.com
Address: 192.178.174.102
Name:	google.com
Address: 192.178.174.113
Name:	google.com
Address: 192.178.174.139
```

**Understanding:** `Server: 192.168.65.7` is the DNS resolver that answered. "Non-authoritative answer" means it came from a cache rather than from Google's own DNS servers. google.com resolves to several IPs, which spreads the load between them.

---

## 6. `curl -I https://example.com`

**What it does:** Sends an HTTP request and shows only the response headers. `-s` hides the progress meter.

```bash
$ curl -sI https://example.com
HTTP/2 200 
date: Wed, 07 Oct 2026 14:16:21 GMT
content-type: text/html; charset=utf-8
server: cloudflare
last-modified: Fri, 02 Oct 2026 16:11:02 GMT
allow: GET, HEAD
accept-ranges: bytes
age: 7438
cf-cache-status: HIT
cf-ray: a46d85f00a8846a8-BOM
alt-svc: h3=":443"; ma=86400
```

**Understanding:** `HTTP/2 200` means success, using HTTP version 2. The headers show the content type, that the site is served by Cloudflare, and `cf-cache-status: HIT`, which means the CDN served it from its cache.

---

## 7. `traceroute example.com`

**What it does:** Shows each router (hop) that packets pass through on the way to the destination.

```bash
$ traceroute -m 15 example.com
traceroute to example.com (172.66.147.243), 15 hops max, 60 byte packets
 1  172.17.0.1 (172.17.0.1)  3.234 ms  0.042 ms  0.006 ms
 2  * * *
 3  * * *
 4  * * *
 5  * * *
 6  * * *
 7  * * *
 8  * * *
 9  * * *
10  * * *
11  * * *
12  * * *
13  * * *
14  * * *
15  * * *
```

**Understanding:** Hop 1 is the gateway `172.17.0.1`. The `* * *` lines are routers that did not reply, because many ISPs and cloud networks block or rate-limit the UDP and ICMP packets that traceroute depends on. The connection itself works, since `ping` and `curl` succeeded. `-m 15` limits the trace to 15 hops.
