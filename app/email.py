from pydantic import EmailStr
from . import schemas

def send_email(email_to: EmailStr, subject: str, body: str):
    """
    Mock function to "send" an email.
    In a real application, this would use a service like SendGrid or AWS SES.
    For the MVP, it just prints the would-be email to the console.
    """
    print("=" * 50)
    print(f"MOCK EMAIL-SENDING-SERVICE")
    print("-" * 50)
    print(f"Recipient: {email_to}")
    print(f"Subject: {subject}")
    print("-" * 50)
    print("Body:")
    print(body)
    print("=" * 50)
    print("Email successfully 'sent' to console.")

def send_new_survey_notification(member: schemas.Member, survey: schemas.Survey):
    """
    Sends a notification to a member about a new survey being available.
    """
    subject = f"Your Feedback Matters: New BVMW Survey '{survey.title}'"
    body = f"""
    Dear {member.name or 'BVMW Member'},

    We invite you to participate in our latest survey: "{survey.title}".

    Your feedback is crucial for helping us improve our services and better represent your interests.

    Please log in to the BVMW Survey Platform to complete the survey.

    Thank you for your valuable contribution.

    Best regards,
    The BVMW Team
    """
    send_email(email_to=member.email, subject=subject, body=body)
