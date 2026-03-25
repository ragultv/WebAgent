import sys
sys.path.insert(0, 'd:/WebAgent')
from backend.routes.project import router
paths = [r.path for r in router.routes]
print("Routes registered:", paths)
