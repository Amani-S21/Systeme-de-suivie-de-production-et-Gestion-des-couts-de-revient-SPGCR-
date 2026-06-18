from enum import StrEnum


class UserRole(StrEnum):
    admin_msd = "admin_msd"
    responsable_production = "responsable_production"
    operateur_usine = "operateur_usine"


class ProductionStatus(StrEnum):
    planifiee = "planifiee"
    en_cours = "en_cours"
    terminee = "terminee"
    annulee = "annulee"


class MovementType(StrEnum):
    entree = "entree"
    sortie = "sortie"
    ajustement = "ajustement"
