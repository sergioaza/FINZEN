from datetime import datetime
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def log_action(
    db: Session,
    action: str,
    user_id: int | None = None,
    ip: str | None = None,
    details: str | None = None,
) -> None:
    entry = AuditLog(
        user_id=user_id,
        action=action,
        ip=ip,
        details=details,
        created_at=datetime.utcnow(),
    )
    db.add(entry)
    db.commit()
