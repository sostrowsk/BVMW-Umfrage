#!/usr/bin/env python3
import argparse
import json
import subprocess
import sys
import time
from datetime import datetime
from typing import Any

import psutil
import requests


class ServiceMonitor:
    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        self.metrics = {}

    def log(self, message: str):
        if self.verbose:
            print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}")

    def check_backend_metrics(self) -> dict[str, Any]:
        metrics = {
            "status": "unknown",
            "response_time_ms": None,
            "cpu_usage": None,
            "memory_usage_mb": None,
            "active_connections": None,
            "error_rate": None,
        }

        try:
            start_time = time.time()
            response = requests.get("http://localhost:8000/health", timeout=5)
            response_time = (time.time() - start_time) * 1000

            if response.status_code == 200:
                metrics["status"] = "healthy"
                metrics["response_time_ms"] = round(response_time, 2)
            else:
                metrics["status"] = "unhealthy"

            for proc in psutil.process_iter(["pid", "name", "cpu_percent", "memory_info"]):
                if "uvicorn" in proc.info["name"] or "python" in proc.info["name"]:
                    metrics["cpu_usage"] = proc.info["cpu_percent"]
                    metrics["memory_usage_mb"] = round(proc.info["memory_info"].rss / 1024 / 1024, 2)
                    break

            try:
                result = subprocess.run(
                    ["ss", "-ant", "state", "established", "( dport = 8000 or sport = 8000 )"],
                    capture_output=True,
                    text=True,
                )
                metrics["active_connections"] = len(result.stdout.strip().split("\n")) - 1
            except Exception:
                pass

        except requests.RequestException as e:
            metrics["status"] = "unhealthy"
            self.log(f"Backend check failed: {e}")
        except Exception as e:
            self.log(f"Error collecting backend metrics: {e}")

        return metrics

    def check_frontend_metrics(self) -> dict[str, Any]:
        metrics = {
            "status": "unknown",
            "response_time_ms": None,
            "build_size_mb": None,
            "static_files_count": None,
            "cache_hit_rate": None,
        }

        try:
            start_time = time.time()
            response = requests.get("http://localhost:5173", timeout=5)
            response_time = (time.time() - start_time) * 1000

            if response.status_code == 200:
                metrics["status"] = "healthy"
                metrics["response_time_ms"] = round(response_time, 2)
            else:
                start_time = time.time()
                response = requests.get("http://localhost:80", timeout=5)
                response_time = (time.time() - start_time) * 1000

                if response.status_code == 200:
                    metrics["status"] = "healthy"
                    metrics["response_time_ms"] = round(response_time, 2)
                else:
                    metrics["status"] = "unhealthy"

        except requests.RequestException:
            metrics["status"] = "unhealthy"
        except Exception as e:
            self.log(f"Error collecting frontend metrics: {e}")

        try:
            import os

            dist_path = "/opt/survey-platform/frontend/dist"
            if os.path.exists(dist_path):
                total_size = 0
                file_count = 0
                for dirpath, _dirnames, filenames in os.walk(dist_path):
                    for f in filenames:
                        fp = os.path.join(dirpath, f)
                        total_size += os.path.getsize(fp)
                        file_count += 1
                metrics["build_size_mb"] = round(total_size / 1024 / 1024, 2)
                metrics["static_files_count"] = file_count
        except Exception as e:
            self.log(f"Error calculating build size: {e}")

        return metrics

    def check_database_metrics(self) -> dict[str, Any]:
        metrics = {"status": "unknown", "connections": None, "size_mb": None, "query_performance_ms": None}

        try:
            result = subprocess.run(["pg_isready", "-h", "localhost", "-p", "5433"], capture_output=True, text=True)
            if result.returncode == 0:
                metrics["status"] = "healthy"
            else:
                metrics["status"] = "unhealthy"

            try:
                import psycopg2

                conn = psycopg2.connect(
                    host="localhost", port=5433, database="bvmw_survey", user="user", password="password"
                )
                cur = conn.cursor()

                cur.execute("SELECT count(*) FROM pg_stat_activity;")
                metrics["connections"] = cur.fetchone()[0]

                cur.execute("SELECT pg_database_size('bvmw_survey') / 1024 / 1024;")
                metrics["size_mb"] = round(cur.fetchone()[0], 2)

                start_time = time.time()
                cur.execute("SELECT 1;")
                metrics["query_performance_ms"] = round((time.time() - start_time) * 1000, 2)

                cur.close()
                conn.close()
            except Exception as e:
                self.log(f"Error querying database: {e}")

        except Exception as e:
            metrics["status"] = "unhealthy"
            self.log(f"Database check failed: {e}")

        return metrics

    def check_system_metrics(self) -> dict[str, Any]:
        metrics = {
            "cpu_usage_percent": psutil.cpu_percent(interval=1),
            "memory_usage_percent": psutil.virtual_memory().percent,
            "disk_usage_percent": psutil.disk_usage("/").percent,
            "load_average": psutil.getloadavg(),
            "network_connections": len(psutil.net_connections()),
        }
        return metrics

    def collect_all_metrics(self) -> dict[str, Any]:
        self.log("Collecting metrics...")

        metrics = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "backend": self.check_backend_metrics(),
            "frontend": self.check_frontend_metrics(),
            "database": self.check_database_metrics(),
            "system": self.check_system_metrics(),
        }

        overall_status = "healthy"
        for service in ["backend", "frontend", "database"]:
            if metrics[service]["status"] == "unhealthy":
                overall_status = "unhealthy"
                break
            elif metrics[service]["status"] == "degraded":
                overall_status = "degraded"

        metrics["overall_status"] = overall_status

        return metrics

    def format_metrics(self, metrics: dict[str, Any], format_type: str = "text") -> str:
        if format_type == "json":
            return json.dumps(metrics, indent=2)

        output = []
        output.append("=" * 60)
        output.append("SERVICE MONITORING REPORT")
        output.append("=" * 60)
        output.append(f"Timestamp: {metrics['timestamp']}")
        output.append(f"Overall Status: {metrics['overall_status'].upper()}")
        output.append("")

        output.append("BACKEND SERVICE:")
        output.append(f"  Status: {metrics['backend']['status']}")
        if metrics["backend"]["response_time_ms"]:
            output.append(f"  Response Time: {metrics['backend']['response_time_ms']} ms")
        if metrics["backend"]["cpu_usage"]:
            output.append(f"  CPU Usage: {metrics['backend']['cpu_usage']}%")
        if metrics["backend"]["memory_usage_mb"]:
            output.append(f"  Memory Usage: {metrics['backend']['memory_usage_mb']} MB")
        if metrics["backend"]["active_connections"]:
            output.append(f"  Active Connections: {metrics['backend']['active_connections']}")
        output.append("")

        output.append("FRONTEND SERVICE:")
        output.append(f"  Status: {metrics['frontend']['status']}")
        if metrics["frontend"]["response_time_ms"]:
            output.append(f"  Response Time: {metrics['frontend']['response_time_ms']} ms")
        if metrics["frontend"]["build_size_mb"]:
            output.append(f"  Build Size: {metrics['frontend']['build_size_mb']} MB")
        if metrics["frontend"]["static_files_count"]:
            output.append(f"  Static Files: {metrics['frontend']['static_files_count']}")
        output.append("")

        output.append("DATABASE:")
        output.append(f"  Status: {metrics['database']['status']}")
        if metrics["database"]["connections"]:
            output.append(f"  Active Connections: {metrics['database']['connections']}")
        if metrics["database"]["size_mb"]:
            output.append(f"  Database Size: {metrics['database']['size_mb']} MB")
        if metrics["database"]["query_performance_ms"]:
            output.append(f"  Query Performance: {metrics['database']['query_performance_ms']} ms")
        output.append("")

        output.append("SYSTEM RESOURCES:")
        output.append(f"  CPU Usage: {metrics['system']['cpu_usage_percent']}%")
        output.append(f"  Memory Usage: {metrics['system']['memory_usage_percent']}%")
        output.append(f"  Disk Usage: {metrics['system']['disk_usage_percent']}%")
        output.append(f"  Load Average: {', '.join(map(str, metrics['system']['load_average']))}")
        output.append(f"  Network Connections: {metrics['system']['network_connections']}")
        output.append("")

        if metrics["overall_status"] == "healthy":
            output.append("✓ All services are healthy")
        elif metrics["overall_status"] == "degraded":
            output.append("⚠ Some services are degraded")
        else:
            output.append("✗ Critical services are unhealthy")

        output.append("=" * 60)

        return "\n".join(output)


