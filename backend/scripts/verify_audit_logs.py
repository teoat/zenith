#!/usr/bin/env python3
"""Run audit log verification and print a short report."""
from backend.services.audit_verifier import verify_all


def main():
    total, passed, failed = verify_all()
    print(f"Audit logs: total={total}, verified={passed}, failed={len(failed)}")
    if failed:
        print("Failed IDs:")
        for fid in failed:
            print(" -", fid)


if __name__ == "__main__":
    main()
