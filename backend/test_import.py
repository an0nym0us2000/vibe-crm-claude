#!/usr/bin/env python
"""Test backend imports"""

try:
    print("Testing imports...")
    from app.main import app
    print("✅ SUCCESS! Backend imports work!")
except Exception as e:
    print(f"❌ ERROR: {type(e).__name__}")
    print(f"Message: {str(e)}")
    import traceback
    traceback.print_exc()
