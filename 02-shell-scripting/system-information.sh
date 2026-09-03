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