# Session 01 & 02: Linux Fundamentals

**Name:** Siddhant Singh
**Roll number:** 24BCS10153

All commands below were run on an Ubuntu 24.04 machine (hostname `devops-lab`). The `journalctl` commands were run on a systemd-based Linux node (`minikube`), because `journalctl` needs systemd. Each block shows the exact command after `$` and its real terminal output.

---

## Task 1: Soft Link & Hard Link

### Difference

| | Soft link (symbolic link) | Hard link |
| --- | --- | --- |
| What it stores | The **path** to the original file | Another **name** for the same inode (same data on disk) |
| Inode number | Different from the original | Same as the original |
| If the original is deleted | Link breaks ("dangling link") | Data is still accessible |
| Across file systems | Yes | No |
| Can link to directories | Yes | No (not allowed for normal users) |
| Command | `ln -s target link` | `ln target link` |

### Create, test and delete both links

```bash
$ whoami && hostname && cat /etc/os-release | head -2
root
devops-lab
PRETTY_NAME="Ubuntu 24.04.5 LTS"
NAME="Ubuntu"
$ mkdir -p ~/linux-links-demo && cd ~/linux-links-demo
$ echo "original content" > original.txt
$ ln -s original.txt soft-link.txt
$ ln original.txt hard-link.txt
$ ls -li original.txt soft-link.txt hard-link.txt
272282 -rw-r--r-- 2 root root 17 Oct  7 14:15 hard-link.txt
272282 -rw-r--r-- 2 root root 17 Oct  7 14:15 original.txt
272284 lrwxrwxrwx 1 root root 12 Oct  7 14:15 soft-link.txt -> original.txt
$ cat soft-link.txt
original content
$ cat hard-link.txt
original content
$ rm original.txt
$ ls -li
total 4
272282 -rw-r--r-- 1 root root 17 Oct  7 14:15 hard-link.txt
272284 lrwxrwxrwx 1 root root 12 Oct  7 14:15 soft-link.txt -> original.txt
$ cat soft-link.txt
cat: soft-link.txt: No such file or directory
$ cat hard-link.txt
original content
$ rm soft-link.txt hard-link.txt
$ ls -la
total 8
drwxr-xr-x 2 root root 4096 Oct  7 14:15 .
drwx------ 1 root root 4096 Oct  7 14:15 ..
$ cd .. && rm -rf ~/linux-links-demo
```

### What I observed

- `ls -li` shows that `original.txt` and `hard-link.txt` have the **same inode number (272282)** and a link count of **2**, so they are two names for the same data.
- `soft-link.txt` has its **own inode (272284)**, type `l` and points to `original.txt` with `->`.
- After deleting `original.txt`, the **soft link breaks** (`No such file or directory`), but the **hard link still prints the content**, and its link count drops to 1.

**Interview answer:** A soft link is a shortcut that stores a path, so it breaks if the target is removed. A hard link is another directory entry pointing to the same inode, so the data stays until the last hard link is deleted.

---

## Task 2: `adduser` vs `useradd`

| | `useradd` | `adduser` |
| --- | --- | --- |
| Type | Low-level binary, available on every Linux distribution | Friendly Perl script (Debian/Ubuntu) that calls `useradd` internally |
| Home directory | **Not created** unless you pass `-m` | Created automatically and filled from `/etc/skel` |
| Default shell | `/bin/sh` unless you pass `-s` | `/bin/bash` |
| Password | Not set (use `passwd` separately) | Asks for it interactively |
| Groups / full name | Need flags (`-G`, `-c`) | Asks interactively |

**Preferred on Ubuntu:** `adduser`, because it creates a complete, usable account (home directory, bash shell, skeleton files, password) in one step. `useradd` is better suited to scripts where every option is passed explicitly.

