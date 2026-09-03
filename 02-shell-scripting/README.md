# Shell Scripting: System Information

## Run

```bash
chmod +x system-information.sh
./system-information.sh
```

The script uses variables for report data, asks for input with `read -p`, creates a directory with `mkdir`, creates a file with `touch`, prints date/hostname/username/disk usage/processes, and redirects `ps aux` to `system-information-output/running-processes.txt`.

## Evidence

Paste the terminal output here after running the script. Include the generated process file in the screenshot or show it with:

```bash
cat system-information-output/running-processes.txt
```