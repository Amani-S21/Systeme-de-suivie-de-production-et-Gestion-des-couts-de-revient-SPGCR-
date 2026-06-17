from decimal import Decimal

from app.schemas.common import OrmModel


class Kpi(OrmModel):
    produced_quantity: Decimal
    average_unit_cost: Decimal
    total_production_cost: Decimal
    margin_rate: Decimal


class DashboardSummary(OrmModel):
    kpis: Kpi
    production_evolution: list[dict]
    cost_breakdown: list[dict]
    recent_productions: list[dict]
    product_costs: list[dict]
