import sys
import os

# Add backend to sys.path so 'app' can be imported
backend_path = os.path.join(os.path.dirname(__file__), "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Add services path
services_path = os.path.join(backend_path, "services")
if services_path not in sys.path:
    sys.path.insert(0, services_path)

# Add app path
app_path = os.path.join(backend_path, "app")
if app_path not in sys.path:
    sys.path.insert(0, app_path)

print(f"Python paths added:")
print(f"  Backend: {backend_path}")
print(f"  Services: {services_path}")
print(f"  App: {app_path}")

# Import the FastAPI app with better error handling
try:
    print("Attempting to import from backend.app.main...")
    from backend.app.main import app
    print("✅ Successfully imported app!")
except ImportError as e:
    print(f"❌ Import error from backend.app.main: {e}")
    try:
        print("Trying alternative import from app.main...")
        from backend.app.main import app
        print("✅ Successfully imported app from alternative path!")
    except ImportError as e2:
        print(f"❌ Alternative import also failed: {e2}")
        print("Available modules:")
        for path in sys.path:
            if "AutoFlow" in path:
                print(f"  {path}")
        raise ImportError(f"Could not import app from any path. Original error: {e}")
