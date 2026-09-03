# Linux Fundamentals

## Task 1: Soft links and hard links

```bash
mkdir -p ~/linux-links-demo
cd ~/linux-links-demo
echo "original content" > original.txt
ln -s original.txt soft-link.txt
ln original.txt hard-link.txt
ls -li original.txt soft-link.txt hard-link.txt
cat soft-link.txt
cat hard-link.txt
rm soft-link.txt hard-link.txt original.txt
cd ..
rm -rf ~/linux-links-demo
```

A soft link stores a path and can cross file systems. A hard link points to the same inode and normally cannot cross file systems. Removing the original file breaks the soft link but does not remove data still referenced by a hard link.

## Task 2: `adduser` versus `useradd`

`adduser` is the interactive, user-friendly Debian/Ubuntu helper. `useradd` is the lower-level command and usually needs options for the home directory, shell, and password. On Ubuntu, `adduser` is preferred for a normal interactive account.

```bash
sudo adduser devops-test
id devops-test
sudo deluser --remove-home devops-test
```

## Task 3: `journalctl`

`journalctl` reads the systemd journal. Useful examples:

```bash
sudo journalctl -b
sudo journalctl -u ssh --since "today"
sudo journalctl -p err -b
sudo journalctl -f
```

## Task 4: command cheat sheet

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
| `cat` | Print file contents | `cat demo.txt` |
| `grep` | Search text | `grep error app.log` |
| `df` | Show filesystem usage | `df -h` |
| `du` | Show directory usage | `du -sh .` |
| `ps` | Show processes | `ps aux` |
| `chmod` | Change permissions | `chmod +x script.sh` |
| `man` | Open manual pages | `man journalctl` |