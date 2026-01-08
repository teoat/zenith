#!/usr/bin/env python3
"""
Zenith Platform Deployment Script
Deploys backend and frontend using Docker Compose or Railway/Vercel

Usage:
    python deploy.py docker          # Docker Compose deployment
    python deploy.py railway         # Deploy to Railway
    python deploy.py vercel          # Deploy frontend to Vercel
    python deploy.py status          # Check deployment status
    python deploy.py logs           # View logs
    python deploy.py stop           # Stop all services
"""

import argparse
import os
import subprocess
import sys
from datetime import datetime


class Colors:
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BLUE = "\033[94m"
    RESET = "\033[0m"
    BOLD = "\033[1m"


def print_step(message: str):
    print(f"{Colors.BLUE}==> {Colors.BOLD}{message}{Colors.RESET}")


def print_success(message: str):
    print(f"{Colors.GREEN}✓ {message}{Colors.RESET}")


def print_warning(message: str):
    print(f"{Colors.YELLOW}⚠ {message}{Colors.RESET}")


def print_error(message: str):
    print(f"{Colors.RED}✗ {message}{Colors.RESET}")


def run_command(
    cmd: list[str], cwd: str | None = None, capture: bool = False
) -> tuple[int, str, str]:
    """Run a shell command and return exit code, stdout, stderr"""
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=capture,
            text=True,
            timeout=300,
        )
        return result.returncode, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return 1, "", "Command timed out"
    except FileNotFoundError:
        return 1, "", f"Command not found: {cmd[0]}"
    except Exception as e:
        return 1, "", str(e)


def check_docker() -> bool:
    """Check if Docker is running"""
    code, stdout, _ = run_command(["docker", "info"], capture=True)
    return code == 0


def check_railway_cli() -> bool:
    """Check if Railway CLI is installed"""
    code, _, _ = run_command(["which", "railway"], capture=True)
    return code == 0


def check_vercel_cli() -> bool:
    """Check if Vercel CLI is installed"""
    code, _, _ = run_command(["which", "vercel"], capture=True)
    return code == 0


def deploy_docker(args: argparse.Namespace):
    """Deploy using Docker Compose"""
    print_step("Deploying with Docker Compose...")

    if not check_docker():
        print_error("Docker is not running. Please start Docker Desktop.")
        print("Start Docker Desktop, then run this script again.")
        return False

    project_dir = os.path.dirname(os.path.abspath(__file__))

    if args.compose_file:
        compose_file = args.compose_file
    else:
        compose_file = os.path.join(project_dir, "docker-compose.yml")

    if not os.path.exists(compose_file):
        print_error(f"Docker Compose file not found: {compose_file}")
        return False

    print_step("Building and starting services...")

    cmd = ["docker-compose", "-f", compose_file, "up", "-d", "--build"]

    if args.detach:
        cmd.append("--build")

    code, stdout, stderr = run_command(cmd, cwd=project_dir)

    if code != 0:
        print_error(f"Failed to start services: {stderr}")
        return False

    print_success("Services started successfully!")
    print()
    print("Services running:")
    print("  Backend:  http://localhost:8000")
    print("  Frontend: http://localhost:5173")
    print("  Redis:    localhost:6379")
    print()
    print("View logs: python deploy.py docker logs")
    print("Stop:      python deploy.py docker stop")

    return True


def deploy_railway(args: argparse.Namespace):
    """Deploy to Railway"""
    print_step("Deploying to Railway...")

    if not check_railway_cli():
        print_warning("Railway CLI not installed. Installing...")
        code, _, _ = run_command(
            ["curl", "-fsSL", "https://railway.app/install.sh", "|", "sh"],
            capture=True,
        )
        if code != 0:
            print_error("Failed to install Railway CLI")
            return False

    project_dir = os.path.dirname(os.path.abspath(__file__))

    services = [
        ("api-gateway", "API Gateway"),
        ("ai-ml-service", "AI/ML Service"),
        ("fraud-intel-service", "Fraud+Intel Service"),
        ("workflow-regulatory-service", "Workflow+Reg Service"),
    ]

    for service_dir, service_name in services:
        service_path = os.path.join(project_dir, "services", service_dir)

        if not os.path.exists(service_path):
            print_warning(f"Service not found: {service_dir}")
            continue

        print_step(f"Deploying {service_name}...")

        cmd = ["railway", "up", "--detach"]
        code, stdout, stderr = run_command(cmd, cwd=service_path)

        if code != 0:
            print_error(f"Failed to deploy {service_name}: {stderr}")
            continue

        print_success(f"{service_name} deployed successfully")

    print_success("All services deployed to Railway!")
    print()
    print("View logs: python deploy.py railway logs")
    print("Status:    python deploy.py railway status")

    return True


def deploy_vercel(args: argparse.Namespace):
    """Deploy frontend to Vercel"""
    print_step("Deploying to Vercel...")

    if not check_vercel_cli():
        print_warning("Vercel CLI not installed. Installing...")
        code, _, _ = run_command(
            ["npm", "install", "-g", "vercel@latest"],
            capture=True,
        )
        if code != 0:
            print_error("Failed to install Vercel CLI")
            return False

    frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")

    print_step("Building frontend...")

    cmd = ["npm", "run", "build"]
    code, stdout, stderr = run_command(cmd, cwd=frontend_dir)

    if code != 0:
        print_error(f"Build failed: {stderr}")
        return False

    print_success("Frontend built successfully")

    print_step("Deploying to Vercel...")

    cmd = ["vercel", "--prod", "--yes"]
    code, stdout, stderr = run_command(cmd, cwd=frontend_dir)

    if code != 0:
        print_error(f"Deployment failed: {stderr}")
        return False

    print_success("Frontend deployed to Vercel!")
    print()
    print("View deployment: vercel --prod --logs")
    print("Custom domain:  vercel domains add yourdomain.com")

    return True


