# Session 03: Shell Scripting

**Name:** Siddhant Singh
**Roll number:** 24BCS10153

## Task: System Information Script

Script: [system-information.sh](system-information.sh)

The script:

| Requirement | How the script does it |
| --- | --- |
| Prints the current date | `current_date="$(date)"` then `echo` |
| Prints the hostname | `host_name="$(hostname)"` |
| Prints the username | `user_name="$(whoami)"` |
| Prints the disk usage | `df -h` |
| Prints the running processes | `ps aux` |
| Uses variables | `output_directory`, `process_file`, `report_label`, `current_date`, `host_name`, `user_name` |
| Takes user input with `read -p` | `read -r -p "Enter a label for this report: " report_label` |
| Creates a directory with `mkdir` | `mkdir -p "$output_directory"` |
| Creates a file with `touch` | `touch "$process_file"` |
| Saves the processes with `>` | `ps aux > "$process_file"` |

```bash
#!/usr/bin/env bash
set -u

output_directory="system-information-output"
process_file="$output_directory/running-processes.txt"

read -r -p "Enter a label for this report: " report_label
mkdir -p "$output_directory"
touch "$process_file"

current_date="$(date)"
host_name="$(hostname)"
user_name="$(whoami)"

echo "System information report: $report_label"
echo "Date: $current_date"
echo "Hostname: $host_name"
echo "Username: $user_name"
echo "Disk usage:"
df -h
echo "Running processes:"
ps aux

ps aux > "$process_file"
echo "Process information saved to $process_file"
```

## Output

Run on Ubuntu 24.04 (hostname `devops-lab`). I typed `Session3-Homework` at the prompt.

```bash
$ chmod +x system-information.sh
$ ./system-information.sh
Enter a label for this report: Session3-Homework
System information report: Session3-Homework
Date: Wed Oct  7 14:15:40 UTC 2026
Hostname: devops-lab
Username: root
Disk usage:
Filesystem      Size  Used Avail Use% Mounted on
overlay        1007G   11G  946G   2% /
Running processes:
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  1.7  0.0   4336  3384 ?        Ss   14:15   0:00 bash -c sleep
root           9  0.0  0.0   2728  1848 ?        S    14:15   0:00 script -qec b
root          11  0.0  0.0   2812  1880 pts/0    Ss+  14:15   0:00 sh -c bash /r
root          12  0.0  0.0   4336  3412 pts/0    S+   14:15   0:00 bash /run-scr
root          15  0.0  0.0   4336  3408 pts/0    S+   14:15   0:00 bash ./system
root          22  0.0  0.0   7904  4036 pts/0    R+   14:15   0:00 ps aux
Process information saved to system-information-output/running-processes.txt
$ ls -l system-information-output/
total 4
-rw-r--r-- 1 root root 718 Oct  7 14:15 running-processes.txt
$ head -5 system-information-output/running-processes.txt
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  1.7  0.0   4336  3384 ?        Ss   14:15   0:00 bash -c sleep 1; (sleep 2; echo Session3-Homework) | script -qec "bash /run-scripts/s03.sh" /dev/null
root           9  0.0  0.0   2728  1848 ?        S    14:15   0:00 script -qec bash /run-scripts/s03.sh /dev/null
root          11  0.0  0.0   2812  1880 pts/0    Ss+  14:15   0:00 sh -c bash /run-scripts/s03.sh
root          12  0.0  0.0   4336  3412 pts/0    S+   14:15   0:00 bash /run-scripts/s03.sh
```

## What I observed

- `read -p` printed the prompt and stored my input in the `report_label` variable, which the script then used in the report title.
- `mkdir` and `touch` created `system-information-output/running-processes.txt`.
- `ps aux > file` wrote the process list into that file instead of the screen, and `head` confirms the content was saved.
