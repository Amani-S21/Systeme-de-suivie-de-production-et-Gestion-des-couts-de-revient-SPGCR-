import json
import time
import urllib.parse
import urllib.request
from urllib.error import HTTPError

from app.core.config import settings

BASE = "http://127.0.0.1:8000/api/v1"


def call(path, method="GET", payload=None, token=None, form=False):
    headers, data = {}, None
    if token:
        headers["Authorization"] = "Bearer " + token
    if payload is not None:
        if form:
            data = urllib.parse.urlencode(payload).encode()
        else:
            headers["Content-Type"] = "application/json"
            data = json.dumps(payload).encode()
    try:
        response = urllib.request.urlopen(urllib.request.Request(BASE + path, data=data, headers=headers, method=method))
        return response.status, json.load(response)
    except HTTPError as error:
        return error.code, json.load(error)


def login(username, password):
    return call("/auth/login", "POST", {"username": username, "password": password}, form=True)[1]["access_token"]


admin_token = login(settings.default_admin_login, settings.default_admin_password)
suffix = str(int(time.time()))
created_users = []


def create_user(prefix, role):
    username = prefix + suffix
    status, user = call("/users", "POST", {
        "email": username + "@spcr.com", "login": username, "password": "TestPass@12345",
        "first_name": prefix, "last_name": "RBAC", "role": role, "is_active": True,
    }, admin_token)
    assert status == 200, user
    created_users.append(user["id"])
    return user, login(username, "TestPass@12345")


responsible, responsible_token = create_user("responsable", "responsable_production")
operator, operator_token = create_user("operateur", "operateur_usine")
operator_matrix = {"/dashboard/summary": 200, "/productions": 200, "/products": 200, "/materials": 403, "/charges": 403, "/users": 403, "/users/operators": 403}
responsible_matrix = {"/dashboard/summary": 200, "/productions": 200, "/products": 200, "/materials": 200, "/charges": 200, "/users": 403, "/users/operators": 200}
for path, expected in operator_matrix.items():
    actual = call(path, token=operator_token)[0]
    assert actual == expected, ("operator", path, actual)
for path, expected in responsible_matrix.items():
    actual = call(path, token=responsible_token)[0]
    assert actual == expected, ("responsable", path, actual)
summary = call("/dashboard/summary", token=operator_token)[1]
assert float(summary["kpis"]["average_unit_cost"]) == 0 and summary["cost_breakdown"] == []
products = call("/products", token=admin_token)[1]
production_id = None
if products:
    status, production = call("/productions", "POST", {
        "product_id": products[0]["id"], "operator_id": operator["id"], "quantity": 5,
        "status": "en_cours", "materials": [],
    }, responsible_token)
    assert status == 200, production
    production_id = production["id"]
    assert any(item["id"] == production_id for item in call("/productions", token=operator_token)[1])
    assert call("/productions/" + str(production_id), "PATCH", {"quantity": 99}, operator_token)[0] == 403
if production_id:
    call("/productions/" + str(production_id), "DELETE", token=admin_token)
for user_id in reversed(created_users):
    call("/users/" + str(user_id), "DELETE", token=admin_token)
print("Matrice RBAC admin/responsable/operateur: OK")
