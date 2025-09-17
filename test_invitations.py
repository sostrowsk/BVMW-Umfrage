#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

# Test credentials
email = "test@example.com"
password = "testpassword"

def get_token():
    """Login and get access token"""
    response = requests.post(
        f"{BASE_URL}/auth/token",
        data={"username": email, "password": password}
    )
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"Login failed: {response.status_code}")
        print(response.json())
        return None

def test_anonymous_link(token, survey_id):
    """Test creating an anonymous survey link"""
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.post(
        f"{BASE_URL}/surveys/{survey_id}/anonymous-link",
        headers=headers,
        params={"expires_in_days": 7, "max_uses": 100}
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Anonymous link created successfully!")
        print(f"   Token: {data['token']}")
        print(f"   URL: {data.get('invitation_url', 'N/A')}")
        print(f"   Max uses: {data['max_uses']}")
        print(f"   Expires: {data['expires_at']}")
        return data['token']
    else:
        print(f"❌ Failed to create anonymous link: {response.status_code}")
        print(response.json())
        return None

def test_public_survey_access(token):
    """Test accessing a survey with an invitation token (no auth required)"""
    response = requests.get(f"{BASE_URL}/surveys/public/{token}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Public survey accessed successfully!")
        print(f"   Title: {data['title']}")
        print(f"   Status: {data['status']}")
        print(f"   Invitation valid: {data['invitation_valid']}")
        return True
    else:
        print(f"❌ Failed to access public survey: {response.status_code}")
        print(response.json())
        return False

def get_surveys(token):
    """Get list of surveys"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/surveys", headers=headers)
    
    if response.status_code == 200:
        surveys = response.json()
        if surveys:
            print(f"Found {len(surveys)} surveys")
            return surveys[0]["id"]  # Return first survey ID
        else:
            print("No surveys found. Please create a survey first.")
            return None
    else:
        print(f"Failed to get surveys: {response.status_code}")
        return None

def main():
    print("Testing Survey Invitation System")
    print("=" * 50)
    
    # Get authentication token
    print("\n1. Authenticating...")
    auth_token = get_token()
    if not auth_token:
        print("Please ensure test user exists or create one first")
        return
    
    print("✅ Authentication successful!")
    
    # Get a survey to test with
    print("\n2. Getting survey to test with...")
    survey_id = get_surveys(auth_token)
    if not survey_id:
        print("Please create a survey first using the web interface")
        return
    
    print(f"✅ Using survey ID: {survey_id}")
    
    # Test anonymous link creation
    print("\n3. Creating anonymous survey link...")
    invitation_token = test_anonymous_link(auth_token, survey_id)
    
    if invitation_token:
        # Test public access (no authentication required)
        print("\n4. Testing public survey access (no auth)...")
        test_public_survey_access(invitation_token)
    
    print("\n" + "=" * 50)
    print("Testing complete!")
    
    if invitation_token:
        print(f"\n📋 You can now access the survey at:")
        print(f"   http://localhost:5173/survey/{invitation_token}")

if __name__ == "__main__":
    main()