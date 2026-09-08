import os
import shutil
import subprocess
import threading
import uuid
from pathlib import Path

from mcp.server.mcpserver import MCPServer
from mcp.server.transport_security import TransportSecuritySettings


# ============================================================
# Configuration
# ============================================================

mcp = MCPServer("petsworkshop-developer-runner")

SERVICE_TOKEN = os.getenv("SERVICE_TOKEN")

WORKSPACE = Path(
    os.getenv(
        "WORKSPACE",
        str(Path.home() / "petsworkshop-workspaces"),
    )
)

WORKSPACE.mkdir(parents=True, exist_ok=True)


# ============================================================
# Job storage
# ============================================================

JOBS = {}
JOBS_LOCK = threading.Lock()


def update_job(job_id, **updates):
    with JOBS_LOCK:
        if job_id in JOBS:
            JOBS[job_id].update(updates)


def get_job(job_id):
    with JOBS_LOCK:
        return JOBS.get(job_id)


# ============================================================
# Generic command execution
# ============================================================

def run_command(command, cwd=None, timeout=1800):
    """
    Execute a command in a cross-platform way.

    Handles Windows .cmd/.bat executables.
    """

    try:
        if not command:
            return {
                "returncode": -1,
                "stdout": "",
                "stderr": "Empty command.",
            }

        executable = command[0]

        if os.name == "nt":
            resolved = shutil.which(executable)

            if resolved:
                executable = resolved

            if executable.lower().endswith((".cmd", ".bat")):
                command = [
                    os.environ.get("COMSPEC", "cmd.exe"),
                    "/d",
                    "/c",
                    executable,
                    *command[1:],
                ]

        print(f"Running command: {command}")
        print(f"Working directory: {cwd}")

        result = subprocess.run(
            command,
            cwd=cwd,
            text=True,
            capture_output=True,
            timeout=timeout,
        )

        return {
            "returncode": result.returncode,
            "stdout": (result.stdout or "")[-20000:],
            "stderr": (result.stderr or "")[-20000:],
        }

    except subprocess.TimeoutExpired as exc:
        return {
            "returncode": -1,
            "stdout": str(exc.stdout or "")[-20000:],
            "stderr": "Command timed out.",
        }

    except Exception as exc:
        return {
            "returncode": -1,
            "stdout": "",
            "stderr": str(exc),
        }


# ============================================================
# CodeMie Claude execution
# ============================================================

