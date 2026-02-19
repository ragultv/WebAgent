import urllib.request, json

# Check that the route exists by hitting the OpenAPI docs
req = urllib.request.urlopen("http://localhost:8000/openapi.json")
spec = json.loads(req.read())
paths = list(spec.get("paths", {}).keys())
route = "/api/project/stream-generate"
found = route in paths
print(f"Route '{route}' present: {found}")
print("All /api/project/* routes:", [p for p in paths if "/project/" in p])