def main():
    parser = argparse.ArgumentParser(description="Monitor Survey Platform Services")
    parser.add_argument("--json", action="store_true", help="Output in JSON format")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose logging")
    parser.add_argument("--continuous", type=int, metavar="SECONDS", help="Run continuously with specified interval")
    parser.add_argument("--alert-webhook", type=str, help="Webhook URL for alerts (when services are unhealthy)")

    args = parser.parse_args()

    monitor = ServiceMonitor(verbose=args.verbose)

    try:
        if args.continuous:
            while True:
                metrics = monitor.collect_all_metrics()

                if args.json:
                    print(monitor.format_metrics(metrics, "json"))
                else:
                    print(monitor.format_metrics(metrics, "text"))

                if args.alert_webhook and metrics["overall_status"] == "unhealthy":
                    try:
                        requests.post(
                            args.alert_webhook,
                            json={
                                "text": f"⚠️ Survey Platform Alert: Services are {metrics['overall_status']}",
                                "metrics": metrics,
                            },
                        )
                    except Exception:
                        pass

                time.sleep(args.continuous)
        else:
            metrics = monitor.collect_all_metrics()

            if args.json:
                print(monitor.format_metrics(metrics, "json"))
            else:
                print(monitor.format_metrics(metrics, "text"))

            if metrics["overall_status"] == "unhealthy":
                sys.exit(2)
            elif metrics["overall_status"] == "degraded":
                sys.exit(1)
            else:
                sys.exit(0)

    except KeyboardInterrupt:
        print("\nMonitoring stopped")
        sys.exit(0)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(3)


if __name__ == "__main__":
    main()