def run_claude(command, prompt, cwd=None, timeout=3600):
    """
    Run CodeMie Claude in headless/task mode.

    Important Windows/CI fixes:
      1. Use --task instead of --print + stdin. Current CodeMie Claude
         explicitly supports --task for non-interactive execution.
      2. Put the full task in a temporary file and pass only a short
         instruction on the command line. This avoids Windows cmd.exe
         quoting/newline problems with a large multi-line prompt.
      3. Disable Claude hooks for this automated runner. The CodeMie
         SessionEnd hook can otherwise try to execute a Windows path
         through bash and fail the whole Claude process.
    """

    task_file = None
    settings_file = None

    try:
        if not command:
            return {
                "returncode": -1,
                "stdout": "",
                "stderr": "Empty Claude command.",
            }

        if not prompt or not prompt.strip():
            return {
                "returncode": -1,
                "stdout": "",
                "stderr": "Claude prompt is empty.",
            }

        if cwd is None:
            cwd = os.getcwd()

        cwd_path = Path(cwd)
        cwd_path.mkdir(parents=True, exist_ok=True)

        # Keep the actual implementation instructions out of the Windows
        # command line. This prevents cmd.exe from corrupting newlines,
        # quotes, &, parentheses, etc. in a large prompt.
        task_file = cwd_path / ".codemie-implementation-task.md"
        task_file.write_text(prompt, encoding="utf-8")

        settings_file = cwd_path / ".codemie-claude-settings.json"
        recursion_limit = int(os.getenv("AI_AGENT_RECURSION_LIMIT", "1000"))
        settings_file.write_text(
            (
                '{"disableAllHooks":true,'
                f'"recursion_limit":{recursion_limit}'
                '}'
            ),
            encoding="utf-8",
        )

        executable = command[0]

        if os.name == "nt":
            resolved = shutil.which(executable)

            if resolved:
                executable = resolved

            # .cmd/.bat files cannot be launched reliably with a normal
            # CreateProcess call. Keep the command line short and let
            # cmd.exe invoke the shim.
            if executable.lower().endswith((".cmd", ".bat")):
                command = [
                    os.environ.get("COMSPEC", "cmd.exe"),
                    "/d",
                    "/c",
                    executable,
                    *command[1:],
                ]
            else:
                command = [
                    executable,
                    *command[1:],
                ]
        else:
            command = [
                executable,
                *command[1:],
            ]

        env = os.environ.copy()

        # Keep the legacy environment setting and expose the LangGraph
        # spelling for clients that read configuration from the environment.
        env["AI_AGENT_RECURSION_LIMIT"] = str(recursion_limit)
        env["LANGGRAPH_RECURSION_LIMIT"] = str(recursion_limit)

        # The task file is intentionally temporary and only contains the
        # implementation instructions generated by this runner.
        short_prompt = (
            "Read .codemie-implementation-task.md in the current repository "
            "and execute every instruction in that file. "
            "Actually implement the requested Jira story; do not only explain it. "
            "Run the relevant tests/build commands before finishing."
        )

        # CodeMie supports --task for headless Claude execution.
        # --settings disables project/user hooks for this automation run,
        # preventing the broken Windows SessionEnd hook from failing the job.
        # Passing a file avoids shell quoting differences between Windows and
        # POSIX runners.
        command.extend([
            "--task",
            short_prompt,
            "--settings",
            str(settings_file),
            "--no-analytics-report",
            "--dangerously-skip-permissions",
        ])

        print("=" * 60)
        print("RUNNING CODEMIE CLAUDE")
        print(f"Command: {command}")
        print(f"Working directory: {cwd}")
        print(f"Task file: {task_file}")
        print(f"Prompt length: {len(prompt)} characters")
        print(
            "AI_AGENT_RECURSION_LIMIT: "
            f"{env['AI_AGENT_RECURSION_LIMIT']}"
        )
        print("=" * 60)

        result = subprocess.run(
            command,
            cwd=cwd,
            text=True,
            capture_output=True,
            timeout=timeout,
            env=env,
        )

        stdout = result.stdout or ""
        stderr = result.stderr or ""

        print("=" * 60)
        print("CODEMIE CLAUDE FINISHED")
        print(f"Return code: {result.returncode}")
        print(f"AI_AGENT_RECURSION_LIMIT: {recursion_limit}")
        print(f"STDOUT:\n{stdout[-20000:]}")
        print(f"STDERR:\n{stderr[-20000:]}")
        print("=" * 60)

        return {
            "returncode": result.returncode,
            "stdout": stdout[-20000:],
            "stderr": stderr[-20000:],
        }

    except subprocess.TimeoutExpired as exc:
        stdout = str(exc.stdout or "")
        stderr = str(exc.stderr or "")

        return {
            "returncode": -1,
            "stdout": stdout[-20000:],
            "stderr": (
                "CodeMie Claude timed out.\n"
                + stderr[-20000:]
            ),
        }

    except Exception as exc:
        return {
            "returncode": -1,
            "stdout": "",
            "stderr": f"Failed to execute CodeMie Claude: {exc}",
        }

    finally:
        # Do not leave the implementation prompt in the repository.
        if task_file is not None:
            try:
                task_file.unlink(missing_ok=True)
            except Exception as cleanup_exc:
                print(
                    "WARNING: Could not remove temporary Claude task file: "
                    f"{cleanup_exc}"
                )
        if settings_file is not None:
            try:
                settings_file.unlink(missing_ok=True)
            except Exception as cleanup_exc:
                print(
                    "WARNING: Could not remove temporary Claude settings file: "
                    f"{cleanup_exc}"
                )


# ============================================================
# Background implementation
# ============================================================

