from sqlalchemy.orm import Session
from app.models.category import Category, CategoryType

EXPENSE_CATEGORIES = [
    {"name": "Alimentación", "color": "#F59E0B", "icon": "shopping-cart"},
    {"name": "Transporte", "color": "#3B82F6", "icon": "car"},
    {"name": "Salud", "color": "#EF4444", "icon": "heart"},
    {"name": "Entretenimiento", "color": "#8B5CF6", "icon": "film"},
    {"name": "Educación", "color": "#06B6D4", "icon": "book"},
    {"name": "Ropa", "color": "#EC4899", "icon": "shopping-bag"},
    {"name": "Hogar", "color": "#84CC16", "icon": "home"},
    {"name": "Servicios", "color": "#F97316", "icon": "zap"},
    {"name": "Restaurantes", "color": "#EF4444", "icon": "utensils"},
    {"name": "Tecnología", "color": "#6366F1", "icon": "monitor"},
    {"name": "Deporte", "color": "#10B981", "icon": "activity"},
    {"name": "Otros gastos", "color": "#6B7280", "icon": "tag"},
]

INCOME_CATEGORIES = [
    {"name": "Salario", "color": "#10B981", "icon": "briefcase"},
    {"name": "Freelance", "color": "#3B82F6", "icon": "code"},
    {"name": "Inversiones", "color": "#F59E0B", "icon": "trending-up"},
    {"name": "Regalos", "color": "#EC4899", "icon": "gift"},
    {"name": "Otros ingresos", "color": "#6B7280", "icon": "plus-circle"},
]


def seed_categories(db: Session, user_id: int):
    for cat in EXPENSE_CATEGORIES:
        db.add(Category(
            user_id=user_id,
            name=cat["name"],
            type=CategoryType.expense,
            color=cat["color"],
            icon=cat["icon"],
            is_default=True,
        ))
    for cat in INCOME_CATEGORIES:
        db.add(Category(
            user_id=user_id,
            name=cat["name"],
            type=CategoryType.income,
            color=cat["color"],
            icon=cat["icon"],
            is_default=True,
        ))
    db.commit()