```bash
$ sudo useradd devops-useradd
$ grep devops-useradd /etc/passwd
devops-useradd:x:1001:1001::/home/devops-useradd:/bin/sh
$ ls -ld /home/devops-useradd
ls: cannot access '/home/devops-useradd': No such file or directory
$ sudo adduser --disabled-password --gecos "DevOps Test" devops-test
info: Adding user `devops-test' ...
info: Selecting UID/GID from range 1000 to 59999 ...
info: Adding new group `devops-test' (1002) ...
info: Adding new user `devops-test' (1002) with group `devops-test (1002)' ...
info: Creating home directory `/home/devops-test' ...
info: Copying files from `/etc/skel' ...
info: Adding new user `devops-test' to supplemental / extra groups `users' ...
info: Adding user `devops-test' to group `users' ...
$ grep devops-test /etc/passwd
devops-test:x:1002:1002:DevOps Test,,,:/home/devops-test:/bin/bash
$ id devops-test
uid=1002(devops-test) gid=1002(devops-test) groups=1002(devops-test),100(users)
$ ls -la /home/devops-test
total 20
drwxr-x--- 2 devops-test devops-test 4096 Oct  7 14:15 .
drwxr-xr-x 1 root        root        4096 Oct  7 14:15 ..
-rw-r--r-- 1 devops-test devops-test  220 Oct  7 14:15 .bash_logout
-rw-r--r-- 1 devops-test devops-test 3771 Oct  7 14:15 .bashrc
-rw-r--r-- 1 devops-test devops-test  807 Oct  7 14:15 .profile
$ sudo deluser --remove-home devops-test
info: Looking for files to backup/remove ...
info: Removing files ...
warn: `/usr/bin/crontab' not executed. Skipping crontab removal. Package `cron' required.
info: Removing user `devops-test' ...
$ sudo userdel devops-useradd
$ id devops-test
id: 'devops-test': no such user
```

### What I observed

- `useradd devops-useradd` created the user with shell `/bin/sh` and **no home directory** (`ls` says the directory does not exist).
- `adduser devops-test` created the group and the user, created `/home/devops-test`, copied `.bashrc`, `.profile` and `.bash_logout` from `/etc/skel`, and set the shell to `/bin/bash`.
- `deluser --remove-home` removed the test user together with the home directory, and `id` then reports `no such user`.

---

## Task 3: `journalctl`

`journalctl` is the tool for reading logs collected by **systemd-journald**, which stores logs from the kernel, from system services and from boot. Useful options:

| Command | Meaning |
| --- | --- |
| `journalctl -b` | Logs from the current boot |
| `journalctl -u <service>` | Logs for one service (unit) |
| `journalctl --since today` | Filter by time |
| `journalctl -p err` | Only errors and worse |
| `journalctl -n 20` | Last 20 lines |
| `journalctl -f` | Follow live logs (like `tail -f`) |

