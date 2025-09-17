import hashlib
import secrets
import string
from datetime import UTC, datetime


def generate_invitation_token() -> tuple[str, str]:
    """
    Generates a secure random token for survey invitations.
    Returns a tuple of (token, token_hash).
    """
    alphabet = string.ascii_letters + string.digits
    token = ''.join(secrets.choice(alphabet) for _ in range(32))
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    return token, token_hash


def hash_token(token: str) -> str:
    """Hashes a token for secure storage."""
    return hashlib.sha256(token.encode()).hexdigest()


def is_invitation_valid(invitation) -> bool:
    """
    Checks if an invitation is still valid.
    """
    if invitation.used_at is not None and invitation.use_count >= invitation.max_uses:
        return False
    
    if invitation.expires_at and invitation.expires_at < datetime.now(UTC):
        return False
    
    return True