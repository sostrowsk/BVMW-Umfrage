#!/usr/bin/env python3
import requests
import json
from datetime import datetime, UTC
import uuid
BASE_URL = "http://localhost:8000/api/v1"
def test_survey_results():
    print("Testing Survey Results Feature...")
    
    # Step 1: Login as admin
    print("\n1. Logging in as admin...")
    login_data = {
        "username": "test@example.com",
        "password": "Password1234!"
    }
    
    response = requests.post(f"{BASE_URL}/auth/token", data=login_data)
    if response.status_code != 200:
        print(f"Login failed: {response.status_code}")
        print(response.text)
        return
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✓ Login successful")
    
    # Step 2: Get list of surveys
    print("\n2. Getting list of surveys...")
    response = requests.get(f"{BASE_URL}/surveys", headers=headers)
    if response.status_code != 200:
        print(f"Failed to get surveys: {response.status_code}")
        return
    
    surveys = response.json()
    if not surveys:
        print("No surveys found. Creating a test survey...")
        
        # Create a test survey
        survey_data = {
            "title": "Test Survey for Results",
            "description": "Testing survey results feature",
            "status": "active",
            "config": {
                "questions": [
                    {
                        "id": "q1",
                        "type": "radio",
                        "text": "How satisfied are you?",
                        "required": True,
                        "options": [
                            {"value": "very", "label": "Very Satisfied"},
                            {"value": "somewhat", "label": "Somewhat Satisfied"},
                            {"value": "not", "label": "Not Satisfied"}
                        ]
                    },
                    {
                        "id": "q2",
                        "type": "scale",
                        "text": "Rate our service (1-5)",
                        "required": True,
                        "max": 5
                    },
                    {
                        "id": "q3",
                        "type": "text",
                        "text": "Any comments?",
                        "required": False
                    }
                ]
            }
        }
        
        response = requests.post(f"{BASE_URL}/surveys", json=survey_data, headers=headers)
        if response.status_code == 201:
            survey = response.json()
            print(f"✓ Created survey: {survey['title']}")
            survey_id = survey['id']
        else:
            print(f"Failed to create survey: {response.status_code}")
            print(response.text)
            return
    else:
        survey = surveys[0]
        survey_id = survey['id']
        print(f"✓ Found {len(surveys)} surveys, using: {survey['title']}")
    
    # Step 3: Submit some test responses
    print("\n3. Submitting test responses...")
    test_responses = [
        {
            "answers": {"q1": "very", "q2": 5, "q3": "Excellent service!"},
            "completed_at": datetime.now(UTC).isoformat()
        },
        {
            "answers": {"q1": "somewhat", "q2": 3, "q3": "Good but could be better"},
            "completed_at": datetime.now(UTC).isoformat()
        },
        {
            "answers": {"q1": "very", "q2": 4, "q3": ""},
            "completed_at": datetime.now(UTC).isoformat()
        },
        {
            "answers": {"q1": "not", "q2": 2, "q3": "Needs improvement"},
            "completed_at": datetime.now(UTC).isoformat()
        }
    ]
    
    for i, resp_data in enumerate(test_responses, 1):
        response = requests.post(
            f"{BASE_URL}/surveys/{survey_id}/responses",
            json=resp_data,
            headers=headers
        )
        if response.status_code == 201:
            print(f"  ✓ Response {i} submitted")
        else:
            print(f"  ✗ Failed to submit response {i}: {response.status_code}")
    
    # Step 4: Get survey responses using the new endpoint
    print("\n4. Getting survey responses...")
    response = requests.get(f"{BASE_URL}/surveys/{survey_id}/responses", headers=headers)
    
    if response.status_code == 200:
        responses = response.json()
        print(f"✓ Successfully retrieved {len(responses)} responses")
        
        # Display summary
        print("\nResponse Summary:")
        print("-" * 40)
        for i, resp in enumerate(responses[:3], 1):  # Show first 3
            print(f"Response {i}:")
            if resp.get('answers'):
                for key, value in resp['answers'].items():
                    print(f"  {key}: {value}")
            print()
        
        if len(responses) > 3:
            print(f"... and {len(responses) - 3} more responses")
    else:
        print(f"✗ Failed to get responses: {response.status_code}")
        print(response.text)
    
    # Step 5: Test analytics endpoint
    print("\n5. Getting survey analytics...")
    response = requests.get(f"{BASE_URL}/surveys/{survey_id}/analytics", headers=headers)
    
    if response.status_code == 200:
        analytics = response.json()
        print("✓ Analytics retrieved:")
        print(f"  - Survey: {analytics.get('title', 'N/A')}")
        print(f"  - Status: {analytics.get('status', 'N/A')}")
        print(f"  - Response Count: {analytics.get('response_count', 0)}")
        print(f"  - Max Responses: {analytics.get('max_responses', 'Unlimited')}")
    else:
        print(f"✗ Failed to get analytics: {response.status_code}")
    
    print("\n" + "=" * 50)
    print("✅ Survey Results Feature Test Complete!")
    print("=" * 50)
    print("\nYou can now:")
    print(f"1. Visit http://localhost:5173/")
    print(f"2. Login with test@example.com / Password1234!")
    print(f"3. Navigate to Surveys")
    print(f"4. Click the green chart icon to view results for any survey")
    print(f"5. The results page will show charts and allow CSV export")
if __name__ == "__main__":
    test_survey_results()