```bash
$ journalctl --version | head -1
systemd 252 (252.39-1~deb12u2)
$ sudo journalctl -b --no-pager | head -15
Oct 07 14:16:04 minikube systemd-journald[95]: Journal started
Oct 07 14:16:04 minikube systemd-journald[95]: Runtime Journal (/run/log/journal/b7566eefbea02b7ce85821e86a97158b) is 8.0M, max 389.5M, 381.5M free.
Oct 07 14:16:04 minikube systemd[1]: Starting systemd-journal-flush.service - Flush Journal to Persistent Storage...
Oct 07 14:16:04 minikube systemd[1]: Finished systemd-sysctl.service - Apply Kernel Variables.
Oct 07 14:16:04 minikube systemd[1]: Finished systemd-sysusers.service - Create System Users.
Oct 07 14:16:04 minikube systemd[1]: Finished systemd-update-utmp.service - Record System Boot/Shutdown in UTMP.
Oct 07 14:16:04 minikube systemd-journald[95]: Runtime Journal (/run/log/journal/b7566eefbea02b7ce85821e86a97158b) is 8.0M, max 389.5M, 381.5M free.
Oct 07 14:16:04 minikube systemd[1]: Starting systemd-tmpfiles-setup-dev.service - Create Static Device Nodes in /dev...
Oct 07 14:16:04 minikube systemd[1]: Finished systemd-journal-flush.service - Flush Journal to Persistent Storage.
Oct 07 14:16:04 minikube systemd[1]: Finished systemd-tmpfiles-setup-dev.service - Create Static Device Nodes in /dev.
Oct 07 14:16:04 minikube systemd[1]: Reached target local-fs-pre.target - Preparation for Local File Systems.
Oct 07 14:16:04 minikube systemd[1]: Reached target local-fs.target - Local File Systems.
Oct 07 14:16:04 minikube systemd[1]: systemd-machine-id-commit.service - Commit a transient machine-id on disk was skipped because of an unmet condition check (ConditionPathIsMountPoint=/etc/machine-id).
Oct 07 14:16:04 minikube systemd[1]: systemd-udevd.service - Rule-based Manager for Device Events and Files was skipped because of an unmet condition check (ConditionPathIsReadWrite=/sys).
Oct 07 14:16:04 minikube systemd[1]: Reached target sysinit.target - System Initialization.
$ sudo journalctl -u kubelet --since today --no-pager | tail -8
Oct 07 14:16:33 minikube kubelet[590]: I1007 14:16:33.214633     590 server.go:177] "Pod update broadcasted" podUID="43363425e628a40eeb3afa755b92fbe2" type="MODIFIED"
Oct 07 14:16:33 minikube kubelet[590]: I1007 14:16:33.266304     590 server.go:177] "Pod update broadcasted" podUID="f029d000c220d1bf9553ea5af5038d7f" type="MODIFIED"
Oct 07 14:16:33 minikube kubelet[590]: I1007 14:16:33.273442     590 server.go:177] "Pod update broadcasted" podUID="f029d000c220d1bf9553ea5af5038d7f" type="MODIFIED"
Oct 07 14:16:39 minikube kubelet[590]: I1007 14:16:39.547682     590 server.go:177] "Pod update broadcasted" podUID="d46850d6-3a11-416e-8053-c6209e8a1f5d" type="MODIFIED"
Oct 07 14:16:49 minikube kubelet[590]: I1007 14:16:49.688203     590 scope.go:118] "RemoveContainer" containerID="5b6fac056515248975503dc9ec67b79f101288d665c0146d3ce9488c424d2944"
Oct 07 14:16:49 minikube kubelet[590]: I1007 14:16:49.688540     590 server.go:177] "Pod update broadcasted" podUID="4b3fdb99-beeb-46d0-ac56-bda3cf05e9ca" type="MODIFIED"
Oct 07 14:16:49 minikube kubelet[590]: I1007 14:16:49.688755     590 scope.go:118] "RemoveContainer" containerID="ab34711773699ec248c89f73d7caaeaa68df3675d9604b08f774796fff33faee"
Oct 07 14:16:49 minikube kubelet[590]: E1007 14:16:49.689079     590 pod_workers.go:1338] "Error syncing pod, skipping" err="failed to \"StartContainer\" for \"storage-provisioner\" with CrashLoopBackOff: \"back-off 10s restarting failed container=storage-provisioner pod=storage-provisioner_kube-system(4b3fdb99-beeb-46d0-ac56-bda3cf05e9ca)\"" pod="kube-system/storage-provisioner" podUID="4b3fdb99-beeb-46d0-ac56-bda3cf05e9ca"
$ sudo journalctl -u ssh --no-pager -n 5
Oct 07 14:17:05 minikube sshd[2613]: pam_env(sshd:session): Unable to open env file: /etc/default/locale: No such file or directory
Oct 07 14:17:05 minikube sshd[2613]: lastlog_openseek: Couldn't stat /var/log/lastlog: No such file or directory
Oct 07 14:17:05 minikube sshd[2613]: lastlog_openseek: Couldn't stat /var/log/lastlog: No such file or directory
Oct 07 14:17:05 minikube sudo[2620]:   docker : TTY=pts/1 ; PWD=/home/docker ; USER=root ; COMMAND=/usr/bin/journalctl -u ssh --no-pager -n 5
Oct 07 14:17:05 minikube sudo[2620]: pam_unix(sudo:session): session opened for user root(uid=0) by (uid=1000)
$ sudo journalctl -p err -b --no-pager | tail -5
Oct 07 14:16:49 minikube sshd[2511]: pam_env(sshd:session): Unable to open env file: /etc/default/locale: No such file or directory
Oct 07 14:16:50 minikube sshd[2521]: pam_env(sshd:session): Unable to open env file: /etc/default/locale: No such file or directory
Oct 07 14:16:51 minikube sshd[2533]: pam_env(sshd:session): Unable to open env file: /etc/default/locale: No such file or directory
Oct 07 14:16:52 minikube sshd[2545]: pam_env(sshd:session): Unable to open env file: /etc/default/locale: No such file or directory
Oct 07 14:16:53 minikube sshd[2555]: pam_env(sshd:session): Unable to open env file: /etc/default/locale: No such file or directory
$ systemctl status kubelet --no-pager | head -6
● kubelet.service - kubelet: The Kubernetes Node Agent
     Loaded: loaded (/lib/systemd/system/kubelet.service; disabled; preset: enabled)
    Drop-In: /etc/systemd/system/kubelet.service.d
             └─10-kubeadm.conf
     Active: active (running) since Wed 2026-10-07 14:16:14 UTC; 40s ago
       Docs: http://kubernetes.io/docs/
```

