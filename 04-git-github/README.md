# Git and GitHub

## Task 1: `git commit -a -m`

```bash
git init
echo "first line" > tracked.txt
git add tracked.txt
git commit -m "Add tracked file"
echo "second line" >> tracked.txt
git commit -a -m "Update tracked file"
git status
```

`git commit -a -m` stages modifications and deletions to already tracked files, then commits them. It does not stage a new untracked file. `git commit -m` commits what is already in the index, so a new file must be added first.

## Task 2: Cherry-pick

Run this in a disposable practice repository, or use a copy of this repository:

```bash
git switch main
echo "main 1" > main-1.txt
git add main-1.txt && git commit -m "Add main change 1"
echo "main 2" > main-2.txt
git add main-2.txt && git commit -m "Add main change 2"
git log --oneline -2
git switch -c feature/cherry-pick-demo
echo "feature 1" > feature-1.txt
git add feature-1.txt && git commit -m "Add feature change 1"
echo "feature 2" > feature-2.txt
git add feature-2.txt && git commit -m "Add feature change 2"
git log --oneline --all
git switch main
git cherry-pick <commit-id-for-feature-1>
git log --oneline --all
git status
```

The cherry-picked change should now exist on `main`. Replace `<commit-id-for-feature-1>` with the hash shown by `git log`.

## Evidence

Paste the command output or add screenshots here before submission.