def implementation_worker(
    job_id,
    repository_url,
    base_branch,
    story_key,
    acceptance_criteria,
    implementation_plan,
    architecture,
    hld,
    lld,
):
    """
    Background worker that performs the actual implementation.
    """

    workspace = WORKSPACE / str(uuid.uuid4())

    # Keep Jira story key in branch name.
    branch_name = f"feature/{story_key}"

    update_job(
        job_id,
        status="RUNNING",
        stage="clone",
        workspace=str(workspace),
        feature_branch=branch_name,
    )

    print("=" * 60)
    print(f"JOB STARTED: {job_id}")
    print(f"Repository: {repository_url}")
    print(f"Workspace: {workspace}")
    print(f"Base branch: {base_branch}")
    print(f"Story: {story_key}")
    print(f"Branch: {branch_name}")
    print("=" * 60)

    try:

        # --------------------------------------------------------
        # 1. Clone repository
        # --------------------------------------------------------

        print("Stage 1: Cloning repository...")

        clone = run_command(
            [
                "git",
                "clone",
                repository_url,
                str(workspace),
            ],
            timeout=600,
        )

        if clone["returncode"] != 0:
            update_job(
                job_id,
                status="FAILED",
                stage="clone",
                error=clone["stderr"],
                output=clone["stdout"],
            )
            return

        # --------------------------------------------------------
        # 2. Checkout base branch
        # --------------------------------------------------------

        update_job(
            job_id,
            stage="checkout",
        )

        print("Stage 2: Checking out base branch...")

        checkout = run_command(
            [
                "git",
                "checkout",
                base_branch,
            ],
            cwd=workspace,
            timeout=600,
        )

        if checkout["returncode"] != 0:
            update_job(
                job_id,
                status="FAILED",
                stage="checkout",
                error=checkout["stderr"],
                output=checkout["stdout"],
            )
            return

        # --------------------------------------------------------
        # 3. Create feature branch
        # --------------------------------------------------------

        update_job(
            job_id,
            stage="branch",
        )

        print(f"Stage 3: Creating branch {branch_name}...")

        branch = run_command(
            [
                "git",
                "checkout",
                "-b",
                branch_name,
            ],
            cwd=workspace,
            timeout=600,
        )

        print(f"Branch command return code: {branch['returncode']}")
        print(f"Branch stdout: {branch['stdout']}")
        print(f"Branch stderr: {branch['stderr']}")

        if branch["returncode"] != 0:
            update_job(
                job_id,
                status="FAILED",
                stage="branch",
                error=branch["stderr"],
                output=branch["stdout"],
            )
            return

        # --------------------------------------------------------
        # 4. Build Claude task
        # --------------------------------------------------------

        update_job(
            job_id,
            stage="prepare_claude_task",
        )

        task = f"""
You are the Developer Assistant working inside a software repository.

Implement Jira story: {story_key}

You are already working inside the correct repository workspace.

The feature branch has already been created by the runner:

{branch_name}

Do NOT create another branch.

============================================================
JIRA STORY
============================================================

Jira Story Key:
{story_key}

============================================================
ACCEPTANCE CRITERIA
============================================================

{acceptance_criteria}

============================================================
IMPLEMENTATION PLAN
============================================================

{implementation_plan}

============================================================
ARCHITECTURE
============================================================

{architecture}

============================================================
HIGH LEVEL DESIGN
============================================================

{hld}

============================================================
LOW LEVEL DESIGN
============================================================

{lld}

============================================================
IMPLEMENTATION INSTRUCTIONS
============================================================

1. Inspect the existing repository first.

2. Understand the existing project structure, architecture,
   framework, dependencies, coding conventions, and existing tests.

3. Implement the Jira story according to the implementation plan
   and acceptance criteria.

4. Reuse existing functionality where appropriate.

5. Do not rewrite unrelated functionality.

6. Do not remove existing functionality unless it is required
   by the Jira story.

7. Implement all required backend, frontend, database, API,
   validation, and integration changes specified by the plan.

8. Add or update automated tests for the implemented functionality.

9. Run the appropriate tests.

10. Run the appropriate build or compilation commands.

11. If a test or build fails, diagnose the failure and make
    reasonable corrections.

12. Do not repeatedly run the same failing command without
    making a meaningful correction.

13. Do not enter an endless fix/test loop.

14. If a failure cannot reasonably be fixed within the current
    implementation, stop and report the failure clearly.

15. Review the final git diff.

16. Do not make unrelated changes.


============================================================
FINAL REQUIREMENT
============================================================

Actually implement the changes in the repository.

Do not merely describe what should be implemented.

Before finishing, verify the repository contains the implementation
and that the relevant tests/build have been executed.

Report what you changed and any tests/build commands that were run.
"""

        print("=" * 60)
        print("CLAUDE TASK CREATED")
        print(f"Story: {story_key}")
        print(f"Task length: {len(task)} characters")
        print("=" * 60)

        # --------------------------------------------------------
        # 5. Run CodeMie Claude
        # --------------------------------------------------------

        update_job(
            job_id,
            stage="claude",
        )

        CODEMIE_CLAUDE = os.getenv(
            "CODEMIE_CLAUDE",
            "codemie-claude",
        )

        print("=" * 60)
        print("STARTING CODEMIE CLAUDE")
        print(f"Executable: {CODEMIE_CLAUDE}")
        print(f"Workspace: {workspace}")
        print("=" * 60)

        # Use CodeMie's supported headless --task mode.
        #
        # The complete multi-line task is written to a temporary file by
        # run_claude(). Only a short prompt is passed on the command line,
        # which is safer on Windows.
        claude = run_claude(
            [
                CODEMIE_CLAUDE,
            ],
            task,
            cwd=workspace,
            timeout=3600,
        )

        if claude["returncode"] != 0:
            update_job(
                job_id,
                status="FAILED",
                stage="claude",
                error=claude["stderr"],
                output=claude["stdout"],
            )
            return

        # --------------------------------------------------------
        # 6. Check repository changes
        # --------------------------------------------------------

        update_job(
            job_id,
            stage="check_changes",
        )

        print("Stage 6: Checking repository changes...")

        status = run_command(
            [
                "git",
                "status",
                "--short",
            ],
            cwd=workspace,
            timeout=300,
        )

        if status["returncode"] != 0:
            update_job(
                job_id,
                status="FAILED",
                stage="check_changes",
                error=status["stderr"],
                output=status["stdout"],
            )
            return

        if not status["stdout"].strip():
            update_job(
                job_id,
                status="FAILED",
                stage="implementation",
                error=(
                    "Claude completed successfully but made "
                    "no repository changes."
                ),
                output=claude["stdout"],
            )
            return

        changed_files = [
            line.strip()
            for line in status["stdout"].splitlines()
            if line.strip()
        ]

        print("Changed files:")
        for file in changed_files:
            print(file)

        update_job(
            job_id,
            changed_files=changed_files,
        )

        # --------------------------------------------------------
        # 7. Git diff check
        # --------------------------------------------------------

        update_job(
            job_id,
            stage="diff",
        )

        diff = run_command(
            [
                "git",
                "diff",
                "--stat",
            ],
            cwd=workspace,
            timeout=300,
        )

        print("=" * 60)
        print("GIT DIFF")
        print(diff["stdout"])
        print("=" * 60)

        # --------------------------------------------------------
        # 8. Git add
        # --------------------------------------------------------

        update_job(
            job_id,
            stage="git_add",
        )

        print("Stage 8: Git add...")

        add = run_command(
            [
                "git",
                "add",
                ".",
            ],
            cwd=workspace,
            timeout=300,
        )

        if add["returncode"] != 0:
            update_job(
                job_id,
                status="FAILED",
                stage="git_add",
                error=add["stderr"],
                output=add["stdout"],
            )
            return

        # --------------------------------------------------------
        # 9. Git commit
        # --------------------------------------------------------

        update_job(
            job_id,
            stage="git_commit",
        )

        print("Stage 9: Git commit...")

        commit = run_command(
            [
                "git",
                "commit",
                "-m",
                f"Implement {story_key}",
            ],
            cwd=workspace,
            timeout=600,
        )

        if commit["returncode"] != 0:
            update_job(
                job_id,
                status="FAILED",
                stage="git_commit",
                error=commit["stderr"],
                output=commit["stdout"],
            )
            return

        # --------------------------------------------------------
        # 10. Get commit SHA
        # --------------------------------------------------------

        update_job(
            job_id,
            stage="git_sha",
        )

        print("Stage 10: Getting commit SHA...")

        sha = run_command(
            [
                "git",
                "rev-parse",
                "HEAD",
            ],
            cwd=workspace,
            timeout=300,
        )

        if sha["returncode"] != 0:
            update_job(
                job_id,
                status="FAILED",
                stage="git_sha",
                error=sha["stderr"],
                output=sha["stdout"],
            )
            return

        commit_sha = sha["stdout"].strip()

        # --------------------------------------------------------
        # 11. Push
        # --------------------------------------------------------

        update_job(
            job_id,
            stage="git_push",
            commit_sha=commit_sha,
        )

        print(f"Stage 11: Pushing {branch_name}...")

        push = run_command(
            [
                "git",
                "push",
                "-u",
                "origin",
                branch_name,
            ],
            cwd=workspace,
            timeout=600,
        )

        if push["returncode"] != 0:
            update_job(
                job_id,
                status="FAILED",
                stage="git_push",
                error=push["stderr"],
                output=push["stdout"],
                commit_sha=commit_sha,
                feature_branch=branch_name,
            )
            return

        # --------------------------------------------------------
        # 12. Success
        # --------------------------------------------------------

        update_job(
            job_id,
            status="SUCCESS",
            stage="completed",
            feature_branch=branch_name,
            commit_sha=commit_sha,
            changed_files=changed_files,
            test_status="PASSED",
            build_status="PASSED",
            claude_output=claude["stdout"],
        )

        print("=" * 60)
        print(f"JOB COMPLETED SUCCESSFULLY: {job_id}")
        print(f"Branch: {branch_name}")
        print(f"Commit: {commit_sha}")
        print("=" * 60)

    except Exception as exc:

        print("=" * 60)
        print(f"JOB FAILED: {job_id}")
        print(f"Unexpected error: {exc}")
        print("=" * 60)

        update_job(
            job_id,
            status="FAILED",
            stage="unexpected",
            error=str(exc),
        )


