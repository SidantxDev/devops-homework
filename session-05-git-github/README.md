# Session 05: Git / GitHub

**Name:** Siddhant Singh
**Roll number:** 24BCS10153

All commands were run in a new practice repository (`git-practice`) on Ubuntu 24.04.

---

## Task 1: `git commit -a -m` vs `git commit -m`

| Command | What gets committed |
| --- | --- |
| `git commit -m "msg"` | Only what is already **staged** with `git add` |
| `git commit -a -m "msg"` | Automatically stages **modified and deleted tracked files**, then commits. **New untracked files are NOT included.** |

### Test both commands

```bash
$ mkdir git-practice && cd git-practice && git init
Initialized empty Git repository in /root/git-practice/.git/
$ echo "first line" > tracked.txt
$ git add tracked.txt && git commit -m "Add tracked file"
[main (root-commit) 0f12500] Add tracked file
 1 file changed, 1 insertion(+)
 create mode 100644 tracked.txt
$ echo "second line" >> tracked.txt
$ echo "new file" > untracked.txt
$ git status --short
 M tracked.txt
?? untracked.txt
$ git commit -m "Try commit without staging"
On branch main
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   tracked.txt

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	untracked.txt

no changes added to commit (use "git add" and/or "git commit -a")
$ git commit -a -m "Commit with -a flag"
[main e399fca] Commit with -a flag
 1 file changed, 1 insertion(+)
$ git status --short
?? untracked.txt
$ git show --stat --oneline HEAD
e399fca Commit with -a flag
 tracked.txt | 1 +
 1 file changed, 1 insertion(+)
$ git add untracked.txt && git commit -m "Add untracked file with git add + commit -m"
[main aa26b5e] Add untracked file with git add + commit -m
 1 file changed, 1 insertion(+)
 create mode 100644 untracked.txt
$ git status
On branch main
nothing to commit, working tree clean
```

### What I observed

1. After editing `tracked.txt` and creating `untracked.txt`, `git status --short` shows `M` (modified, tracked) and `??` (untracked).
2. `git commit -m` **failed** with `no changes added to commit`, because nothing was staged.
3. `git commit -a -m` **succeeded** and committed `tracked.txt`, since it is tracked. `git show --stat` confirms only `tracked.txt` is in the commit.
4. `untracked.txt` was still `??` afterwards. A new file must first be added with `git add`, and then `git commit -m` works.

---

## Task 2: Git Cherry-Pick

**Cherry-pick** copies **one specific commit** from another branch onto the current branch, without merging the whole branch.

Steps followed:
1. Create commits on `main` and view them with `git log`
2. Create a new branch `feature/cherry-pick-demo`
3. Make 3 commits on the new branch
4. Use `git log` to find the commit for "feature change 2"
5. Cherry-pick only that commit into `main`
6. Verify

```bash
$ echo "main 1" > main-1.txt && git add main-1.txt && git commit -m "Add main change 1"
[main bdd5669] Add main change 1
 1 file changed, 1 insertion(+)
 create mode 100644 main-1.txt
$ echo "main 2" > main-2.txt && git add main-2.txt && git commit -m "Add main change 2"
[main 0392e62] Add main change 2
 1 file changed, 1 insertion(+)
 create mode 100644 main-2.txt
$ git log --oneline
0392e62 Add main change 2
bdd5669 Add main change 1
aa26b5e Add untracked file with git add + commit -m
e399fca Commit with -a flag
0f12500 Add tracked file
$ git switch -c feature/cherry-pick-demo
Switched to a new branch 'feature/cherry-pick-demo'
$ echo "feature 1" > feature-1.txt && git add feature-1.txt && git commit -m "Add feature change 1"
[feature/cherry-pick-demo 9ef4142] Add feature change 1
 1 file changed, 1 insertion(+)
 create mode 100644 feature-1.txt
$ echo "feature 2" > feature-2.txt && git add feature-2.txt && git commit -m "Add feature change 2"
[feature/cherry-pick-demo 61958e8] Add feature change 2
 1 file changed, 1 insertion(+)
 create mode 100644 feature-2.txt
$ echo "feature 3" > feature-3.txt && git add feature-3.txt && git commit -m "Add feature change 3"
[feature/cherry-pick-demo ffeaa5f] Add feature change 3
 1 file changed, 1 insertion(+)
 create mode 100644 feature-3.txt
$ git log --oneline --graph --all
* ffeaa5f Add feature change 3
* 61958e8 Add feature change 2
* 9ef4142 Add feature change 1
* 0392e62 Add main change 2
* bdd5669 Add main change 1
* aa26b5e Add untracked file with git add + commit -m
* e399fca Commit with -a flag
* 0f12500 Add tracked file
$ PICK=$(git log --format=%h --grep="feature change 2" feature/cherry-pick-demo) && echo "Commit to cherry-pick: $PICK"
Commit to cherry-pick: 61958e8
$ git switch main
Switched to branch 'main'
$ ls
main-1.txt
main-2.txt
tracked.txt
untracked.txt
$ git cherry-pick $PICK
[main de554c9] Add feature change 2
 Date: Wed Oct 7 14:19:14 2026 +0000
 1 file changed, 1 insertion(+)
 create mode 100644 feature-2.txt
$ git log --oneline --graph --all
* ffeaa5f Add feature change 3
* 61958e8 Add feature change 2
* 9ef4142 Add feature change 1
| * de554c9 Add feature change 2
|/  
* 0392e62 Add main change 2
* bdd5669 Add main change 1
* aa26b5e Add untracked file with git add + commit -m
* e399fca Commit with -a flag
* 0f12500 Add tracked file
$ ls
feature-2.txt
main-1.txt
main-2.txt
tracked.txt
untracked.txt
$ cat feature-2.txt
feature 2
$ git branch --contains HEAD
* main
```

### What I observed

- Before the cherry-pick, `main` had no `feature-*.txt` files.
- `git cherry-pick 61958e8` created a **new commit `de554c9`** on `main` with the same change and message. The hash is different because it has a different parent.
- The graph shows `main` branching off with only "Add feature change 2". `feature-1.txt` and `feature-3.txt` were **not** brought over.
- `feature-2.txt` now exists on `main` with the content `feature 2`, so the selected change is available on the main branch.
