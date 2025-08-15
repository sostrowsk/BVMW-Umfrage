#\!/bin/bash

echo "Testing Azure OpenAI integration in HGRAG pipeline"
echo "==========================================="

# Test Azure embeddings
echo -e "\n1. Testing Azure Embeddings..."
echo '{"text": "Azure OpenAI test document", "doc_id": "azure_test_1", "chunk_id": 1}' | poetry run hgrag-embed-azure --model text-embedding-3-large > /tmp/azure_embed.jsonl 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✓ Azure embeddings working"
else
    echo "✗ Azure embeddings failed"
fi

# Test Azure answer generation
echo -e "\n2. Testing Azure Answer Generation..."
poetry run hgrag-answer-azure --q "What is Azure OpenAI?" --model gpt-4.1 > /tmp/azure_answer.json 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✓ Azure answer generation working"
    echo "Sample response:"
    cat /tmp/azure_answer.json | jq -r '.answer' | head -2
else
    echo "✗ Azure answer generation failed"
fi

# Test Azure retrieval (if data exists)
echo -e "\n3. Testing Azure Retrieval..."
poetry run hgrag-retrieve-azure --q "vitamin" --final-k 2 2>/dev/null | jq -r '.total_results' > /tmp/retrieval_count.txt
COUNT=$(cat /tmp/retrieval_count.txt)
if [ "$COUNT" -gt 0 ]; then
    echo "✓ Azure retrieval working (found $COUNT results)"
else
    echo "⚠ No retrieval results found (may need to index data)"
fi

echo -e "\n✅ Azure integration test complete\!"
