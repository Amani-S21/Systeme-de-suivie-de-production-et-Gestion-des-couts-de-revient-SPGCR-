import unittest
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.models.bom import BomItem
from app.models.enums import ProductionStatus, UserRole
from app.models.material import Material, StockMovement
from app.models.product import Product
from app.models.user import User
from app.schemas.cost import CostCreate
from app.schemas.material import MaterialCreate
from app.schemas.production import ProductionCreate
from app.services.cost_service import calculate_cost
from app.services.production_service import create_production


class ProductionCostFlowTest(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)
        self.user = User(
            email="admin@spcr.com",
            login="admin",
            hashed_password="test",
            first_name="Admin",
            last_name="SPCR",
            role=UserRole.admin_msd,
            is_active=True,
        )
        self.product = Product(
            name="Produit Test",
            sku="PRD-TEST",
            unit="unite",
            sale_price=Decimal("200"),
        )
        self.material = Material(
            code="MAT-TEST",
            name="Matiere Test",
            unit="kg",
            quantity=Decimal("100"),
            unit_cost=Decimal("10"),
            minimum_stock=Decimal("20"),
        )
        self.db.add_all([self.user, self.product, self.material])
        self.db.flush()
        self.db.add(
            BomItem(
                product_id=self.product.id,
                material_id=self.material.id,
                quantity_required=Decimal("2"),
            )
        )
        self.db.commit()

    def tearDown(self) -> None:
        self.db.close()
        self.engine.dispose()

    def test_bom_decreases_stock_and_feeds_cost_once(self) -> None:
        production = create_production(
            self.db,
            ProductionCreate(
                product_id=self.product.id,
                quantity=Decimal("10"),
                status=ProductionStatus.en_cours,
            ),
            self.user,
        )

        self.assertEqual(self.material.quantity, Decimal("80"))
        self.assertEqual(len(production.materials), 1)
        self.assertEqual(production.materials[0].quantity_used, Decimal("20"))
        self.assertEqual(production.materials[0].unit_cost, Decimal("10"))
        movement = self.db.scalar(select(StockMovement))
        self.assertIsNotNone(movement)
        self.assertEqual(movement.quantity, Decimal("20"))

        cost = calculate_cost(
            self.db,
            production.id,
            CostCreate(
                labor_cost=Decimal("100"),
                overhead_cost=Decimal("50"),
            ),
            user_id=self.user.id,
        )
        self.assertEqual(cost.raw_material_cost, Decimal("200"))
        self.assertEqual(cost.total_cost, Decimal("350"))
        self.assertEqual(cost.unit_cost, Decimal("35"))
        self.assertGreater(cost.margin_rate, Decimal("0"))

        calculate_cost(self.db, production.id, CostCreate(), user_id=self.user.id)
        self.assertEqual(self.material.quantity, Decimal("80"))

    def test_minimum_threshold_requires_confirmation(self) -> None:
        self.material.quantity = Decimal("30")
        self.db.flush()
        with self.assertRaises(HTTPException) as raised:
            create_production(
                self.db,
                ProductionCreate(
                    product_id=self.product.id,
                    quantity=Decimal("5"),
                    status=ProductionStatus.en_cours,
                ),
                self.user,
            )
        self.assertEqual(raised.exception.status_code, 409)
        self.assertIn("Confirmation requise", str(raised.exception.detail))
        self.assertEqual(self.material.quantity, Decimal("30"))

    def test_zero_minimum_stock_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            MaterialCreate(
                code="MAT-ZERO",
                name="Matiere sans seuil",
                minimum_stock=Decimal("0"),
            )


if __name__ == "__main__":
    unittest.main()