def show_status(args: argparse.Namespace):
    """Show deployment status"""
    print_step("Deployment Status")
    print()

    print("Docker:")
    if check_docker():
        print_success("  Docker is running")

        code, stdout, _ = run_command(
            ["docker-compose", "ps"],
            cwd=os.path.dirname(os.path.abspath(__file__)),
            capture=True,
        )
        if code == 0:
            print(stdout)
    else:
        print_warning("  Docker is not running")

    print()
    print("Railway CLI:")
    if check_railway_cli():
        print_success("  Installed")
    else:
        print_warning("  Not installed")

    print()
    print("Vercel CLI:")
    if check_vercel_cli():
        print_success("  Installed")
    else:
        print_warning("  Not installed")


def show_logs(args: argparse.Namespace):
    """Show logs from services"""
    project_dir = os.path.dirname(os.path.abspath(__file__))

    if not check_docker():
        print_error("Docker is not running")
        return

    compose_file = os.path.join(project_dir, "docker-compose.yml")

    if not os.path.exists(compose_file):
        print_error(f"Docker Compose file not found: {compose_file}")
        return

    service = args.service if hasattr(args, "service") and args.service else None

    cmd = ["docker-compose", "-f", compose_file, "logs", "-f"]

    if service:
        cmd.append(service)

    print_step(f"Showing logs for {'all services' if not service else service}...")

    os.execvp("docker-compose", cmd)


def stop_services(args: argparse.Namespace):
    """Stop all services"""
    print_step("Stopping services...")

    if not check_docker():
        print_warning("Docker is not running")
        return

    project_dir = os.path.dirname(os.path.abspath(__file__))
    compose_file = os.path.join(project_dir, "docker-compose.yml")

    if not os.path.exists(compose_file):
        print_error(f"Docker Compose file not found: {compose_file}")
        return

    cmd = ["docker-compose", "-f", compose_file, "down", "-v"]
    code, stdout, stderr = run_command(cmd, cwd=project_dir)

    if code != 0:
        print_error(f"Failed to stop services: {stderr}")
        return

    print_success("All services stopped")


def create_startup_script():
    """Create a convenient startup script"""
    script_content = """#!/bin/bash
# Zenith Platform - Quick Start Script
# Starts all services for local development

set -e

echo "=========================================="
echo "  Zenith Platform - Development Startup"
echo "=========================================="
echo ""

# Check Docker
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "Starting services..."
echo ""

# Start infrastructure
echo "Starting Redis..."
docker run -d --name zenith-redis-dev \
    -p 6379:6379 \
    redis:7-alpine

# Start Backend
echo "Starting Backend..."
cd "$(dirname "$0")"
docker-compose up -d backend

# Start Frontend
echo "Starting Frontend..."
docker-compose up -d frontend

echo ""
echo "=========================================="
echo "  Services Started!"
echo "=========================================="
echo ""
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo "  Redis:    localhost:6379"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop:      docker-compose down"
"""

    script_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "start_dev.sh"
    )

    with open(script_path, "w") as f:
        f.write(script_content)

    os.chmod(script_path, 0o755)

    print_success(f"Created startup script: {script_path}")
    print("Run with: ./start_dev.sh")


def main():
    parser = argparse.ArgumentParser(
        description="Zenith Platform Deployment Script",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python deploy.py docker          # Deploy with Docker Compose
    python deploy.py docker -f file  # Use custom compose file
    python deploy.py railway         # Deploy to Railway
    python deploy.py vercel          # Deploy frontend to Vercel
    python deploy.py status          # Check status
    python deploy.py logs           # View logs
    python deploy.py stop           # Stop all services
        """,
    )

    subparsers = parser.add_subparsers(dest="command", help="Deployment commands")

    docker_parser = subparsers.add_parser("docker", help="Deploy with Docker Compose")
    docker_parser.add_argument(
        "-f", "--compose-file", help="Path to Docker Compose file"
    )
    docker_parser.add_argument(
        "-d", "--detach", action="store_true", help="Run in detached mode"
    )

    subparsers.add_parser("railway", help="Deploy to Railway")
    subparsers.add_parser("vercel", help="Deploy frontend to Vercel")

    status_parser = subparsers.add_parser("status", help="Check deployment status")

    logs_parser = subparsers.add_parser("logs", help="View logs")
    logs_parser.add_argument(
        "service", nargs="?", help="Specific service to show logs for"
    )

    subparsers.add_parser("stop", help="Stop all services")
    subparsers.add_parser("create-script", help="Create startup script")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 1

    print()
    print(f"{Colors.BOLD}🚀 Zenith Platform Deployment{Colors.RESET}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print()

    if args.command == "docker":
        success = deploy_docker(args)
    elif args.command == "railway":
        success = deploy_railway(args)
    elif args.command == "vercel":
        success = deploy_vercel(args)
    elif args.command == "status":
        show_status(args)
        success = True
    elif args.command == "logs":
        show_logs(args)
        success = True
    elif args.command == "stop":
        stop_services(args)
        success = True
    elif args.command == "create-script":
        create_startup_script()
        success = True
    else:
        print_error(f"Unknown command: {args.command}")
        success = False

    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