### What I observed

- `-b` starts at the beginning of the current boot (`Journal started`, then systemd starting services).
- `-u kubelet` shows only the kubelet service logs. One line shows a pod in `CrashLoopBackOff`, which is a good example of using logs to find a failing service.
- `-u ssh` shows the SSH logins and the `sudo` command I just ran.
- `-p err` filters down to error-priority messages only.

---

## Task 4: Linux Command Cheat Sheet

| Command | Purpose | Example |
| --- | --- | --- |
| `pwd` | Show the current directory | `pwd` |
| `ls` | List files | `ls -la` |
| `cd` | Change directory | `cd /var/log` |
| `mkdir` | Create a directory | `mkdir demo` |
| `touch` | Create an empty file | `touch demo.txt` |
| `cp` | Copy files | `cp demo.txt copy.txt` |
| `mv` | Move or rename files | `mv copy.txt renamed.txt` |
| `rm` | Remove files | `rm renamed.txt` |
| `cat` | Print file contents | `cat app.log` |
| `grep` | Search text | `grep error app.log` |
| `chmod` | Change permissions | `chmod +x script.sh` |
| `df` | Show filesystem usage | `df -h` |
| `du` | Show directory usage | `du -sh .` |
| `ps` | Show processes | `ps aux` |
| `man` | Open manual pages | `man journalctl` |

### Practice

```bash
$ pwd
/root
$ mkdir demo && cd demo && pwd
/root/demo
$ touch demo.txt && echo "error: disk full" > app.log && echo "info: started" >> app.log
$ ls -la
total 12
drwxr-xr-x 2 root root 4096 Oct  7 14:15 .
drwx------ 1 root root 4096 Oct  7 14:15 ..
-rw-r--r-- 1 root root   31 Oct  7 14:15 app.log
-rw-r--r-- 1 root root    0 Oct  7 14:15 demo.txt
$ cp demo.txt copy.txt && mv copy.txt renamed.txt && ls
app.log
demo.txt
renamed.txt
$ rm renamed.txt && ls
app.log
demo.txt
$ cat app.log
error: disk full
info: started
$ grep error app.log
error: disk full
$ chmod +x demo.txt && ls -l demo.txt
-rwxr-xr-x 1 root root 0 Oct  7 14:15 demo.txt
$ df -h /
Filesystem      Size  Used Avail Use% Mounted on
overlay        1007G   11G  946G   2% /
$ du -sh /root/demo
8.0K	/root/demo
$ ps aux | head -5
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  0.2  0.0   4336  3488 ?        Ss   14:14   0:00 bash /run-scripts/runner.sh /run-scripts/s01all.txt
root         372  0.0  0.0   7904  4124 ?        R    14:15   0:00 ps aux
root         373  0.0  0.0   2720  1412 ?        S    14:15   0:00 head -5
$ cd .. && rm -rf demo
```
