#\!/bin/bash

echo "Complete Azure OpenAI integration test for HGRAG"
echo "==============================================="

# Step 8: Azure Retrieval
echo -e "\nStep 8: Azure Retrieval"
echo "----------------------"
poetry run hgrag-retrieve-azure --q "vitamin information" --final-k 3 2>/dev/null > outputs/azure_retrieval_results.jsonl
if [ -s outputs/azure_retrieval_results.jsonl ]; then
    RESULTS=$(cat outputs/azure_retrieval_results.jsonl | jq -r '.total_results')
    echo "✓ Azure retrieval successful: Found $RESULTS results"
else
    echo "✗ Azure retrieval failed"
fi

# Step 9: Azure Answer Generation
echo -e "\nStep 9: Azure Answer Generation"
echo "-------------------------------"
CONTEXT=$(cat outputs/azure_retrieval_results.jsonl 2>/dev/null | jq -r '.results[0].text' | head -200)
poetry run hgrag-answer-azure --q "What vitamin information is available?" --model gpt-4.1 --context "$CONTEXT" > outputs/azure_answer.json 2>/dev/null
if [ -s outputs/azure_answer.json ]; then
    echo "✓ Azure answer generation successful"
    echo "Answer preview:"
    cat outputs/azure_answer.json | jq -r '.answer' | head -3
else
    echo "✗ Azure answer generation failed"
fi

echo -e "\n✅ Azure integration testing complete\!"
echo "Results saved in outputs/azure_*.json"