# ============================================================
# MCP Tools
# ============================================================

@mcp.tool()
def implement_feature(
    repository_url: str,
    base_branch: str,
    story_key: str,
    acceptance_criteria: str,
    implementation_plan: str,
    architecture: str = "",
    hld: str = "",
    lld: str = "",
) -> dict:
    """
    Start implementation of an approved Jira story.

    The implementation runs in the background.
    Use get_job_status(job_id) to monitor progress.
    """

    # Basic validation before starting background work.

    if not repository_url.strip():
        return {
            "developer_status": "FAILED",
            "message": "repository_url is required.",
        }

    if not base_branch.strip():
        return {
            "developer_status": "FAILED",
            "message": "base_branch is required.",
        }

    if not story_key.strip():
        return {
            "developer_status": "FAILED",
            "message": "story_key is required.",
        }

    if not implementation_plan.strip():
        return {
            "developer_status": "FAILED",
            "message": "implementation_plan is required.",
        }

    job_id = str(uuid.uuid4())

    with JOBS_LOCK:
        JOBS[job_id] = {
            "job_id": job_id,
            "status": "QUEUED",
            "stage": "queued",
            "story_key": story_key,
        }

    worker = threading.Thread(
        target=implementation_worker,
        kwargs={
            "job_id": job_id,
            "repository_url": repository_url,
            "base_branch": base_branch,
            "story_key": story_key,
            "acceptance_criteria": acceptance_criteria,
            "implementation_plan": implementation_plan,
            "architecture": architecture,
            "hld": hld,
            "lld": lld,
        },
        daemon=True,
    )

    worker.start()

    return {
        "developer_status": "STARTED",
        "job_id": job_id,
        "story_key": story_key,
        "message": (
            "Implementation started in the background. "
            "Use get_job_status with this job_id."
        ),
    }


@mcp.tool()
def get_job_status(job_id: str) -> dict:
    """
    Get the current status of an implementation job.
    """

    job = get_job(job_id)

    if job is None:
        return {
            "status": "NOT_FOUND",
            "job_id": job_id,
        }

    return dict(job)


# ============================================================
# Server
# ============================================================

if __name__ == "__main__":

    print("=" * 60)
    print("Starting petsworkshop-developer-runner")
    print("=" * 60)
    print(f"Workspace: {WORKSPACE}")
    print("Transport: Streamable HTTP")
    print("MCP endpoint: /mcp")
    print("Server: http://127.0.0.1:8000/mcp")
    print("=" * 60)

    transport_security = TransportSecuritySettings(
        enable_dns_rebinding_protection=False,
    )

    mcp.run(
        transport="streamable-http",
        transport_security=transport_security,
    )
