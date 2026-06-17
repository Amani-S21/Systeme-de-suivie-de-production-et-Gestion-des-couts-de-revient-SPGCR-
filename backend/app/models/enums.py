from enum import StrEnum


class UserRole(StrEnum):
    admin = "admin"
    responsable = "responsable"
    operateur = "operateur"


class ProductionStatus(StrEnum):
    planifiee = "planifiee"
    en_cours = "en_cours"
    terminee = "terminee"
    annulee = "annulee"


class MovementType(StrEnum):
    entree = "entree"
    sortie = "sortie"
    ajustement = "ajustement"
